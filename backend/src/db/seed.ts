import bcrypt from 'bcryptjs';
import prisma from './client';
import { logger } from '../lib/logger';
import seedCoursesWithInternalFiles from './seed-courses-internal';

/**
 * Thynkr Database Seed Script
 * 
 * Seeds the database with clean sample data:
 * - 3 Users: admin, instructor (premium), student (basic)
 * - 5 Courses with realistic academic content
 * - Sample content articles
 */

async function clearDatabase() {
  logger.info('🗑️  Clearing existing data...');

  // Clear in order respecting foreign key constraints
  // Most dependent tables first
  await prisma.studyCache.deleteMany({});
  await prisma.studyPack.deleteMany({});
  await prisma.studySession.deleteMany({});
  await prisma.studyStreak.deleteMany({});
  await prisma.courseFileAI.deleteMany({});
  await prisma.courseFile.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.flashcard.deleteMany({});
  await prisma.flashcardSet.deleteMany({});
  await prisma.quizAttempt.deleteMany({});
  await prisma.quizQuestion.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.fileNotes.deleteMany({});
  await prisma.fileSummary.deleteMany({});
  await prisma.uploadedFile.deleteMany({});
  await prisma.folder.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.adminLog.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.user.deleteMany({});

  logger.info('   ✓ All tables cleared');
}

async function seedUsers() {
  logger.info('👥 Seeding users...');

  const users = [
    {
      email: 'admin@thynkr.app',
      username: 'admin',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
      emailVerified: true,
    },
    {
      email: 'instructor@thynkr.app',
      username: 'instructor',
      password: 'Instructor123!',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'PREMIUM' as const,
      emailVerified: true,
    },
    {
      email: 'student@thynkr.app',
      username: 'student',
      password: 'Student123!',
      firstName: 'Alex',
      lastName: 'Chen',
      role: 'BASIC' as const,
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

    // Seed courses with the instructor (premium user)
    await seedCoursesWithInternalFiles(users['instructor']);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n');
    logger.info('═══════════════════════════════════════════════════════════');
    logger.info(`✅ DATABASE SEED COMPLETED in ${duration}s`);
    logger.info('═══════════════════════════════════════════════════════════');
    console.log('\n');
    logger.info('📋 Summary:');
    logger.info('   • 3 Users (admin, instructor, student)');
    logger.info('   • 5 Courses with 15 total files');
    logger.info('   • 3 Content articles');
    console.log('\n');
    logger.info('🔑 Test Accounts:');
    logger.info('   • admin@thynkr.app / AdminPass123!');
    logger.info('   • instructor@thynkr.app / Instructor123!');
    logger.info('   • student@thynkr.app / Student123!');
    console.log('\n');

  } catch (error) {
    logger.error('❌ Database seed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
