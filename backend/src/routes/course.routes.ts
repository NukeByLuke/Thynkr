import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import { FileProcessorService } from '../services/file-processor.service';
import {
  createCourseSchema,
  updateCourseSchema,
  updateCourseLessonSchema,
  reorderCourseLessonsSchema,
  publishCourseSchema,
} from '../schemas/validation.schemas';
import { ensureUniqueSlug } from '../utils/slugify';
import { normalizeFileForLanguage, resolveUserLanguage } from '../utils/language.utils';
import { DEFAULT_LANGUAGE } from '../constants/language.constants';
import fs from 'fs/promises';

const fileProcessor = new FileProcessorService();

type CourseCreator = {
  id: string;
  firstName: string | null;
  lastName: string | null;
};

const db = prisma as any;

function formatCreator(creator: CourseCreator | null | undefined) {
  if (!creator) {
    return null;
  }

  const nameParts = [creator.firstName, creator.lastName].filter(Boolean) as string[];
  return {
    id: creator.id,
    name: nameParts.length > 0 ? nameParts.join(' ') : null,
  };
}

function mapAdminLesson(lesson: any) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    file: lesson.file
      ? {
          id: lesson.file.id,
          originalName: lesson.file.originalName,
          fileType: lesson.file.fileType,
          fileSize: lesson.file.fileSize,
          status: lesson.file.status,
          createdAt: lesson.file.createdAt,
        }
      : null,
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

function mapPublicLesson(lesson: any) {
  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order: lesson.order,
    file: normalizeFileForLanguage(lesson.file),
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  };
}

function mapCourseSummary(course: any) {
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    slug: course.slug,
    coverImage: course.coverImage,
    published: course.published,
    lessonsCount: course._count?.lessons ?? 0,
    creator: formatCreator(course.creator),
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

async function ensureCourseSlugUnique(base: string, excludeCourseId?: string) {
  return ensureUniqueSlug(base, async (candidate) => {
    const existing = await db.course.findFirst({
      where: {
        slug: candidate,
        ...(excludeCourseId
          ? {
              NOT: {
                id: excludeCourseId,
              },
            }
          : {}),
      },
      select: { id: true },
    });
    return Boolean(existing);
  });
}

export default async function courseRoutes(server: FastifyInstance) {
  const adminLessonsInclude = {
    orderBy: { order: 'asc' as const },
    include: {
      file: {
        select: {
          id: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          status: true,
          createdAt: true,
        },
      },
    },
  };

  function publicLessonsInclude(language: string) {
    return {
      orderBy: { order: 'asc' as const },
      include: {
        file: {
          include: {
            summaries: {
              where: { language },
              orderBy: { updatedAt: 'desc' as const },
              take: 1,
            },
            notes: {
              where: { language },
              orderBy: { updatedAt: 'desc' as const },
              take: 1,
            },
          },
        },
      },
    };
  }

  const adminCourseInclude = {
    creator: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
    lessons: adminLessonsInclude,
    _count: {
      select: {
        lessons: true,
      },
    },
  } as const;

  const publicCourseBaseInclude = {
    creator: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    },
    _count: {
      select: {
        lessons: true,
      },
    },
  } as const;

  server.get(
    '/courses',
    async (_request: AuthenticatedRequest, reply) => {
      const courses = await db.course.findMany({
        where: { published: true },
        orderBy: { createdAt: 'desc' },
        include: publicCourseBaseInclude,
      });

      return reply.send({
        courses: courses.map(mapCourseSummary),
      });
    }
  );

  server.get(
    '/courses/:slug',
    async (request: AuthenticatedRequest, reply) => {
      const { slug } = request.params as { slug: string };
      const language = await resolveUserLanguage(request.user?.userId);
      const effectiveLanguage = language ?? DEFAULT_LANGUAGE;

      const course = await db.course.findFirst({
        where: {
          slug,
          published: true,
        },
        include: {
          ...publicCourseBaseInclude,
          lessons: publicLessonsInclude(effectiveLanguage),
        },
      });

      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      return reply.send({
        course: {
          ...mapCourseSummary(course),
          lessons: course.lessons.map(mapPublicLesson),
        },
      });
    }
  );

  server.get(
    '/admin/courses',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const courses = await db.course.findMany({
        orderBy: { createdAt: 'desc' },
        include: adminCourseInclude,
      });

      return reply.send({
        courses: courses.map((course: any) => ({
          ...mapCourseSummary(course),
          lessons: course.lessons.map(mapAdminLesson),
        })),
      });
    }
  );

  server.get(
    '/admin/courses/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const course = await db.course.findUnique({
        where: { id },
        include: adminCourseInclude,
      });

      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      return reply.send({
        course: {
          ...mapCourseSummary(course),
          lessons: course.lessons.map(mapAdminLesson),
        },
      });
    }
  );

  server.post(
    '/admin/courses',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const payload = createCourseSchema.parse(request.body);
      const title = payload.title.trim();
      const description = payload.description?.trim() || null;
      const bannerImage = payload.bannerImage?.trim() || null;
      const coverImage = payload.coverImage?.trim() || null;
      const baseSlug = (payload.slug || title) || 'course';
      const slug = await ensureCourseSlugUnique(baseSlug);

      const course = await db.course.create({
        data: {
          title,
          description,
          bannerImage,
          coverImage,
          slug,
          createdBy: request.user!.userId,
        },
        include: adminCourseInclude,
      });

      return reply.code(201).send({
        course: {
          ...mapCourseSummary(course),
          lessons: course.lessons.map(mapAdminLesson),
        },
      });
    }
  );

  server.put(
    '/admin/courses/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const payload = updateCourseSchema.parse(request.body);

      const course = await db.course.findUnique({ where: { id } });
      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      const data: Record<string, any> = {};
      if (payload.title !== undefined) {
        data.title = payload.title.trim();
      }
      if (payload.description !== undefined) {
        data.description = payload.description?.trim() || null;
      }
      if (payload.bannerImage !== undefined) {
        data.bannerImage = payload.bannerImage?.trim() || null;
      }
      if (payload.coverImage !== undefined) {
        data.coverImage = payload.coverImage?.trim() || null;
      }
      if (payload.slug !== undefined) {
        const newSlug = await ensureCourseSlugUnique(payload.slug, id);
        data.slug = newSlug;
      }

    const updated = await db.course.update({
        where: { id },
        data,
        include: adminCourseInclude,
      });

      return reply.send({
        course: {
          ...mapCourseSummary(updated),
          lessons: updated.lessons.map(mapAdminLesson),
        },
      });
    }
  );

  server.delete(
    '/admin/courses/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const course = await db.course.findUnique({ where: { id } });
      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      await db.course.delete({ where: { id } });

      return reply.send({ message: 'Course deleted successfully' });
    }
  );

  // Add lesson with file upload
  server.post(
    '/admin/courses/:id/lessons',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        
        // Handle multipart form data with multer
        const file: Express.Multer.File | undefined = await new Promise((resolve, reject) => {
          const multerMiddleware = upload.single('file');
          multerMiddleware(request.raw as any, reply.raw as any, (err: any) => {
            if (err) {
              console.error('Multer error:', err);
              reject(err);
            } else {
              resolve((request.raw as any).file);
            }
          });
        });

        if (!file) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }

        // Get title from multer's parsed body
        const title = (request.raw as any).body?.title;
        if (!title || typeof title !== 'string' || !title.trim()) {
          await fs.unlink(file.path);
          return reply.code(400).send({ error: 'Lesson title is required' });
        }

        const course = await db.course.findUnique({ where: { id } });
        if (!course) {
          await fs.unlink(file.path);
          return reply.code(404).send({ error: 'Course not found' });
        }

        // Validate file type
        if (!fileProcessor.validateFileType(file.mimetype, file.originalname)) {
          await fs.unlink(file.path);
          return reply.code(400).send({ error: `File ${file.originalname} has invalid type` });
        }

        const canExtractText = fileProcessor.supportsTextExtraction(file.mimetype, file.originalname);

        // Extract text when supported
        let extractedText: string | null = null;
        let status: 'UPLOADED' | 'COMPLETED' | 'FAILED' = 'UPLOADED';

        if (canExtractText) {
          try {
            extractedText = await fileProcessor.extractText(file.path, file.mimetype);
            status = 'COMPLETED';
          } catch (error: any) {
            console.error('Text extraction error:', error);
            status = 'FAILED';
          }
        }

        // Save file to database
        const uploadedFile = await prisma.uploadedFile.create({
          data: {
            userId: request.user!.userId,
            fileName: file.filename,
            originalName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            filePath: file.path,
            status,
            extractedText,
          },
        });

        // Add lesson to course
        const newLesson = await prisma.$transaction(async (tx) => {
          const lessonClient = (tx as any).courseLesson;
          const lessons: any[] = await lessonClient.findMany({
            where: { courseId: id },
            orderBy: { order: 'asc' },
          });

          const desiredOrder = lessons.length; // Always add at the end

          return lessonClient.create({
            data: {
              courseId: id,
              fileId: uploadedFile.id,
              title: title.trim(),
              order: desiredOrder,
            },
            include: {
              file: {
                select: {
                  id: true,
                  originalName: true,
                  fileName: true,
                  fileType: true,
                  fileSize: true,
                  status: true,
                  createdAt: true,
                },
              },
            },
          });
        });

        return reply.code(201).send({
          message: 'Lesson added successfully',
          lesson: newLesson,
        });
      } catch (error: any) {
        console.error('File upload error:', error);
        return reply.code(500).send({ 
          error: 'Failed to upload file',
          details: error.message 
        });
      }
    }
  );

  // Update lesson (title, description, etc.)
  server.patch(
    '/admin/courses/:courseId/lessons/:lessonId',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { courseId, lessonId } = request.params as { courseId: string; lessonId: string };
      const payload = updateCourseLessonSchema.parse(request.body);

      const lesson = await db.courseLesson.findFirst({
        where: { id: lessonId, courseId },
      });

      if (!lesson) {
        return reply.code(404).send({ error: 'Lesson not found' });
      }

      const updated = await db.courseLesson.update({
        where: { id: lessonId },
        data: {
          ...(payload.title !== undefined ? { title: payload.title.trim() } : {}),
          ...(payload.description !== undefined ? { description: payload.description?.trim() || null } : {}),
        },
      });

      return reply.send({ lesson: updated });
    }
  );

  server.put(
    '/admin/courses/:courseId/lessons/reorder',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { courseId } = request.params as { courseId: string };
      const payload = reorderCourseLessonsSchema.parse(request.body);
      const existingLessons: any[] = await db.courseLesson.findMany({
        where: { courseId },
        select: { id: true },
      });

      const validIds = new Set(existingLessons.map((lesson: any) => lesson.id));
      for (const lesson of payload.lessons) {
        if (!validIds.has(lesson.id)) {
          return reply.code(400).send({ error: 'Invalid lesson provided' });
        }
      }

      await prisma.$transaction(async (tx) => {
        const lessonClient = (tx as any).courseLesson;
        for (const lesson of payload.lessons) {
          await lessonClient.update({
            where: { id: lesson.id },
            data: { order: lesson.order },
          });
        }
      });

      const updated = await db.course.findUnique({
        where: { id: courseId },
        include: adminCourseInclude,
      });

      return reply.send({
        course: updated
          ? {
              ...mapCourseSummary(updated),
              lessons: updated.lessons.map(mapAdminLesson),
            }
          : null,
      });
    }
  );

  server.delete(
    '/admin/courses/:courseId/lessons/:lessonId',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { courseId, lessonId } = request.params as { courseId: string; lessonId: string };

      const lesson = await db.courseLesson.findFirst({ where: { id: lessonId, courseId } });
      if (!lesson) {
        return reply.code(404).send({ error: 'Lesson not found' });
      }

      await db.courseLesson.delete({ where: { id: lessonId } });

      const updated = await db.course.findUnique({
        where: { id: courseId },
        include: adminCourseInclude,
      });

      return reply.send({
        course: updated
          ? {
              ...mapCourseSummary(updated),
              lessons: updated.lessons.map(mapAdminLesson),
            }
          : null,
      });
    }
  );

  server.patch(
    '/admin/courses/:id/publish',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const payload = publishCourseSchema.parse(request.body);

      const course = await db.course.findUnique({
        where: { id },
        include: {
          lessons: {
            select: { id: true },
          },
        },
      });

      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      if (payload.published && course.lessons.length === 0) {
        return reply.code(400).send({ error: 'Cannot publish a course without lessons' });
      }

      const updated = await db.course.update({
        where: { id },
        data: { published: payload.published },
        include: adminCourseInclude,
      });

      return reply.send({
        course: {
          ...mapCourseSummary(updated),
          lessons: updated.lessons.map(mapAdminLesson),
        },
      });
    }
  );
}
