import bcrypt from 'bcryptjs';
import prisma from './client';
import { logger } from '../lib/logger';
import seedCoursesWithInternalFiles from './seed-courses-internal';
import { ACHIEVEMENTS, AchievementDefinition } from '../services/gamification.service';
import { AchievementTier } from '@prisma/client';

/**
 * Thynkr Database Seed Script
 * 
 * Seeds the database with clean sample data:
 * - 4 Users: basic, standard, premium, admin (all @thynkr.ca)
 * - 5+ Courses with realistic academic content
 * - Sample content articles
 * - User achievements with varied, realistic progress
 */

// ============ HELPER FUNCTIONS ============

/**
 * Calculates the appropriate tier for a given currentValue and achievement thresholds
 * Returns null if below BRONZE threshold
 */
function calculateTier(
  currentValue: number,
  thresholds: AchievementDefinition['thresholds']
): AchievementTier | null {
  if (currentValue >= thresholds.DIAMOND) return AchievementTier.DIAMOND;
  if (currentValue >= thresholds.AMETHYST) return AchievementTier.AMETHYST;
  if (currentValue >= thresholds.RUBY) return AchievementTier.RUBY;
  if (currentValue >= thresholds.GOLD) return AchievementTier.GOLD;
  if (currentValue >= thresholds.COPPER) return AchievementTier.COPPER;
  return null; // Below copper threshold - locked
}

/**
 * Generates a random value within a range
 */
function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate user level from XP (formula: sqrt(xp/100))
 */
function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

async function clearDatabase() {
  logger.info('🗑️  Wiping database completely...');

  // Clear in order respecting foreign key constraints
  // Most dependent tables first
  // Wrap in try-catch to handle tables that might not exist
  const deletions = [
    { name: 'userAchievement', fn: () => prisma.userAchievement.deleteMany({}) },
    { name: 'studyCache', fn: () => prisma.studyCache.deleteMany({}) },
    { name: 'studyPack', fn: () => prisma.studyPack.deleteMany({}) },
    { name: 'studySession', fn: () => prisma.studySession.deleteMany({}) },
    { name: 'studyStreak', fn: () => prisma.studyStreak.deleteMany({}) },
    { name: 'courseFileAI', fn: () => prisma.courseFileAI.deleteMany({}) },
    { name: 'courseFile', fn: () => prisma.courseFile.deleteMany({}) },
    { name: 'course', fn: () => prisma.course.deleteMany({}) },
    { name: 'flashcard', fn: () => prisma.flashcard.deleteMany({}) },
    { name: 'flashcardSet', fn: () => prisma.flashcardSet.deleteMany({}) },
    { name: 'quizAttempt', fn: () => prisma.quizAttempt.deleteMany({}) },
    { name: 'quizQuestion', fn: () => prisma.quizQuestion.deleteMany({}) },
    { name: 'quiz', fn: () => prisma.quiz.deleteMany({}) },
    { name: 'fileNotes', fn: () => prisma.fileNotes.deleteMany({}) },
    { name: 'fileSummary', fn: () => prisma.fileSummary.deleteMany({}) },
    { name: 'uploadedFile', fn: () => prisma.uploadedFile.deleteMany({}) },
    { name: 'folder', fn: () => prisma.folder.deleteMany({}) },
    { name: 'payment', fn: () => prisma.payment.deleteMany({}) },
    { name: 'subscription', fn: () => prisma.subscription.deleteMany({}) },
    { name: 'refreshToken', fn: () => prisma.refreshToken.deleteMany({}) },
    { name: 'adminLog', fn: () => prisma.adminLog.deleteMany({}) },
    { name: 'content', fn: () => prisma.content.deleteMany({}) },
    { name: 'user', fn: () => prisma.user.deleteMany({}) },
  ];

  for (const deletion of deletions) {
    try {
      await deletion.fn();
    } catch (error: any) {
      // Table might not exist - skip silently
      if (error?.code !== 'P2021') {
        // Re-throw if it's not a "table doesn't exist" error
        throw error;
      }
    }
  }

  logger.info('   ✓ Database wiped completely');
}

async function seedUsers() {
  logger.info('👥 Seeding users...');

  const users = [
    {
      email: 'basic@thynkr.ca',
      username: 'basic',
      password: 'Password123!',
      firstName: 'Basic',
      lastName: 'User',
      role: 'BASIC' as const,
      emailVerified: true,
    },
    {
      email: 'standard@thynkr.ca',
      username: 'standard',
      password: 'Password123!',
      firstName: 'Standard',
      lastName: 'User',
      role: 'STANDARD' as const,
      emailVerified: true,
    },
    {
      email: 'premium@thynkr.ca',
      username: 'premium',
      password: 'Password123!',
      firstName: 'Premium',
      lastName: 'User',
      role: 'PREMIUM' as const,
      emailVerified: true,
    },
    {
      email: 'admin@thynkr.ca',
      username: 'admin',
      password: 'Password123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
      emailVerified: true,
    },
  ];

  const createdUsers: { [key: string]: string } = {};

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    const user = await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    createdUsers[userData.username] = user.id;
    logger.info(`   ✓ ${userData.firstName} ${userData.lastName} (${userData.role})`);
  }

  logger.info(`👥 Created ${users.length} users`);
  return createdUsers;
}

async function seedContent() {
  logger.info('📝 Seeding sample content...');

  const sampleContent = [
    {
      title: 'Welcome to Thynkr',
      description: 'Get started with our AI-powered learning platform',
      content: `# Welcome to Thynkr

Welcome to Thynkr — your intelligent study companion powered by AI.

## What is Thynkr?

Thynkr transforms how you learn by using artificial intelligence to:

- 📚 **Generate summaries** from your course materials
- 📝 **Create study notes** tailored to your content
- ❓ **Build quizzes** to test your knowledge
- 🃏 **Make flashcards** for spaced repetition
- 🤖 **Chat with an AI tutor** that understands your materials

## Getting Started

1. **Upload your materials** — PDFs, documents, or text files
2. **Let AI analyze** your content
3. **Study smarter** with generated materials
4. **Track your progress** with streaks and analytics

Start your learning journey today!`,
      slug: 'welcome-to-thynkr',
      requiredRole: 'BASIC' as const,
      featured: true,
      published: true,
      thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
      tags: ['getting-started', 'welcome'],
    },
    {
      title: 'Effective Study Techniques',
      description: 'Science-backed methods to improve your learning',
      content: `# Effective Study Techniques

Research shows that certain study methods are far more effective than others.

## Active Recall

Instead of passive re-reading, test yourself on the material.
- Use flashcards
- Take practice quizzes
- Explain concepts aloud

## Spaced Repetition

Spread your studying over time rather than cramming.
- Review material at increasing intervals
- Use apps that implement spaced repetition algorithms

## Interleaving

Mix different topics or types of problems in one study session.
- Improves ability to discriminate between problem types
- Enhances long-term retention

## Elaborative Interrogation

Ask "why" and "how" questions about what you're learning.
- Connect new information to existing knowledge
- Create meaningful associations

## The Feynman Technique

1. Choose a concept
2. Teach it to a child (use simple language)
3. Identify gaps in your explanation
4. Review and simplify`,
      slug: 'effective-study-techniques',
      requiredRole: 'BASIC' as const,
      featured: true,
      published: true,
      thumbnail: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800',
      tags: ['study-tips', 'learning'],
    },
    {
      title: 'Premium Features Guide',
      description: 'Unlock the full power of Thynkr',
      content: `# Premium Features Guide

Upgrade to Premium to unlock Thynkr's most powerful features.

## Unlimited AI Generations

- Generate unlimited summaries, notes, quizzes, and flashcards
- No daily limits on AI tutor conversations
- Priority access during high-traffic periods

## Advanced Analytics

- Detailed study session tracking
- Performance trends over time
- Personalized recommendations

## Course Management

- Create and organize courses
- Upload unlimited materials
- Share courses with study groups

## Priority Support

- 24/7 support access
- Direct email support
- Feature request priority

## Coming Soon

- Voice-enabled AI tutoring
- Collaboration features
- Mobile app`,
      slug: 'premium-features-guide',
      requiredRole: 'PREMIUM' as const,
      featured: false,
      published: true,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      tags: ['premium', 'features'],
    },
  ];

  for (const contentData of sampleContent) {
    await prisma.content.create({
      data: contentData,
    });

    logger.info(`   ✓ ${contentData.title}`);
  }

  logger.info(`📝 Created ${sampleContent.length} content articles`);
}

async function seedAchievements(users: { [key: string]: string }) {
  logger.info('🏆 Seeding user achievements...');

  // Define user personas with their achievement value generation strategies
  const userPersonas = [
    {
      username: 'basic',
      userId: users['basic'],
      name: 'Basic',
      // Basic: Random value between 0 and Copper threshold (most achievements locked)
      getValueRange: (achievement: AchievementDefinition, _index?: number) => ({
        min: 0,
        max: Math.max(0, achievement.thresholds.COPPER - 1),
      }),
    },
    {
      username: 'standard',
      userId: users['standard'],
      name: 'Standard',
      // Standard: Random value between Copper and Gold thresholds
      getValueRange: (achievement: AchievementDefinition, _index?: number) => ({
        min: achievement.thresholds.COPPER,
        max: achievement.thresholds.GOLD,
      }),
    },
    {
      username: 'premium',
      userId: users['premium'],
      name: 'Premium',
      // Premium: Diverse tiers across Copper, Gold, Ruby, Amethyst, Diamond (evenly distributed)
      getValueRange: (achievement: AchievementDefinition, index: number = 0) => {
        // Distribute evenly: Copper, Gold, Ruby, Amethyst, Diamond
        const tierCycle = index % 5;
        
        switch (tierCycle) {
          case 0:
            // Copper tier (20% of achievements)
            return { min: achievement.thresholds.COPPER, max: achievement.thresholds.GOLD - 1 };
          case 1:
            // Gold tier (20% of achievements)
            return { min: achievement.thresholds.GOLD, max: achievement.thresholds.RUBY - 1 };
          case 2:
            // Ruby tier (20% of achievements)
            return { min: achievement.thresholds.RUBY, max: achievement.thresholds.AMETHYST - 1 };
          case 3:
            // Amethyst tier (20% of achievements)
            return { min: achievement.thresholds.AMETHYST, max: achievement.thresholds.DIAMOND - 1 };
          case 4:
          default:
            // Diamond tier (20% of achievements) - highest tier
            return { min: achievement.thresholds.DIAMOND, max: achievement.thresholds.DIAMOND + 20 };
        }
      },
    },
    {
      username: 'admin',
      userId: users['admin'],
      name: 'Admin',
      // Admin: Value > Diamond threshold (Maxed out)
      getValueRange: (achievement: AchievementDefinition, _index?: number) => ({
        min: achievement.thresholds.DIAMOND,
        max: achievement.thresholds.DIAMOND + 100, // Slightly over to show mastery
      }),
    },
  ];

  let totalCreated = 0;

  // Process each user
  for (const persona of userPersonas) {
    let userTotalXP = 0;
    let unlockedCount = 0;
    let lockedCount = 0;

    // Iterate through all achievements
    const achievementEntries = Object.entries(ACHIEVEMENTS);
    for (let i = 0; i < achievementEntries.length; i++) {
      const [achievementKey, achievement] = achievementEntries[i];
      // Get the value range for this user persona (pass index for premium tier cycling)
      const { min, max } = persona.getValueRange(achievement, i);
      const currentValue = randomBetween(min, max);

      // Calculate tier based on thresholds
      const tier = calculateTier(currentValue, achievement.thresholds);

      // Determine if unlocked (has tier)
      const isUnlocked = tier !== null;

      // Calculate unlocked date (random within last 30 days if unlocked)
      const unlockedAt = isUnlocked
        ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        : new Date(); // Still set date even if locked (Prisma schema requirement)

      // Skip creating locked achievements (tier is null)
      if (!isUnlocked) {
        lockedCount++;
        continue;
      }

      // Create the achievement record (only for unlocked)
      await prisma.userAchievement.create({
        data: {
          userId: persona.userId,
          achievementId: achievementKey,
          currentValue,
          currentTier: tier, // Now guaranteed to be non-null
          unlockedAt,
        },
      });

      // Add XP if unlocked
      if (isUnlocked && tier) {
        userTotalXP += achievement.xpRewards[tier];
        unlockedCount++;
      } else {
        lockedCount++;
      }

      if (isUnlocked) {
        totalCreated++;
      }
    }

    // Update user with total XP and calculated level
    const level = calculateLevel(userTotalXP);
    await prisma.user.update({
      where: { id: persona.userId },
      data: {
        xp: userTotalXP,
        level,
      },
    });

    logger.info(
      `   ✓ ${persona.name}: ${unlockedCount} unlocked, ${lockedCount} locked | ${userTotalXP} XP (Level ${level})`
    );
  }

  logger.info(`🏆 Created ${totalCreated} achievement records across all users`);
}

async function seedStudyData(users: { [key: string]: string }) {
  logger.info('📊 Seeding study sessions and streaks...');

  // Define study patterns for each user persona
  const studyPatterns = [
    {
      username: 'basic',
      userId: users['basic'],
      name: 'Basic',
      // Basic: Minimal activity - 5-10 sessions
      sessionCount: randomBetween(5, 10),
      avgDuration: randomBetween(15, 30), // 15-30 min sessions
      streakDays: randomBetween(1, 3),
    },
    {
      username: 'standard',
      userId: users['standard'],
      name: 'Standard',
      // Standard: Moderate activity - 30-50 sessions
      sessionCount: randomBetween(30, 50),
      avgDuration: randomBetween(30, 60), // 30-60 min sessions
      streakDays: randomBetween(5, 10),
    },
    {
      username: 'premium',
      userId: users['premium'],
      name: 'Premium',
      // Premium: High activity - 100-150 sessions
      sessionCount: randomBetween(100, 150),
      avgDuration: randomBetween(45, 90), // 45-90 min sessions
      streakDays: randomBetween(15, 25),
    },
    {
      username: 'admin',
      userId: users['admin'],
      name: 'Admin',
      // Admin: Very high activity - 200-300 sessions
      sessionCount: randomBetween(200, 300),
      avgDuration: randomBetween(60, 120), // 1-2 hour sessions
      streakDays: randomBetween(30, 50),
    },
  ];

  const activityTypes = [
    'FILE_UPLOAD',
    'SUMMARY_VIEW',
    'NOTES_VIEW',
    'QUIZ_ATTEMPT',
    'FLASHCARD_STUDY',
    'TTS_GENERATE',
    'STUDY_PACK_CREATE',
  ] as const;

  for (const pattern of studyPatterns) {
    let totalMinutes = 0;
    const createdSessions = [];

    // Create study sessions spread over the last 60 days
    for (let i = 0; i < pattern.sessionCount; i++) {
      const daysAgo = randomBetween(0, 60);
      const sessionDate = new Date();
      sessionDate.setDate(sessionDate.getDate() - daysAgo);
      
      const duration = randomBetween(
        Math.max(5, pattern.avgDuration - 20),
        pattern.avgDuration + 20
      );
      
      totalMinutes += duration;

      const session = await prisma.studySession.create({
        data: {
          userId: pattern.userId,
          activityType: activityTypes[randomBetween(0, activityTypes.length - 1)],
          durationMinutes: duration,
          createdAt: sessionDate,
        },
      });

      createdSessions.push(session);
    }

    // Create or update study streak
    const lastStudyDate = new Date();
    lastStudyDate.setDate(lastStudyDate.getDate() - randomBetween(0, 2)); // Last studied 0-2 days ago

    await prisma.studyStreak.upsert({
      where: { userId: pattern.userId },
      create: {
        userId: pattern.userId,
        currentStreak: pattern.streakDays,
        longestStreak: pattern.streakDays + randomBetween(5, 15),
        totalStudyDays: Math.ceil(pattern.sessionCount * 0.7), // Assume ~70% unique days
        totalMinutes,
        lastStudyDate,
      },
      update: {
        currentStreak: pattern.streakDays,
        longestStreak: pattern.streakDays + randomBetween(5, 15),
        totalStudyDays: Math.ceil(pattern.sessionCount * 0.7),
        totalMinutes,
        lastStudyDate,
      },
    });

    logger.info(
      `   ✓ ${pattern.name}: ${pattern.sessionCount} sessions, ${totalMinutes} total minutes, ${pattern.streakDays} day streak`
    );
  }

  logger.info('📊 Study data seeded successfully');
}

async function seed() {
  const startTime = Date.now();
  
  console.log('\n');
  logger.info('═══════════════════════════════════════════════════════════');
  logger.info('              THYNKR DATABASE SEED                          ');
  logger.info('═══════════════════════════════════════════════════════════');
  console.log('\n');

  try {
    // Clear all tables
    await clearDatabase();

    // Seed users
    const users = await seedUsers();

    // Seed content articles
    await seedContent();

    // Seed courses with premium user (5 courses with varied content)
    await seedCoursesWithInternalFiles(users['premium']);

    // Seed achievements
    await seedAchievements(users);

    // Seed study sessions and streaks
    await seedStudyData(users);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`✅ DATABASE SEED COMPLETED in ${duration}s`);
    logger.info('═══════════════════════════════════════════════════════════');
    console.log('\n');
    logger.info('📋 Summary:');
    logger.info('   • 4 Users (basic, standard, premium, admin)');
    logger.info('   • 5 Courses with files');
    logger.info('   • 3 Content articles');
    logger.info(`   • ${Object.keys(ACHIEVEMENTS).length} Achievement types with realistic progress`);
    logger.info('   • Study sessions and streaks for all users');
    console.log('\n');
    logger.info('🔑 Test Accounts (password: Password123!):');
    logger.info('   • basic@thynkr.ca');
    logger.info('   • standard@thynkr.ca');
    logger.info('   • premium@thynkr.ca');
    logger.info('   • admin@thynkr.ca');
    console.log('\n');

  } catch (error) {
    logger.error({ err: error }, '❌ Database seed failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
