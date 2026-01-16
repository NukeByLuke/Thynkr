import bcrypt from 'bcryptjs';
import prisma from './client';
import { logger } from '../lib/logger';
import seedCoursesWithInternalFiles from './seed-courses-internal';

/**
 * Thynkr Database Seed Script
 * 
 * Seeds the database with clean sample data:
 * - 4 Users: basic, standard, premium, admin (all @thynkr.ca)
 * - 5+ Courses with realistic academic content
 * - Sample content articles
 * - User achievements with varied progress
 */

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
      username: 'basic_user',
      password: 'Password123!',
      firstName: 'Basic',
      lastName: 'User',
      role: 'BASIC' as const,
      emailVerified: true,
    },
    {
      email: 'standard@thynkr.ca',
      username: 'standard_user',
      password: 'Password123!',
      firstName: 'Standard',
      lastName: 'User',
      role: 'STANDARD' as const,
      emailVerified: true,
    },
    {
      email: 'premium@thynkr.ca',
      username: 'premium_user',
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

  // Basic user - some locked (null unlockedAt), mostly bronze
  const basicAchievements = [
    { id: 'first_steps', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'scholar', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'speed_reader', tier: 'BRONZE', value: 45, unlocked: false },
    { id: 'quiz_master', tier: 'BRONZE', value: 30, unlocked: false },
    { id: 'flash_genius', tier: 'BRONZE', value: 20, unlocked: false },
    { id: 'night_owl', tier: 'BRONZE', value: 10, unlocked: false },
    { id: 'early_bird', tier: 'BRONZE', value: 5, unlocked: false },
    { id: 'streak_master', tier: 'BRONZE', value: 0, unlocked: false },
  ];

  for (const ach of basicAchievements) {
    await prisma.userAchievement.create({
      data: {
        userId: users['basic_user'],
        achievementId: ach.id,
        currentTier: ach.tier as any,
        currentValue: ach.value,
        unlockedAt: ach.unlocked ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : new Date(),
      },
    });
  }

  // Standard user - mix of bronze, silver, gold
  const standardAchievements = [
    { id: 'first_steps', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'scholar', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'speed_reader', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'quiz_master', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'flash_genius', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'night_owl', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'early_bird', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'streak_master', tier: 'BRONZE', value: 75, unlocked: false },
    { id: 'consistent', tier: 'BRONZE', value: 60, unlocked: false },
    { id: 'social_learner', tier: 'BRONZE', value: 40, unlocked: false },
  ];

  for (const ach of standardAchievements) {
    await prisma.userAchievement.create({
      data: {
        userId: users['standard_user'],
        achievementId: ach.id,
        currentTier: ach.tier as any,
        currentValue: ach.value,
        unlockedAt: ach.unlocked ? new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) : new Date(),
      },
    });
  }

  // Premium user - varied with some high tiers (RUBY, PLATINUM, GOLD)
  const premiumAchievements = [
    { id: 'first_steps', tier: 'RUBY', value: 100, unlocked: true },
    { id: 'scholar', tier: 'PLATINUM', value: 100, unlocked: true },
    { id: 'speed_reader', tier: 'PLATINUM', value: 100, unlocked: true },
    { id: 'quiz_master', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'flash_genius', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'night_owl', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'early_bird', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'streak_master', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'consistent', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'social_learner', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'course_creator', tier: 'BRONZE', value: 85, unlocked: false },
    { id: 'tutor_enthusiast', tier: 'BRONZE', value: 70, unlocked: false },
  ];

  for (const ach of premiumAchievements) {
    await prisma.userAchievement.create({
      data: {
        userId: users['premium_user'],
        achievementId: ach.id,
        currentTier: ach.tier as any,
        currentValue: ach.value,
        unlockedAt: ach.unlocked ? new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000) : new Date(),
      },
    });
  }

  // Admin user - all achievements, varied tiers with many high-tier
  const adminAchievements = [
    { id: 'first_steps', tier: 'RUBY', value: 100, unlocked: true },
    { id: 'scholar', tier: 'RUBY', value: 100, unlocked: true },
    { id: 'speed_reader', tier: 'RUBY', value: 100, unlocked: true },
    { id: 'quiz_master', tier: 'RUBY', value: 100, unlocked: true },
    { id: 'flash_genius', tier: 'PLATINUM', value: 100, unlocked: true },
    { id: 'night_owl', tier: 'PLATINUM', value: 100, unlocked: true },
    { id: 'early_bird', tier: 'PLATINUM', value: 100, unlocked: true },
    { id: 'streak_master', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'consistent', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'social_learner', tier: 'GOLD', value: 100, unlocked: true },
    { id: 'course_creator', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'tutor_enthusiast', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'knowledge_sharer', tier: 'SILVER', value: 100, unlocked: true },
    { id: 'perfectionist', tier: 'BRONZE', value: 100, unlocked: true },
    { id: 'explorer', tier: 'BRONZE', value: 100, unlocked: true },
  ];

  for (const ach of adminAchievements) {
    await prisma.userAchievement.create({
      data: {
        userId: users['admin'],
        achievementId: ach.id,
        currentTier: ach.tier as any,
        currentValue: ach.value,
        unlockedAt: ach.unlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : new Date(),
      },
    });
  }

  logger.info('   ✓ Basic: 2 unlocked (bronze), 6 locked with varied progress');
  logger.info('   ✓ Standard: 7 unlocked (bronze/silver/gold), 3 locked');
  logger.info('   ✓ Premium: 10 unlocked (bronze-ruby), 2 locked');
  logger.info('   ✓ Admin: All 15 unlocked with high tiers');
  logger.info(`🏆 Created achievements with varied progress`);
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
    await seedCoursesWithInternalFiles(users['premium_user']);

    // Seed achievements
    await seedAchievements(users);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`✅ DATABASE SEED COMPLETED in ${duration}s`);
    logger.info('═══════════════════════════════════════════════════════════');
    console.log('\n');
    logger.info('📋 Summary:');
    logger.info('   • 4 Users (basic, standard, premium, admin)');
    logger.info('   • 10+ Courses with files');
    logger.info('   • 3 Content articles');
    logger.info('   • User achievements with varied progress');
    console.log('\n');
    logger.info('🔑 Test Accounts (password: Password123!):');
    logger.info('   • basic@thynkr.ca');
    logger.info('   • standard@thynkr.ca');
    logger.info('   • premium@thynkr.ca');
    logger.info('   • admin@thynkr.ca');
    console.log('\n');

  } catch (error) {
    logger.error('❌ Database seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
