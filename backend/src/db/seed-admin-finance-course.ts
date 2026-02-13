import prisma from './client';
import { logger } from '../lib/logger';
import fs from 'fs/promises';
import path from 'path';

/**
 * Seed Personal Finance Course for Admin Account
 * This script creates a comprehensive personal finance course with real content
 * from the course-seeds/personal-finance directory
 */

async function seedAdminFinanceCourse() {
  try {
    logger.info('Starting personal finance course seed for admin account...');

    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@thynkr.study' },
    });

    if (!adminUser) {
      logger.error('Admin user (admin@thynkr.study) not found. Run main seed first.');
      return;
    }

    // Check if course already exists
    const existingCourse = await prisma.course.findFirst({
      where: {
        slug: 'personal-finance-mastery-complete',
        createdBy: adminUser.id,
      },
    });

    if (existingCourse) {
      logger.info('Personal finance course already exists for admin. Skipping.');
      return;
    }

    // Read actual course files from course-seeds directory
    const courseFilesDir = path.join(process.cwd(), 'course-seeds', 'personal-finance');
    const files = await fs.readdir(courseFilesDir);
    const textFiles = files.filter(f => f.endsWith('.txt')).sort();

    const courseFiles = [];
    
    for (let i = 0; i < textFiles.length; i++) {
      const fileName = textFiles[i];
      const filePath = path.join(courseFilesDir, fileName);
      const content = await fs.readFile(filePath, 'utf-8');
      const fileSize = Buffer.byteLength(content, 'utf8');

      // Extract title from filename (remove number prefix and extension)
      const title = fileName
        .replace(/^\d+-/, '')
        .replace(/\.txt$/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      courseFiles.push({
        name: title,
        originalName: fileName,
        fileName: fileName.replace('.txt', '.md'),
        filePath: `courses/admin/personal-finance/${fileName}`,
        fileType: 'text/markdown',
        fileSize,
        order: i,
      });
    }

    // Create the course with real files
    const course = await prisma.course.create({
      data: {
        title: 'Personal Finance Mastery - Complete Course',
        description: 'A comprehensive guide to personal finance covering budgeting, investing, taxes, credit management, and wealth building. This course is designed to give you the financial literacy needed to achieve your goals.',
        slug: 'personal-finance-mastery-complete',
        category: 'OTHER',
        visibility: 'PUBLIC',
        published: true,
        createdBy: adminUser.id,
        coverImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=400&fit=crop',
        bannerImage: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=600&fit=crop',
        files: {
          create: courseFiles,
        },
      },
      include: {
        files: true,
      },
    });

    logger.info({ courseId: course.id, filesCount: courseFiles.length }, 'Personal finance course created successfully');

    // Also create some sample documents for the admin
    const documentsToCreate = [
      {
        name: 'Investment Portfolio Analysis',
        originalName: 'investment-portfolio-analysis.pdf',
        fileName: 'investment-portfolio-analysis.pdf',
        filePath: 'uploads/admin/investment-portfolio-analysis.pdf',
        fileType: 'application/pdf',
        fileSize: 2456789,
      },
      {
        name: 'Tax Planning Guide 2026',
        originalName: 'tax-planning-guide-2026.pdf',
        fileName: 'tax-planning-guide-2026.pdf',
        filePath: 'uploads/admin/tax-planning-guide-2026.pdf',
        fileType: 'application/pdf',
        fileSize: 1876543,
      },
      {
        name: 'Retirement Strategies',
        originalName: 'retirement-strategies.docx',
        fileName: 'retirement-strategies.docx',
        filePath: 'uploads/admin/retirement-strategies.docx',
        fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        fileSize: 987654,
      },
    ];

    for (const docData of documentsToCreate) {
      // @ts-ignore - Document model may not be defined in all environments
      const doc = await (prisma as any).document?.create({
        data: {
          ...docData,
          userId: adminUser.id,
        },
      });
      if (doc) {
        logger.info({ documentName: docData.name }, 'Sample document created');
      }
    }

    logger.info('Sample documents created for admin account');

    logger.info('✅ Admin personal finance course and documents seeded successfully!');
  } catch (error) {
    logger.error({ error }, 'Failed to seed admin finance course');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedAdminFinanceCourse()
    .then(() => {
      logger.info('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export default seedAdminFinanceCourse;
