/**
 * Production Database Reset Script
 * 
 * Truncates all tables (except _prisma_migrations) to start fresh.
 * Run with: npx tsx scripts/reset-prod-db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('\n');
  console.log('============================================================');
  console.log('       THYNKR PRODUCTION DATABASE RESET                     ');
  console.log('============================================================');
  console.log('\n');

  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database!');
  console.log('   Only _prisma_migrations table will be preserved.\n');

  // Tables in order of deletion (respecting foreign key constraints)
  const tables = [
    'UserAchievement',
    'StudyCache',
    'StudyPack',
    'StudySession',
    'StudyStreak',
    'CourseFileAI',
    'CourseFile',
    'Course',
    'Flashcard',
    'FlashcardSet',
    'QuizAttempt',
    'QuizQuestion',
    'Quiz',
    'FileNotes',
    'FileSummary',
    'UploadedFile',
    'Folder',
    'Payment',
    'Subscription',
    'RefreshToken',
    'AdminLog',
    'Content',
    'User',
  ];

  console.log('🗑️  Truncating tables...\n');

  for (const table of tables) {
    try {
      // Use raw SQL TRUNCATE with CASCADE for PostgreSQL
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
      console.log(`   ✓ ${table}`);
    } catch (error: any) {
      if (error?.code === 'P2010' || error?.message?.includes('does not exist')) {
        console.log(`   - ${table} (skipped - table does not exist)`);
      } else {
        console.error(`   ✗ ${table}: ${error.message}`);
      }
    }
  }

  console.log('\n============================================================');
  console.log('✅ DATABASE RESET COMPLETE');
  console.log('============================================================\n');
  console.log('Next steps:');
  console.log('   1. Run: pnpm db:seed');
  console.log('   2. Deploy: .\\scripts\\deploy.ps1\n');
}

resetDatabase()
  .catch((error) => {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
