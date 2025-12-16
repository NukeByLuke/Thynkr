import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { authenticate, AuthenticatedRequest, requireMinRole } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { AIService, QuizDifficulty } from '../services/ai.service';
import { StudyPackService } from '../services/study-pack.service';
import { logger } from '../lib/logger';
import { z } from 'zod';

// Cast prisma for dynamic model access
const db = prisma as any;

// Initialize services
let aiService: AIService | null = null;
const studyPackService = new StudyPackService();

try {
  aiService = new AIService();
  logger.info('AI Service initialized for study packs');
} catch (error) {
  logger.warn('AI Service not available for study packs - OpenAI API key not configured');
}

// Validation schemas
const createStudyPackSchema = z.object({
  courseId: z.string().optional(),
  fileIds: z.array(z.string()).min(1).max(20),
  title: z.string().min(1).max(200),
  quiz: z
    .object({
      count: z.number().min(5).max(50).default(15),
      difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    })
    .optional(),
  cards: z
    .object({
      count: z.number().min(10).max(100).default(30),
    })
    .optional(),
});

export default async function studyPackRoutes(server: FastifyInstance) {
  // ============ ALIAS ROUTES FOR FRONTEND ============

  // GET /api/study-packs - Alias for /api/ai/study-pack
  server.get(
    '/study-packs',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const { courseId } = request.query as { courseId?: string };

      try {
        const where: any = { ownerId: userId };
        if (courseId) {
          where.courseId = courseId;
        }

        const studyPacks = await db.studyPack.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            courseId: true,
            fileIds: true,
            pages: true,
            quiz: true,
            cards: true,
            shareToken: true,
            createdAt: true,
            updatedAt: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        return reply.send({
          studyPacks: studyPacks.map((pack: any) => ({
            id: pack.id,
            name: pack.title,
            title: pack.title,
            courseId: pack.courseId,
            courseTitle: pack.course?.title || null,
            fileCount: pack.fileIds?.length || 0,
            totalPages: pack.pages?.length || 0,
            pageCount: pack.pages?.length || 0,
            hasQuiz: !!pack.quiz,
            hasCards: !!pack.cards,
            hasShareToken: !!pack.shareToken,
            createdAt: pack.createdAt,
            updatedAt: pack.updatedAt,
          })),
        });
      } catch (error: any) {
        logger.error({ error }, 'Failed to list study packs');
        return reply.status(500).send({ error: 'Failed to list study packs' });
      }
    }
  );

  // POST /api/study-packs/from-course-files - Create study pack from course files
  server.post(
    '/study-packs/from-course-files',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      const { name, courseId, fileIds } = request.body as {
        name: string;
        courseId: string;
        fileIds: string[];
      };

      if (!name || !courseId || !fileIds || fileIds.length === 0) {
        return reply.status(400).send({ error: 'Name, courseId, and fileIds are required' });
      }

      try {
        const startTime = Date.now();

        const studyPack = await studyPackService.createStudyPack({
          userId,
          userRole,
          title: name,
          courseId,
          fileIds,
          quiz: { count: 15, difficulty: 'MEDIUM' as QuizDifficulty },
          cards: { count: 30 },
        });

        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'STUDY_PACK_CREATE', {
          studyPackId: studyPack.id,
          durationMs,
        });

        return reply.send({
          studyPack: {
            id: studyPack.id,
            name: studyPack.title,
            title: studyPack.title,
            courseId: studyPack.courseId,
            fileCount: fileIds.length,
            totalPages: studyPack.pages.length,
            pageCount: studyPack.pages.length,
            hasQuiz: true,
            hasCards: true,
          },
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to create study pack from course files');
        return reply.status(500).send({ error: 'Failed to create study pack' });
      }
    }
  );

  // ============ MAIN ROUTES ============

  // POST /api/ai/study-pack - Create a new study pack
  server.post(
    '/ai/study-pack',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      // Validate input
      let input;
      try {
        input = createStudyPackSchema.parse(request.body);
      } catch (error: any) {
        return reply.status(400).send({ error: 'Invalid input', details: error.errors });
      }

      const { fileIds, title, quiz: quizOptions, cards: cardsOptions, courseId } = input;
      const refresh = (request.query as any).refresh === 'true';

      try {
        const startTime = Date.now();

        // Check for existing study pack with same files (unless refresh)
        if (!refresh) {
          const fileHash = studyPackService.generateFileHash(fileIds);
          const existing = await db.studyPack.findUnique({
            where: {
              ownerId_fileHash: {
                ownerId: userId,
                fileHash,
              },
            },
          });

          if (existing) {
            return reply.send({
              id: existing.id,
              cached: true,
              message: 'Study pack already exists for these files',
            });
          }
        }

        const studyPack = await studyPackService.createStudyPack({
          userId,
          userRole,
          title,
          courseId,
          fileIds,
          quiz: quizOptions,
          cards: cardsOptions,
        });

        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'STUDY_PACK_CREATE', {
          studyPackId: studyPack.id,
          durationMs,
        });

        return reply.send({
          id: studyPack.id,
          title: studyPack.title,
          pageCount: studyPack.pages.length,
          hasQuiz: !!studyPack.quiz,
          hasCards: !!studyPack.cards,
          cached: false,
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error }, 'Failed to create study pack');
        return reply.status(500).send({ error: 'Failed to create study pack' });
      }
    }
  );

  // GET /api/ai/study-pack - List user's study packs
  server.get(
    '/ai/study-pack',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const { courseId } = request.query as { courseId?: string };

      try {
        const where: any = { ownerId: userId };
        if (courseId) {
          where.courseId = courseId;
        }

        const studyPacks = await db.studyPack.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            courseId: true,
            fileIds: true,
            pages: true,
            quiz: true,
            cards: true,
            shareToken: true,
            createdAt: true,
            updatedAt: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        return reply.send({
          studyPacks: studyPacks.map((pack: any) => ({
            id: pack.id,
            name: pack.title, // alias for frontend compatibility
            title: pack.title,
            courseId: pack.courseId,
            courseTitle: pack.course?.title || null,
            fileCount: pack.fileIds?.length || 0,
            totalPages: pack.pages?.length || 0,
            pageCount: pack.pages?.length || 0,
            hasQuiz: !!pack.quiz,
            hasCards: !!pack.cards,
            hasShareToken: !!pack.shareToken,
            createdAt: pack.createdAt,
            updatedAt: pack.updatedAt,
          })),
        });
      } catch (error: any) {
        logger.error({ error }, 'Failed to list study packs');
        return reply.status(500).send({ error: 'Failed to list study packs' });
      }
    }
  );

  // GET /api/ai/study-pack/:id - Get a study pack by ID
  server.get(
    '/ai/study-pack/:id',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      try {
        const studyPack = await db.studyPack.findUnique({
          where: { id },
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        });

        if (!studyPack) {
          return reply.status(404).send({ error: 'Study pack not found' });
        }

        // Check ownership or admin access
        if (studyPack.ownerId !== userId && userRole !== 'ADMIN') {
          return reply.status(403).send({ error: 'Access denied' });
        }

        return reply.send({
          id: studyPack.id,
          title: studyPack.title,
          courseId: studyPack.courseId,
          courseTitle: studyPack.course?.title || null,
          fileIds: studyPack.fileIds,
          pages: studyPack.pages,
          quiz: studyPack.quiz,
          cards: studyPack.cards,
          shareToken: studyPack.shareToken,
          createdAt: studyPack.createdAt,
          updatedAt: studyPack.updatedAt,
        });
      } catch (error: any) {
        logger.error({ error, id }, 'Failed to get study pack');
        return reply.status(500).send({ error: 'Failed to get study pack' });
      }
    }
  );

  // GET /api/ai/study-pack/shared/:token - Get a shared study pack
  server.get(
    '/ai/study-pack/shared/:token',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { token } = request.params as { token: string };

      try {
        const studyPack = await db.studyPack.findUnique({
          where: { shareToken: token },
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
            owner: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        });

        if (!studyPack) {
          return reply.status(404).send({ error: 'Shared study pack not found' });
        }

        // Format owner name
        const ownerName =
          studyPack.owner.firstName && studyPack.owner.lastName
            ? `${studyPack.owner.firstName} ${studyPack.owner.lastName}`
            : studyPack.owner.username;

        return reply.send({
          id: studyPack.id,
          title: studyPack.title,
          courseTitle: studyPack.course?.title || null,
          ownerName,
          pages: studyPack.pages,
          quiz: studyPack.quiz,
          cards: studyPack.cards,
          createdAt: studyPack.createdAt,
        });
      } catch (error: any) {
        logger.error({ error, token }, 'Failed to get shared study pack');
        return reply.status(500).send({ error: 'Failed to get shared study pack' });
      }
    }
  );

  // PATCH /api/ai/study-pack/:id - Update a study pack (rename, regenerate share token)
  server.patch(
    '/ai/study-pack/:id',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const { title, generateShareToken, removeShareToken } = request.body as {
        title?: string;
        generateShareToken?: boolean;
        removeShareToken?: boolean;
      };

      try {
        const updated = await studyPackService.updateStudyPack(
          id,
          userId,
          userRole,
          { title, generateShareToken, removeShareToken }
        );

        return reply.send({
          id: updated.id,
          title: updated.title,
          shareToken: updated.shareToken,
          message: 'Study pack updated',
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, id }, 'Failed to update study pack');
        return reply.status(500).send({ error: 'Failed to update study pack' });
      }
    }
  );

  // DELETE /api/ai/study-pack/:id - Delete a study pack
  server.delete(
    '/ai/study-pack/:id',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      try {
        await studyPackService.deleteStudyPack(id, userId, userRole);
        return reply.send({ success: true, message: 'Study pack deleted' });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, id }, 'Failed to delete study pack');
        return reply.status(500).send({ error: 'Failed to delete study pack' });
      }
    }
  );
}
