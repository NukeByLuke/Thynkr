/**
 * User Courses Routes
 * 
 * TODO: This file is 800+ lines. Consider splitting into:
 * - courses/enrollment.controller.ts (purchase, enroll, progress)
 * - courses/content.controller.ts (files, streaming, viewing)
 * - courses/admin.controller.ts (CRUD operations for creators)
 */

import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import {
  authenticate,
  AuthenticatedRequest,
  requireRole,
  requireMinRole,
} from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import { z } from 'zod';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import {
  generateFileViewToken,
  verifyFileViewToken,
  blockDownloadAttempts,
  setSecureViewHeaders,
} from '../middleware/file-security.middleware';
import { logger } from '../lib/logger';
import { CourseService } from '../services/course.service';

// Cast prisma for dynamic model access (schema may not be synced with types until migration runs)
const db = prisma as any;

// Initialize course service
const courseService = new CourseService();

// Validation schemas
const COURSE_CATEGORIES = [
  'MATHEMATICS',
  'SCIENCE',
  'TECHNOLOGY',
  'ENGINEERING',
  'LANGUAGES',
  'HUMANITIES',
  'BUSINESS',
  'ARTS',
  'HEALTH',
  'LAW',
  'OTHER',
] as const;

const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  category: z.enum(COURSE_CATEGORIES).default('OTHER'),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).default('PRIVATE'),
});

const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(COURSE_CATEGORIES).optional(),
  visibility: z.enum(['PRIVATE', 'PUBLIC']).optional(),
  bannerImage: z.string().url().optional().nullable(),
  coverImage: z.string().url().optional().nullable(),
});

const updateCourseFileSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  order: z.number().int().min(0).optional(),
});

// Helper to generate secure view URL with token (no direct file access)
function getSecureFileUrl(fileId: string, courseId: string, userId: string): string {
  const token = generateFileViewToken(fileId, courseId, userId);
  return `/api/user-courses/files/${fileId}/view?token=${token}`;
}

// Helper to format creator name
function formatCreatorName(creator: any): string {
  if (!creator) return 'Unknown';
  const parts = [creator.firstName, creator.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : creator.username || 'Unknown';
}

export default async function userCoursesRoutes(server: FastifyInstance) {
  // ============ COURSE CRUD ============

  // GET /api/courses/:slug - Get public course by slug (Premium/Admin only)
  server.get(
    '/courses/:slug',
    {
      preHandler: [authenticate, requireRole('PREMIUM', 'ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { slug } = request.params as { slug: string };
      const userId = request.user!.userId;

      const course = await db.course.findFirst({
        where: {
          slug,
          visibility: 'PUBLIC',
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          files: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      const isOwner = course.createdBy === userId;

      return reply.send({
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          coverImage: course.coverImage,
          bannerImage: course.bannerImage,
          category: course.category,
          visibility: course.visibility,
          isOwner,
          creator: {
            id: course.creator.id,
            username: course.creator.username,
            name: formatCreatorName(course.creator),
          },
          files: (course.files || []).map((file: any) => ({
            id: file.id,
            name: file.name,
            originalName: file.originalName,
            url: getSecureFileUrl(file.id, course.id, userId),
            fileType: file.fileType,
            fileSize: file.fileSize,
            order: file.order,
            createdAt: file.createdAt,
          })),
          filesCount: course.files?.length || 0,
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        },
      });
    }
  );

  // GET /api/user-courses/public - Browse public courses (Premium/Admin only)
  server.get(
    '/user-courses/public',
    {
      preHandler: [authenticate, requireRole('PREMIUM', 'ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const {
        search,
        category,
        limit = '20',
        offset = '0',
      } = request.query as {
        search?: string;
        category?: string;
        limit?: string;
        offset?: string;
      };

      const where: any = {
        visibility: 'PUBLIC',
      };

      // Category filter
      if (category && COURSE_CATEGORIES.includes(category as any)) {
        where.category = category;
      }

      // Search filter
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [courses, total] = await Promise.all([
        db.course.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: Math.min(parseInt(limit), 50),
          skip: parseInt(offset),
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
            _count: {
              select: {
                files: true,
              },
            },
          },
        }),
        db.course.count({ where }),
      ]);

      return reply.send({
        courses: courses.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          coverImage: course.coverImage,
          bannerImage: course.bannerImage,
          category: course.category,
          visibility: course.visibility,
          filesCount: course._count?.files || 0,
          creator: {
            id: course.creator.id,
            username: course.creator.username,
            name: formatCreatorName(course.creator),
          },
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        })),
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
    }
  );

  // GET /api/user-courses - List user's courses + accessible public courses
  server.get(
    '/user-courses',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const { visibility, search, author, category } = request.query as {
        visibility?: string;
        search?: string;
        author?: string;
        category?: string;
      };

      const where: any = {};

      // Role-based access
      if (userRole === 'STANDARD') {
        // Standard users can only see their own private courses
        where.createdBy = userId;
        where.visibility = 'PRIVATE';
      } else if (userRole === 'PREMIUM' || userRole === 'ADMIN') {
        // Premium/Admin can see their courses + all public courses
        if (author === 'me') {
          where.createdBy = userId;
        } else if (author) {
          where.createdBy = author;
        } else {
          where.OR = [{ createdBy: userId }, { visibility: 'PUBLIC' }];
        }

        // Filter by visibility if specified
        if (visibility === 'PUBLIC' || visibility === 'PRIVATE') {
          where.visibility = visibility;
          // If filtering by private, must be owner
          if (visibility === 'PRIVATE') {
            where.createdBy = userId;
          }
        }
      }

      // Category filter
      if (category && COURSE_CATEGORIES.includes(category as any)) {
        where.category = category;
      }

      // Search filter
      if (search) {
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        });
      }

      const courses = await db.course.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              files: true,
            },
          },
        },
      });

      return reply.send({
        courses: courses.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          coverImage: course.coverImage,
          bannerImage: course.bannerImage,
          category: course.category,
          visibility: course.visibility,
          filesCount: course._count?.files || 0,
          isOwner: course.createdBy === userId,
          creator: {
            id: course.creator.id,
            username: course.creator.username,
            name: formatCreatorName(course.creator),
          },
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        })),
      });
    }
  );

  // GET /api/user-courses/:id - Get single course with files
  server.get(
    '/user-courses/:id',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { token } = request.query as { token?: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      const course = await db.course.findUnique({
        where: { id },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          files: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!course) {
        return reply.code(404).send({ error: 'Course not found' });
      }

      // Access control
      const isOwner = course.createdBy === userId;
      const isPublic = course.visibility === 'PUBLIC';
      const hasValidToken = token && course.shareToken === token;
      const isPremiumOrAdmin = userRole === 'PREMIUM' || userRole === 'ADMIN';

      // Standard users can only access their own courses or via share token
      if (userRole === 'STANDARD') {
        if (!isOwner && !hasValidToken) {
          return reply.code(403).send({ error: 'Access denied' });
        }
      } else if (isPremiumOrAdmin) {
        // Premium/Admin can access public courses, own courses, or via share token
        if (!isOwner && !isPublic && !hasValidToken) {
          return reply.code(403).send({ error: 'Access denied' });
        }
      }

      return reply.send({
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          coverImage: course.coverImage,
          bannerImage: course.bannerImage,
          category: course.category,
          visibility: course.visibility,
          shareToken: isOwner ? course.shareToken : undefined,
          isOwner,
          creator: {
            id: course.creator.id,
            username: course.creator.username,
            name: formatCreatorName(course.creator),
          },
          files: (course.files || []).map((file: any) => ({
            id: file.id,
            name: file.name,
            originalName: file.originalName,
            url: getSecureFileUrl(file.id, course.id, userId),
            fileType: file.fileType,
            fileSize: file.fileSize,
            order: file.order,
            createdAt: file.createdAt,
          })),
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        },
      });
    }
  );

  // POST /api/user-courses - Create course
  server.post(
    '/user-courses',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const payload = createCourseSchema.parse(request.body);

      try {
        const course = await courseService.createCourse({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          visibility: payload.visibility,
          userId,
          userRole,
        });

        return reply.code(201).send({
          course: {
            id: course.id,
            title: course.title,
            description: course.description,
            slug: course.slug,
            category: course.category,
            visibility: course.visibility,
            shareToken: course.shareToken,
            isOwner: true,
            creator: {
              id: course.creator.id,
              username: course.creator.username,
              name: formatCreatorName(course.creator),
            },
            files: [],
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
          },
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to create course');
        return reply.code(500).send({ error: 'Failed to create course' });
      }
    }
  );

  // PATCH /api/user-courses/:id - Update course
  server.patch(
    '/user-courses/:id',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const payload = updateCourseSchema.parse(request.body);

      try {
        const updated = await courseService.updateCourse(id, payload, userId, userRole);

        return reply.send({
          course: {
            id: updated.id,
            title: updated.title,
            description: updated.description,
            slug: updated.slug,
            coverImage: updated.coverImage,
            bannerImage: updated.bannerImage,
            category: updated.category,
            visibility: updated.visibility,
            shareToken: updated.shareToken,
            isOwner: true,
            creator: {
              id: updated.creator.id,
              username: updated.creator.username,
              name: formatCreatorName(updated.creator),
            },
            files: (updated.files || []).map((file: any) => ({
              id: file.id,
              name: file.name,
              originalName: file.originalName,
              url: getSecureFileUrl(file.id, updated.id, userId),
              fileType: file.fileType,
              fileSize: file.fileSize,
              order: file.order,
              createdAt: file.createdAt,
            })),
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to update course');
        return reply.code(500).send({ error: 'Failed to update course' });
      }
    }
  );

  // POST /api/user-courses/:id/regenerate-share-token - Regenerate share token
  server.post(
    '/user-courses/:id/regenerate-share-token',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;

      try {
        const newToken = await courseService.regenerateShareToken(id, userId);
        return reply.send({ shareToken: newToken });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to regenerate share token');
        return reply.code(500).send({ error: 'Failed to regenerate share token' });
      }
    }
  );

  // PATCH /api/user-courses/:id/banner - Upload banner image
  server.patch(
    '/user-courses/:id/banner',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;

      try {
        // Handle file upload with Promise wrapper
        const file: Express.Multer.File | undefined = await new Promise((resolve, reject) => {
          const multerMiddleware = upload.single('banner');
          multerMiddleware(request.raw as any, reply.raw as any, (err: any) => {
            if (err) reject(err);
            else resolve((request.raw as any).file);
          });
        });

        if (!file) {
          return reply.code(400).send({ error: 'Banner image is required' });
        }

        const bannerUrl = await courseService.uploadBanner(id, file, userId);

        return reply.send({
          bannerImage: bannerUrl,
          message: 'Banner updated successfully',
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to upload banner');
        return reply.code(500).send({ error: 'Failed to upload banner' });
      }
    }
  );

  // DELETE /api/user-courses/:id - Delete course
  server.delete(
    '/user-courses/:id',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;

      try {
        await courseService.deleteCourse(id, userId);
        return reply.send({ message: 'Course deleted successfully' });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to delete course');
        return reply.code(500).send({ error: 'Failed to delete course' });
      }
    }
  );

  // ============ COURSE FILES ============

  // POST /api/user-courses/:id/files - Upload file to course
  server.post(
    '/user-courses/:id/files',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      try {
        // Handle file upload
        const file: Express.Multer.File | undefined = await new Promise((resolve, reject) => {
          const multerMiddleware = upload.single('file');
          multerMiddleware(request.raw as any, reply.raw as any, (err: any) => {
            if (err) reject(err);
            else resolve((request.raw as any).file);
          });
        });

        if (!file) {
          return reply.code(400).send({ error: 'No file uploaded' });
        }

        // Get name from form data or use original name
        const name = (request.raw as any).body?.name || file.originalname;

        const courseFile = await courseService.uploadFile(id, file, userId, userRole, name);

        return reply.code(201).send({
          file: {
            id: courseFile.id,
            name: courseFile.name,
            originalName: courseFile.originalName,
            url: getSecureFileUrl(courseFile.id, id, userId),
            fileType: courseFile.fileType,
            fileSize: courseFile.fileSize,
            order: courseFile.order,
            createdAt: courseFile.createdAt,
          },
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to upload file');
        return reply.code(500).send({ error: 'Failed to upload file' });
      }
    }
  );

  // PATCH /api/user-courses/:id/files/:fileId - Update file (rename/reorder)
  server.patch(
    '/user-courses/:id/files/:fileId',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id, fileId } = request.params as { id: string; fileId: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const payload = updateCourseFileSchema.parse(request.body);

      try {
        const updated = await courseService.updateFile(id, fileId, payload, userId, userRole);

        return reply.send({
          file: {
            id: updated.id,
            name: updated.name,
            originalName: updated.originalName,
            url: getSecureFileUrl(updated.id, id, userId),
            fileType: updated.fileType,
            fileSize: updated.fileSize,
            order: updated.order,
            createdAt: updated.createdAt,
            updatedAt: updated.updatedAt,
          },
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to update file');
        return reply.code(500).send({ error: 'Failed to update file' });
      }
    }
  );

  // DELETE /api/user-courses/:id/files/:fileId - Delete file
  server.delete(
    '/user-courses/:id/files/:fileId',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id, fileId } = request.params as { id: string; fileId: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      try {
        await courseService.deleteFile(id, fileId, userId, userRole);
        return reply.send({ message: 'File deleted successfully' });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to delete file');
        return reply.code(500).send({ error: 'Failed to delete file' });
      }
    }
  );

  // PUT /api/user-courses/:id/files/reorder - Reorder files
  // Accepts either { files: [{id, order}] } or { fileIds: string[] }
  server.patch(
    '/user-courses/:id/files/reorder',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const body = request.body as { files?: { id: string; order: number }[]; fileIds?: string[] };

      try {
        // Support both formats
        let updates: { id: string; order: number }[] = [];

        if (body.fileIds && Array.isArray(body.fileIds)) {
          // Simple format: just an array of file IDs in order
          updates = body.fileIds.map((fileId, index) => ({ id: fileId, order: index }));
        } else if (body.files && Array.isArray(body.files)) {
          // Original format: array of { id, order }
          updates = body.files;
        } else {
          return reply.code(400).send({ error: 'Either files or fileIds array is required' });
        }

        await courseService.reorderFiles(id, updates, userId, userRole);

        const updatedFiles = await db.courseFile.findMany({
          where: { courseId: id },
          orderBy: { order: 'asc' },
        });

        return reply.send({
          files: updatedFiles.map((file: any) => ({
            id: file.id,
            name: file.name,
            originalName: file.originalName,
            url: getSecureFileUrl(file.id, id, userId),
            fileType: file.fileType,
            fileSize: file.fileSize,
            order: file.order,
            createdAt: file.createdAt,
          })),
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.code(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to reorder files');
        return reply.code(500).send({ error: 'Failed to reorder files' });
      }
    }
  );

  // GET /api/user-courses/shared/:token - Access course via share token (no auth required for viewing)
  server.get(
    '/user-courses/shared/:token',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { token } = request.params as { token: string };
      const userId = request.user!.userId;

      const course = await db.course.findFirst({
        where: { shareToken: token },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
          files: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!course) {
        return reply.code(404).send({ error: 'Course not found or invalid share link' });
      }

      const isOwner = course.createdBy === userId;

      return reply.send({
        course: {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          coverImage: course.coverImage,
          bannerImage: course.bannerImage,
          category: course.category,
          visibility: course.visibility,
          shareToken: isOwner ? course.shareToken : undefined,
          isOwner,
          creator: {
            id: course.creator.id,
            username: course.creator.username,
            name: formatCreatorName(course.creator),
          },
          files: (course.files || []).map((file: any) => ({
            id: file.id,
            name: file.name,
            originalName: file.originalName,
            url: getSecureFileUrl(file.id, course.id, userId),
            fileType: file.fileType,
            fileSize: file.fileSize,
            order: file.order,
            createdAt: file.createdAt,
          })),
          createdAt: course.createdAt,
          updatedAt: course.updatedAt,
        },
      });
    }
  );

  // ============ SECURE FILE VIEWING ============

  // GET /api/user-courses/files/:fileId/view - Securely view a course file (inline only, no download)
  server.get(
    '/user-courses/files/:fileId/view',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), blockDownloadAttempts],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const { token } = request.query as { token?: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      // Find the file
      const file = await db.courseFile.findUnique({
        where: { id: fileId },
        include: {
          course: {
            select: {
              id: true,
              createdBy: true,
              visibility: true,
              shareToken: true,
            },
          },
        },
      });

      if (!file || !file.course) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const course = file.course;
      const isOwner = course.createdBy === userId;
      const isPublic = course.visibility === 'PUBLIC';
      const isPremiumOrAdmin = userRole === 'PREMIUM' || userRole === 'ADMIN';

      // Verify token if provided
      let tokenValid = false;
      if (token) {
        const tokenPayload = verifyFileViewToken(token);
        if (tokenPayload && tokenPayload.fileId === fileId && tokenPayload.userId === userId) {
          tokenValid = true;
        }
      }

      // Check share token in query for shared links
      const shareToken = (request.query as any).shareToken;
      const hasValidShareToken = shareToken && course.shareToken === shareToken;

      // Access control
      if (userRole === 'STANDARD') {
        if (!isOwner && !hasValidShareToken && !tokenValid) {
          logger.warn({ userId, fileId, courseId: course.id }, 'Unauthorized file access attempt');
          return reply.code(403).send({ error: 'Access denied' });
        }
      } else if (isPremiumOrAdmin) {
        if (!isOwner && !isPublic && !hasValidShareToken && !tokenValid) {
          logger.warn({ userId, fileId, courseId: course.id }, 'Unauthorized file access attempt');
          return reply.code(403).send({ error: 'Access denied' });
        }
      }

      // Get full file path
      const filePath = path.join(process.cwd(), 'uploads', file.filePath);

      // Check if file exists
      try {
        await fs.access(filePath);
      } catch {
        logger.error({ fileId, filePath }, 'Course file not found on disk');
        return reply.code(404).send({ error: 'File not found on server' });
      }

      // Log file access
      logger.info(
        { userId, fileId, courseId: course.id, fileName: file.name },
        'Course file viewed'
      );

      // Set secure headers for inline viewing
      setSecureViewHeaders(reply, file.originalName || file.name, file.fileType);

      // Stream the file
      const fileStream = createReadStream(filePath);
      return reply.send(fileStream);
    }
  );
}
