import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../db/client';
import Redis from 'ioredis';
import { getUserAchievements, ACHIEVEMENTS } from '../services/gamification.service';

// Redis client with error handling - optional caching
let redis: Redis | null = null;
let redisConnected = false;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying - run without cache
      }
      return Math.min(times * 100, 1000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    redisConnected = true;
  });

  redis.on('error', () => {
    // Silently mark as disconnected
    redisConnected = false;
  });

  // Attempt connection
  redis.connect().catch(() => {
    redisConnected = false;
  });
} catch {
  // Redis not available - run without cache
}

// Helper to safely get from cache
async function cacheGet(key: string): Promise<string | null> {
  if (!redis || !redisConnected) return null;
  try {
    return await redis.get(key);
  } catch {
    return null;
  }
}

// Helper to safely set cache
async function cacheSet(key: string, ttl: number, value: string): Promise<void> {
  if (!redis || !redisConnected) return;
  try {
    await redis.setex(key, ttl, value);
  } catch {
    // Ignore cache write failures
  }
}

// XP System
const XP_PER_SESSION = 10;
const XP_PER_MINUTE = 2;
const XP_PER_STREAK_DAY = 5;
const XP_FOR_QUIZ = 15;
const XP_BONUS_PERFECT_QUIZ = 25;

// Calculate user level from total XP
function calculateLevel(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
} {
  // Level formula: level = floor(sqrt(xp / 100))
  const level = Math.floor(Math.sqrt(xp / 100));
  const currentLevelXp = level * level * 100;
  const nextLevelXp = (level + 1) * (level + 1) * 100;

  return {
    level: Math.max(1, level),
    currentLevelXp: xp - currentLevelXp,
    nextLevelXp: nextLevelXp - currentLevelXp,
  };
}

// Calculate total XP from user stats
function calculateTotalXP(stats: {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  totalQuizzes: number;
  perfectQuizzes: number;
}): number {
  return (
    stats.totalSessions * XP_PER_SESSION +
    stats.totalMinutes * XP_PER_MINUTE +
    stats.currentStreak * XP_PER_STREAK_DAY +
    stats.totalQuizzes * XP_FOR_QUIZ +
    stats.perfectQuizzes * XP_BONUS_PERFECT_QUIZ
  );
}

export default async function progressRoutes(server: FastifyInstance) {
  // Get enhanced user progress with XP and visualizations
  server.get(
    '/stats',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;

      try {
        // Check Redis cache first (5 min TTL)
        const cacheKey = `progress:${userId}`;
        const cached = await cacheGet(cacheKey);
        if (cached) {
          return reply.send(JSON.parse(cached));
        }

        // Get or create streak record
        let streak = await prisma.studyStreak.findUnique({
          where: { userId },
        });

        if (!streak) {
          streak = await prisma.studyStreak.create({
            data: { userId },
          });
        }

        // Get all sessions for XP calculation
        const allSessions = await prisma.studySession.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        });

        // Get 30-day historical data for graphs
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentSessions = await prisma.studySession.findMany({
          where: {
            userId,
            createdAt: { gte: thirtyDaysAgo },
          },
          orderBy: { createdAt: 'asc' },
        });

        // Calculate daily XP over time
        const dailyXpMap = new Map<string, number>();
        const dailySessionsMap = new Map<string, number>();
        const subjectMap = new Map<string, number>();

        recentSessions.forEach((session) => {
          const date = session.createdAt.toISOString().split('T')[0];
          const sessionXp = XP_PER_SESSION + (session.durationMinutes || 0) * XP_PER_MINUTE;

          dailyXpMap.set(date, (dailyXpMap.get(date) || 0) + sessionXp);
          dailySessionsMap.set(date, (dailySessionsMap.get(date) || 0) + 1);

          // Track subjects (activity types)
          subjectMap.set(session.activityType, (subjectMap.get(session.activityType) || 0) + 1);
        });

        // Build XP over time array
        const xpOverTime = Array.from(dailyXpMap.entries())
          .map(([date, xp]) => ({ date, xp, sessions: dailySessionsMap.get(date) || 0 }))
          .sort((a, b) => a.date.localeCompare(b.date));

        // Calculate cumulative XP
        let cumulativeXp = 0;
        const cumulativeXpData = xpOverTime.map((day) => {
          cumulativeXp += day.xp;
          return { ...day, totalXp: cumulativeXp };
        });

        // Get quiz performance
        const quizzes = await prisma.quizAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        });

        const perfectQuizzes = quizzes.filter((q) => q.score === 100).length;

        // Get unlocked achievements and calculate achievement XP
        const userAchievements = await prisma.userAchievement.findMany({
          where: {
            userId,
          },
        });

        // Calculate total XP from achievements (cumulative for all tiers)
        let achievementXP = 0;
        const tierOrder: ('COPPER' | 'GOLD' | 'RUBY' | 'AMETHYST' | 'DIAMOND')[] = ['COPPER', 'GOLD', 'RUBY', 'AMETHYST', 'DIAMOND'];
        
        userAchievements.forEach((userAchievement) => {
          const achievement = ACHIEVEMENTS[userAchievement.achievementId];
          if (achievement && userAchievement.currentTier) {
            // Calculate cumulative XP: add all tier XP from BRONZE up to current tier
            const currentTierIndex = tierOrder.indexOf(userAchievement.currentTier as any);
            if (currentTierIndex !== -1) {
              for (let i = 0; i <= currentTierIndex; i++) {
                const tier = tierOrder[i];
                achievementXP += achievement.xpRewards[tier] || 0;
              }
            }
          }
        });

        // Calculate session/quiz XP
        const sessionQuizXP = calculateTotalXP({
          totalSessions: allSessions.length,
          totalMinutes: streak.totalMinutes || 0,
          currentStreak: streak.currentStreak || 0,
          totalQuizzes: quizzes.length,
          perfectQuizzes,
        });

        // Total XP includes both session/quiz XP and achievement XP
        const totalXP = sessionQuizXP + achievementXP;

        const levelData = calculateLevel(totalXP);

        // Streak graph data (last 30 days)
        const streakData = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          const dateStr = date.toISOString().split('T')[0];
          return {
            date: dateStr,
            sessions: dailySessionsMap.get(dateStr) || 0,
            active: dailySessionsMap.has(dateStr),
          };
        });

        // Subjects studied breakdown
        const subjectsStudied = Array.from(subjectMap.entries()).map(([type, count]) => ({
          subject: type.replace(/_/g, ' ').toLowerCase(),
          count,
          percentage: Math.round((count / recentSessions.length) * 100),
        }));

        const response = {
          xp: {
            total: totalXP,
            level: levelData.level,
            currentLevelXp: levelData.currentLevelXp,
            nextLevelXp: levelData.nextLevelXp,
            progress: Math.round((levelData.currentLevelXp / levelData.nextLevelXp) * 100),
          },
          streak: {
            current: streak.currentStreak || 0,
            longest: streak.longestStreak || 0,
            totalDays: streak.totalStudyDays || 0,
            totalMinutes: streak.totalMinutes || 0,
            lastStudyDate: streak.lastStudyDate,
          },
          graphs: {
            xpOverTime: cumulativeXpData,
            streakCalendar: streakData,
            subjectsStudied,
          },
          totals: {
            sessions: allSessions.length,
            quizzes: quizzes.length,
            averageScore:
              quizzes.length > 0
                ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length)
                : 0,
          },
        };

        // Cache for 5 minutes
        await cacheSet(cacheKey, 300, JSON.stringify(response));

        return reply.send(response);
      } catch (error) {
        server.log.error({ error, userId }, 'Failed to fetch progress stats');
        return reply.code(500).send({ error: 'Failed to fetch progress stats' });
      }
    }
  );

  // Get user achievements
  server.get(
    '/achievements',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;

      try {
        const achievements = await getUserAchievements(userId);
        return reply.send(achievements);
      } catch (error) {
        server.log.error({ error, userId }, 'Failed to fetch achievements');
        return reply.code(500).send({ error: 'Failed to fetch achievements' });
      }
    }
  );

  // Original progress endpoint for backward compatibility
  server.get(
    '/',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;

      // Get or create streak record
      let streak = await prisma.studyStreak.findUnique({
        where: { userId },
      });

      if (!streak) {
        streak = await prisma.studyStreak.create({
          data: { userId },
        });
      }

      // Get study sessions for the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentSessions = await prisma.studySession.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Get activity breakdown
      const activityBreakdown = await prisma.studySession.groupBy({
        by: ['activityType'],
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        _count: true,
        _sum: {
          durationMinutes: true,
        },
      });

      // Get daily activity for the past 7 days
      const dailyActivity: Record<string, { count: number; minutes: number }> = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dailyActivity[dateStr] = { count: 0, minutes: 0 };
      }

      recentSessions.forEach((session) => {
        const dateStr = session.createdAt.toISOString().split('T')[0];
        if (dailyActivity[dateStr]) {
          dailyActivity[dateStr].count++;
          dailyActivity[dateStr].minutes += session.durationMinutes;
        }
      });

      // Get quiz performance
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: {
          userId,
          createdAt: { gte: sevenDaysAgo },
        },
        select: {
          score: true,
          totalQuestions: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      const totalQuizScore = quizAttempts.reduce((sum, a) => sum + a.score, 0);
      const totalQuizQuestions = quizAttempts.reduce((sum, a) => sum + a.totalQuestions, 0);
      const averageQuizScore =
        totalQuizQuestions > 0 ? Math.round((totalQuizScore / totalQuizQuestions) * 100) : 0;

      // Get course progress
      const coursesStudied = await prisma.studySession.findMany({
        where: {
          userId,
          fileId: { not: null },
        },
        select: {
          fileId: true,
        },
        distinct: ['fileId'],
      });

      return reply.send({
        streak: {
          current: streak.currentStreak,
          longest: streak.longestStreak,
          lastStudyDate: streak.lastStudyDate,
          totalDays: streak.totalStudyDays,
          totalMinutes: streak.totalMinutes,
        },
        weeklyStats: {
          sessionsCount: recentSessions.length,
          totalMinutes: recentSessions.reduce((sum, s) => sum + s.durationMinutes, 0),
          dailyActivity: Object.entries(dailyActivity)
            .map(([date, data]) => ({ date, ...data }))
            .reverse(),
          activityBreakdown: activityBreakdown.map((a) => ({
            type: a.activityType,
            count: a._count,
            minutes: a._sum.durationMinutes || 0,
          })),
        },
        quizPerformance: {
          recentAttempts: quizAttempts.length,
          averageScore: averageQuizScore,
        },
        filesStudied: coursesStudied.length,
      });
    }
  );

  // Record a study session
  server.post(
    '/session',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const { activityType, fileId, durationMinutes } = request.body as {
        activityType:
          | 'FILE_UPLOAD'
          | 'SUMMARY_VIEW'
          | 'NOTES_VIEW'
          | 'QUIZ_ATTEMPT'
          | 'FLASHCARD_STUDY';
        fileId?: string;
        durationMinutes?: number;
      };

      if (!activityType) {
        return reply.code(400).send({ error: 'Activity type is required' });
      }

      // Create study session
      const session = await prisma.studySession.create({
        data: {
          userId,
          activityType,
          fileId,
          durationMinutes: durationMinutes || 1,
        },
      });

      // Update streak
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let streak = await prisma.studyStreak.findUnique({
        where: { userId },
      });

      if (!streak) {
        streak = await prisma.studyStreak.create({
          data: {
            userId,
            currentStreak: 1,
            longestStreak: 1,
            lastStudyDate: today,
            totalStudyDays: 1,
            totalMinutes: durationMinutes || 1,
          },
        });
      } else {
        const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
        lastStudy?.setHours(0, 0, 0, 0);

        let newCurrentStreak = streak.currentStreak;
        let newTotalDays = streak.totalStudyDays;

        if (!lastStudy) {
          // First study session ever
          newCurrentStreak = 1;
          newTotalDays = 1;
        } else if (lastStudy.getTime() === today.getTime()) {
          // Already studied today, just update minutes
        } else {
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastStudy.getTime() === yesterday.getTime()) {
            // Continued streak
            newCurrentStreak = streak.currentStreak + 1;
            newTotalDays = streak.totalStudyDays + 1;
          } else {
            // Streak broken
            newCurrentStreak = 1;
            newTotalDays = streak.totalStudyDays + 1;
          }
        }

        streak = await prisma.studyStreak.update({
          where: { userId },
          data: {
            currentStreak: newCurrentStreak,
            longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
            lastStudyDate: today,
            totalStudyDays: newTotalDays,
            totalMinutes: streak.totalMinutes + (durationMinutes || 1),
          },
        });
      }

      return reply.send({
        session,
        streak: {
          current: streak.currentStreak,
          longest: streak.longestStreak,
        },
      });
    }
  );

  // Get leaderboard with XP and levels (Redis cached)
  server.get(
    '/leaderboard',
    {
      preHandler: [authenticate],
    },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        // Check Redis cache (10 min TTL)
        const leaderboardKey = 'leaderboard:xp';
        const cached = await cacheGet(leaderboardKey);

        if (cached) {
          return reply.send(JSON.parse(cached));
        }

        const topStreaks = await prisma.studyStreak.findMany({
          orderBy: { currentStreak: 'desc' },
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        });

        // Calculate XP and level for each user
        const leaderboard = await Promise.all(
          topStreaks.map(async (s, index) => {
            const sessions = await prisma.studySession.count({
              where: { userId: s.userId },
            });

            const quizzes = await prisma.quizAttempt.findMany({
              where: { userId: s.userId },
              select: { score: true },
            });

            const perfectQuizzes = quizzes.filter((q) => q.score === 100).length;

            const totalXP = calculateTotalXP({
              totalSessions: sessions,
              totalMinutes: s.totalMinutes || 0,
              currentStreak: s.currentStreak || 0,
              totalQuizzes: quizzes.length,
              perfectQuizzes,
            });

            const levelData = calculateLevel(totalXP);

            return {
              rank: index + 1,
              userId: s.user.id,
              username: s.user.username,
              avatarUrl: s.user.avatarUrl,
              currentStreak: s.currentStreak,
              longestStreak: s.longestStreak,
              totalMinutes: s.totalMinutes,
              xp: totalXP,
              level: levelData.level,
            };
          })
        );

        // Sort by XP
        leaderboard.sort((a, b) => b.xp - a.xp);
        leaderboard.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        const response = { leaderboard };

        // Cache for 10 minutes
        await cacheSet(leaderboardKey, 600, JSON.stringify(response));

        return reply.send(response);
      } catch (error) {
        server.log.error({ error }, 'Failed to fetch leaderboard');
        return reply.code(500).send({ error: 'Failed to fetch leaderboard' });
      }
    }
  );
}
