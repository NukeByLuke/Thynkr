import prisma from './client';
import { logger } from '../lib/logger';

async function checkCourses() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        files: {
          include: {
            aiContent: {
              select: {
                id: true,
                extractedText: true,
              },
            },
          },
        },
      },
    });

    logger.info(`Total courses: ${courses.length}`);
    
    for (const course of courses) {
      logger.info(`\nCourse: ${course.title} (${course.category})`);
      logger.info(`  Slug: ${course.slug}`);
      logger.info(`  Files: ${course.files.length}`);
      
      for (const file of course.files) {
        logger.info(`    - ${file.name} (${file.accessType})`);
        logger.info(`      Type: ${file.fileType}, Size: ${file.fileSize} bytes`);
        logger.info(`      AI Content: ${file.aiContent ? '✅ Yes' : '❌ No'}`);
        if (file.aiContent) {
          const textLength = file.aiContent.extractedText?.length || 0;
          logger.info(`      Extracted Text Length: ${textLength} chars`);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking courses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCourses();
