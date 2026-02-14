import bcrypt from 'bcryptjs';
import prisma from './client';
import { logger } from '../lib/logger';
import seedCoursesWithInternalFiles from './seed-courses-internal';

/**
 * Thynkr Database Seed Script (Production)
 * 
 * Seeds the database with initial content:
 * - Admin user account
 * - Sample courses for new users to explore
 * - Sample content articles
 */

async function clearDatabase() {
  logger.info('Wiping database completely...');

  // Clear in order respecting foreign key constraints
  // Most dependent tables first
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
        throw error;
      }
    }
  }

  logger.info('   Database wiped completely');
}

async function seedUsers() {
  logger.info('Seeding admin user...');

  const adminData = {
    email: 'admin@thynkr.study',
    username: 'admin',
    password: 'Password123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN' as const,
    emailVerified: true,
  };

  const hashedPassword = await bcrypt.hash(adminData.password, 12);

  const admin = await prisma.user.create({
    data: {
      ...adminData,
      password: hashedPassword,
    },
  });

  logger.info(`   Created ${adminData.firstName} ${adminData.lastName} (${adminData.role})`);
  
  return { admin: admin.id };
}

async function seedContent() {
  logger.info('Seeding sample content...');

  const sampleContent = [
    {
      title: 'Welcome to Thynkr',
      description: 'Get started with our AI-powered learning platform',
      content: `# Welcome to Thynkr

Welcome to Thynkr - your intelligent study companion powered by AI.

## What is Thynkr?

Thynkr transforms how you learn by using artificial intelligence to:

- **Generate summaries** from your course materials
- **Create study notes** tailored to your content
- **Build quizzes** to test your knowledge
- **Make flashcards** for spaced repetition
- **Chat with an AI tutor** that understands your materials

## Getting Started

1. **Upload your materials** - PDFs, documents, or text files
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

    logger.info(`   Created: ${contentData.title}`);
  }

  logger.info(`Created ${sampleContent.length} content articles`);
}

async function seed() {
  const startTime = Date.now();
  
  console.log('\n');
  logger.info('============================================================');
  logger.info('              THYNKR DATABASE SEED (PRODUCTION)             ');
  logger.info('============================================================');
  console.log('\n');

  try {
    // Clear all tables
    await clearDatabase();

    // Seed admin user only
    const users = await seedUsers();

    // Seed content articles
    await seedContent();

    // Seed sample courses (assigned to admin user)
    await seedCoursesWithInternalFiles(users.admin);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    logger.info('============================================================');
    logger.info(`DATABASE SEED COMPLETED in ${duration}s`);
    logger.info('============================================================');
    console.log('\n');
    logger.info('Summary:');
    logger.info('   - 1 Admin user (admin@thynkr.study)');
    logger.info('   - 5 Sample courses with files');
    logger.info('   - 3 Content articles');
    console.log('\n');
    logger.info('Admin Account (password: Password123!):');
    logger.info('   - admin@thynkr.study');
    console.log('\n');

  } catch (error) {
    logger.error({ err: error }, 'Database seed failed');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
