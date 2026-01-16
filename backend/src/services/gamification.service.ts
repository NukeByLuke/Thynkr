/**
 * Gamification Service
 * Handles multi-tier achievement system and XP progression
 */

import { PrismaClient, AchievementTier } from '@prisma/client';

const prisma = new PrismaClient();

// ============ ACHIEVEMENT DEFINITIONS ============

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
  thresholds: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    RUBY: number;
  };
  xpRewards: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    RUBY: number;
  };
  isMastery?: boolean;
}

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // ============ TIERED ACHIEVEMENTS (20) ============
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    description: 'Total hours spent studying',
    icon: 'book',
    category: 'study',
    thresholds: { BRONZE: 10, SILVER: 50, GOLD: 100, PLATINUM: 500, RUBY: 1000 },
    xpRewards: { BRONZE: 50, SILVER: 200, GOLD: 500, PLATINUM: 2000, RUBY: 5000 },
  },
  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Consecutive days of studying',
    icon: 'flame',
    category: 'streak',
    thresholds: { BRONZE: 3, SILVER: 7, GOLD: 14, PLATINUM: 30, RUBY: 100 },
    xpRewards: { BRONZE: 50, SILVER: 150, GOLD: 400, PLATINUM: 1500, RUBY: 4000 },
  },
  quiz_whiz: {
    id: 'quiz_whiz',
    name: 'Quiz Whiz',
    description: 'Perfect quiz scores achieved',
    icon: 'target',
    category: 'skill',
    thresholds: { BRONZE: 1, SILVER: 5, GOLD: 10, PLATINUM: 25, RUBY: 50 },
    xpRewards: { BRONZE: 50, SILVER: 200, GOLD: 450, PLATINUM: 1800, RUBY: 4500 },
  },
  librarian: {
    id: 'librarian',
    name: 'Librarian',
    description: 'Study materials uploaded',
    icon: 'library',
    category: 'content',
    thresholds: { BRONZE: 5, SILVER: 20, GOLD: 50, PLATINUM: 150, RUBY: 500 },
    xpRewards: { BRONZE: 50, SILVER: 180, GOLD: 420, PLATINUM: 1600, RUBY: 4200 },
  },
  socialite: {
    id: 'socialite',
    name: 'Socialite',
    description: 'Study sessions shared with others',
    icon: 'share-2',
    category: 'social',
    thresholds: { BRONZE: 3, SILVER: 10, GOLD: 25, PLATINUM: 75, RUBY: 200 },
    xpRewards: { BRONZE: 50, SILVER: 170, GOLD: 400, PLATINUM: 1500, RUBY: 4000 },
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Quiz questions answered in under 5 seconds',
    icon: 'zap',
    category: 'skill',
    thresholds: { BRONZE: 10, SILVER: 50, GOLD: 150, PLATINUM: 500, RUBY: 1500 },
    xpRewards: { BRONZE: 50, SILVER: 190, GOLD: 470, PLATINUM: 1900, RUBY: 4700 },
  },
  note_taker: {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'AI-generated notes created',
    icon: 'file-text',
    category: 'content',
    thresholds: { BRONZE: 5, SILVER: 25, GOLD: 75, PLATINUM: 200, RUBY: 600 },
    xpRewards: { BRONZE: 50, SILVER: 180, GOLD: 440, PLATINUM: 1700, RUBY: 4400 },
  },
  flashcard_master: {
    id: 'flashcard_master',
    name: 'Flashcard Master',
    description: 'Flashcard sets completed',
    icon: 'layers',
    category: 'study',
    thresholds: { BRONZE: 3, SILVER: 15, GOLD: 40, PLATINUM: 120, RUBY: 350 },
    xpRewards: { BRONZE: 50, SILVER: 175, GOLD: 430, PLATINUM: 1650, RUBY: 4300 },
  },

  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Study sessions started before 8 AM',
    icon: 'sun',
    category: 'streak',
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 35, PLATINUM: 100, RUBY: 300 },
    xpRewards: { BRONZE: 50, SILVER: 165, GOLD: 410, PLATINUM: 1550, RUBY: 4100 },
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study sessions after 10 PM',
    icon: 'moon',
    category: 'streak',
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 35, PLATINUM: 100, RUBY: 300 },
    xpRewards: { BRONZE: 50, SILVER: 165, GOLD: 410, PLATINUM: 1550, RUBY: 4100 },
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Hard difficulty quizzes completed with 100% score',
    icon: 'award',
    category: 'skill',
    thresholds: { BRONZE: 1, SILVER: 3, GOLD: 8, PLATINUM: 20, RUBY: 50 },
    xpRewards: { BRONZE: 50, SILVER: 220, GOLD: 520, PLATINUM: 2100, RUBY: 5200 },
  },
  course_creator: {
    id: 'course_creator',
    name: 'Course Creator',
    description: 'Study courses created',
    icon: 'graduation-cap',
    category: 'content',
    thresholds: { BRONZE: 1, SILVER: 3, GOLD: 8, PLATINUM: 20, RUBY: 50 },
    xpRewards: { BRONZE: 50, SILVER: 210, GOLD: 500, PLATINUM: 2000, RUBY: 5000 },
  },
  marathon_runner: {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Single study sessions over 2 hours',
    icon: 'clock',
    category: 'study',
    thresholds: { BRONZE: 1, SILVER: 5, GOLD: 15, PLATINUM: 40, RUBY: 100 },
    xpRewards: { BRONZE: 50, SILVER: 195, GOLD: 480, PLATINUM: 1850, RUBY: 4800 },
  },
  consistent_learner: {
    id: 'consistent_learner',
    name: 'Consistent Learner',
    description: 'Weeks with at least 5 study days',
    icon: 'calendar',
    category: 'streak',
    thresholds: { BRONZE: 2, SILVER: 6, GOLD: 15, PLATINUM: 35, RUBY: 80 },
    xpRewards: { BRONZE: 50, SILVER: 175, GOLD: 440, PLATINUM: 1700, RUBY: 4400 },
  },

  knowledge_seeker: {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Unique topics studied',
    icon: 'search',
    category: 'study',
    thresholds: { BRONZE: 5, SILVER: 15, GOLD: 40, PLATINUM: 100, RUBY: 250 },
    xpRewards: { BRONZE: 50, SILVER: 175, GOLD: 435, PLATINUM: 1700, RUBY: 4350 },
  },
  summary_specialist: {
    id: 'summary_specialist',
    name: 'Summary Specialist',
    description: 'AI summaries generated',
    icon: 'file-text',
    category: 'content',
    thresholds: { BRONZE: 10, SILVER: 40, GOLD: 100, PLATINUM: 300, RUBY: 800 },
    xpRewards: { BRONZE: 50, SILVER: 185, GOLD: 455, PLATINUM: 1800, RUBY: 4550 },
  },
  community_helper: {
    id: 'community_helper',
    name: 'Community Helper',
    description: 'Study packs shared publicly',
    icon: 'heart',
    category: 'social',
    thresholds: { BRONZE: 2, SILVER: 8, GOLD: 20, PLATINUM: 50, RUBY: 150 },
    xpRewards: { BRONZE: 50, SILVER: 195, GOLD: 470, PLATINUM: 1850, RUBY: 4700 },
  },
  multilingual: {
    id: 'multilingual',
    name: 'Multilingual',
    description: 'Different languages used for study materials',
    icon: 'globe',
    category: 'skill',
    thresholds: { BRONZE: 2, SILVER: 3, GOLD: 5, PLATINUM: 8, RUBY: 12 },
    xpRewards: { BRONZE: 50, SILVER: 250, GOLD: 600, PLATINUM: 2400, RUBY: 6000 },
  },

  // ============ MASTERY ACHIEVEMENTS (5) ============
  mastery_scholar: {
    id: 'mastery_scholar',
    name: 'Scholar Mastery',
    description: 'Achieve ultimate study dedication - 5000 total study hours',
    icon: 'crown',
    category: 'mastery',
    thresholds: { BRONZE: 5000, SILVER: 5000, GOLD: 5000, PLATINUM: 5000, RUBY: 5000 },
    xpRewards: { BRONZE: 10000, SILVER: 10000, GOLD: 10000, PLATINUM: 10000, RUBY: 10000 },
    isMastery: true,
  },
  mastery_perfectionist: {
    id: 'mastery_perfectionist',
    name: 'Perfect Mastery',
    description: 'The ultimate perfectionist - 500 perfect hard quiz scores',
    icon: 'trophy',
    category: 'mastery',
    thresholds: { BRONZE: 500, SILVER: 500, GOLD: 500, PLATINUM: 500, RUBY: 500 },
    xpRewards: { BRONZE: 15000, SILVER: 15000, GOLD: 15000, PLATINUM: 15000, RUBY: 15000 },
    isMastery: true,
  },
  mastery_streak: {
    id: 'mastery_streak',
    name: 'Eternal Flame',
    description: 'Never let the flame die - 365 day study streak',
    icon: 'flame',
    category: 'mastery',
    thresholds: { BRONZE: 365, SILVER: 365, GOLD: 365, PLATINUM: 365, RUBY: 365 },
    xpRewards: { BRONZE: 20000, SILVER: 20000, GOLD: 20000, PLATINUM: 20000, RUBY: 20000 },
    isMastery: true,
  },
  mastery_content: {
    id: 'mastery_content',
    name: 'Content King',
    description: 'Master of creation - 1000 study materials created',
    icon: 'crown',
    category: 'mastery',
    thresholds: { BRONZE: 1000, SILVER: 1000, GOLD: 1000, PLATINUM: 1000, RUBY: 1000 },
    xpRewards: { BRONZE: 12000, SILVER: 12000, GOLD: 12000, PLATINUM: 12000, RUBY: 12000 },
    isMastery: true,
  },
  mastery_social: {
    id: 'mastery_social',
    name: 'Community Legend',
    description: 'Inspire the world - 500 materials shared publicly',
    icon: 'trophy',
    category: 'mastery',
    thresholds: { BRONZE: 500, SILVER: 500, GOLD: 500, PLATINUM: 500, RUBY: 500 },
    xpRewards: { BRONZE: 10000, SILVER: 10000, GOLD: 10000, PLATINUM: 10000, RUBY: 10000 },
    isMastery: true,
  },
};

// ============ ACHIEVEMENT TRACKING ACTIONS ============

export type AchievementAction =
  | 'study_hours'
  | 'study_streak'
  | 'quiz_perfect'
  | 'file_upload'
  | 'session_share'
  | 'quick_answer'
  | 'notes_created'
  | 'flashcard_completed'

  | 'early_study'
  | 'night_study'
  | 'hard_quiz_perfect'
  | 'course_created'
  | 'long_session'
  | 'weekly_consistency'

  | 'topic_studied'
  | 'summary_created'
  | 'pack_shared'
  | 'language_used';

const ACTION_TO_ACHIEVEMENT_MAP: Record<AchievementAction, string> = {
  study_hours: 'scholar',
  study_streak: 'streak_master',
  quiz_perfect: 'quiz_whiz',
  file_upload: 'librarian',
  session_share: 'socialite',
  quick_answer: 'speed_demon',
  notes_created: 'note_taker',
  flashcard_completed: 'flashcard_master',

  early_study: 'early_bird',
  night_study: 'night_owl',
  hard_quiz_perfect: 'perfectionist',
  course_created: 'course_creator',
  long_session: 'marathon_runner',
  weekly_consistency: 'consistent_learner',

  topic_studied: 'knowledge_seeker',
  summary_created: 'summary_specialist',
  pack_shared: 'community_helper',
  language_used: 'multilingual',
};

// ============ TIER ORDERING ============

const TIER_ORDER: AchievementTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY'];

function getNextTier(currentTier: AchievementTier): AchievementTier | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === TIER_ORDER.length - 1) {
    return null; // Already at max tier
  }
  return TIER_ORDER[currentIndex + 1];
}

// ============ MAIN ACHIEVEMENT CHECKING FUNCTION ============

export async function checkAchievements(
  userId: string,
  actionType: AchievementAction,
  value: number = 1
): Promise<{
  tierUnlocked: boolean;
  achievementId?: string;
  newTier?: AchievementTier;
  xpAwarded?: number;
  achievementName?: string;
}> {
  const achievementId = ACTION_TO_ACHIEVEMENT_MAP[actionType];
  
  if (!achievementId || !ACHIEVEMENTS[achievementId]) {
    return { tierUnlocked: false };
  }

  const achievement = ACHIEVEMENTS[achievementId];

  try {
    // Use transaction to ensure data integrity between achievement and XP updates
    const result = await prisma.$transaction(async (tx) => {
      // Get or create user achievement record
      let userAchievement = await tx.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
      });

      // Create if doesn't exist
      if (!userAchievement) {
        userAchievement = await tx.userAchievement.create({
          data: {
            userId,
            achievementId,
            currentTier: 'BRONZE',
            currentValue: value,
          },
        });
      } else {
        // Update current value
        userAchievement = await tx.userAchievement.update({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
          data: {
            currentValue: userAchievement.currentValue + value,
          },
        });
      }

      // Check if user has reached next tier threshold (support multiple tier jumps)
      let currentCheckTier = userAchievement.currentTier;
      let tiersUnlocked: { tier: AchievementTier; xp: number }[] = [];
      
      // Loop through all potential tier upgrades
      while (true) {
        const nextTier = getNextTier(currentCheckTier);
        
        if (!nextTier) {
          // Already at max tier or no more tiers available
          break;
        }

        const nextThreshold = achievement.thresholds[nextTier];
        
        if (userAchievement.currentValue >= nextThreshold) {
          // User qualifies for this tier
          tiersUnlocked.push({
            tier: nextTier,
            xp: achievement.xpRewards[nextTier],
          });
          currentCheckTier = nextTier;
        } else {
          // User hasn't reached this tier yet
          break;
        }
      }
      
      // If tiers were unlocked, update the database
      if (tiersUnlocked.length > 0) {
        const highestTierUnlocked = tiersUnlocked[tiersUnlocked.length - 1];
        const totalXpAwarded = tiersUnlocked.reduce((sum, t) => sum + t.xp, 0);
        
        // Update to highest tier achieved
        await tx.userAchievement.update({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
          data: {
            currentTier: highestTierUnlocked.tier,
          },
        });

        // Award total XP from all tiers
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: totalXpAwarded,
            },
            lastXpGain: new Date(),
          },
          select: { xp: true, level: true },
        });

        // Calculate new level based on XP
        const newLevel = calculateLevel(updatedUser.xp);
        if (newLevel > updatedUser.level) {
          await tx.user.update({
            where: { id: userId },
            data: { level: newLevel },
          });
        }

        return {
          tierUnlocked: true,
          achievementId,
          newTier: highestTierUnlocked.tier,
          xpAwarded: totalXpAwarded,
          achievementName: achievement.name,
        };
      }

      return { tierUnlocked: false };
    });

    return result;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return { tierUnlocked: false };
  }
}

// ============ XP & LEVEL CALCULATION ============

/**
 * Calculate user level based on total XP
 * Formula: Level = floor(sqrt(XP / 100)) + 1
 * Ensures exponential growth requirement
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * Calculate XP required for a specific level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 100;
}

/**
 * Get XP progress for current level
 */
export function getLevelProgress(xp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercentage = (xpInCurrentLevel / xpRequiredForNextLevel) * 100;

  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}

// ============ HELPER FUNCTIONS ============

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
  });

  // Create a map of user's current progress
  const progressMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua])
  );

  // Return all achievements with user's progress data
  return Object.values(ACHIEVEMENTS).map((achievement) => {
    const userProgress = progressMap.get(achievement.id);

    if (userProgress) {
      // User has progress on this achievement
      const nextTier = getNextTier(userProgress.currentTier);
      const nextThreshold = nextTier ? achievement.thresholds[nextTier] : null;

      return {
        ...userProgress,
        definition: achievement,
        progress: nextThreshold
          ? {
              current: userProgress.currentValue,
              required: nextThreshold,
              percentage: Math.min(100, (userProgress.currentValue / nextThreshold) * 100),
            }
          : null,
      };
    } else {
      // User hasn't started this achievement yet
      return {
        id: `temp-${achievement.id}`, // Temporary ID for frontend
        achievementId: achievement.id,
        userId,
        currentTier: null,
        currentValue: 0,
        unlockedAt: null,
        updatedAt: new Date(),
        definition: achievement,
        progress: {
          current: 0,
          required: achievement.thresholds.BRONZE,
          percentage: 0,
        },
      };
    }
  });
}

/**
 * Get all available achievement definitions
 */
export function getAllAchievementDefinitions() {
  return Object.values(ACHIEVEMENTS);
}

export default {
  checkAchievements,
  getUserAchievements,
  getAllAchievementDefinitions,
  calculateLevel,
  xpForLevel,
  getLevelProgress,
  ACHIEVEMENTS,
};
