import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { authenticate, AuthenticatedRequest, requireMinRole } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { AIService, QuizDifficulty } from '../services/ai.service';
import { FileProcessorService } from '../services/file-processor.service';
import { logger } from '../lib/logger';
import { createHash, randomBytes } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';

// Cast prisma for dynamic model access
const db = prisma as any;

// Initialize services
let aiService: AIService | null = null;
const fileProcessor = new FileProcessorService();

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

// Supported file types for text extraction
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

/**
 * Check if a file type supports AI text extraction
 */
function isAICompatibleFile(fileType: string): boolean {
  return SUPPORTED_FILE_TYPES.includes(fileType) || fileType.startsWith('text/');
}

/**
 * Generate a hash from sorted file IDs for idempotency
 */
function generateFileHash(fileIds: string[]): string {
  const sorted = [...fileIds].sort();
  return createHash('sha256').update(sorted.join(',')).digest('hex').substring(0, 32);
}

/**
 * Generate a share token
 */
function createShareToken(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Get or extract text from a file (CourseFile or UploadedFile)
 */
async function getFileText(
  fileId: string,
  filePath: string,
  fileType: string,
  isCourseFile: boolean
): Promise<string> {
  if (isCourseFile) {
    // For CourseFile, check CourseFileAI for cached text
    const existing = await db.courseFileAI.findUnique({
      where: { fileId },
      select: { extractedText: true },
    });

    if (existing?.extractedText) {
      return existing.extractedText;
    }

    // Check if file exists
    const fullPath = path.resolve(filePath);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    // Extract text
    const extractedText = await fileProcessor.extractText(fullPath, fileType);

    // Cache extracted text in CourseFileAI
    await db.courseFileAI.upsert({
      where: { fileId },
      create: {
        fileId,
        extractedText,
      },
      update: {
        extractedText,
      },
    });

    return extractedText;
  } else {
    // For UploadedFile, check extractedText directly on the record
    const uploadedFile = await db.uploadedFile.findUnique({
      where: { id: fileId },
      select: { extractedText: true },
    });

    if (uploadedFile?.extractedText) {
      return uploadedFile.extractedText;
    }

    // Check if file exists
    const fullPath = path.resolve(filePath);
    try {
      await fs.access(fullPath);
    } catch {
      throw new Error(`File not found: ${filePath}`);
    }

    // Extract text
    const extractedText = await fileProcessor.extractText(fullPath, fileType);

    // Cache extracted text directly on UploadedFile
    await db.uploadedFile.update({
      where: { id: fileId },
      data: { extractedText },
    });

    return extractedText;
  }
}

/**
 * Get user's preferred language from the database
 */
async function getUserLanguage(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true },
  });
  return user?.preferredLanguage || 'en';
}

/**
 * Verify user has access to multiple files (supports both CourseFile and UploadedFile)
 */
async function verifyFilesAccess(
  fileIds: string[],
  userId: string,
  userRole: string
): Promise<{ files: any[]; courseId: string | null; fileType: 'course' | 'uploaded' }> {
  // First, try to find files as CourseFiles
  const courseFiles = await db.courseFile.findMany({
    where: { id: { in: fileIds } },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          createdBy: true,
          visibility: true,
        },
      },
    },
  });

  // If all files found as CourseFiles, verify access
  if (courseFiles.length === fileIds.length) {
    // Check access for all course files
    for (const file of courseFiles) {
      const isOwner = file.course.createdBy === userId;
      const isPublic = file.course.visibility === 'PUBLIC';
      const canViewPublic = userRole === 'PREMIUM' || userRole === 'ADMIN';

      if (!isOwner && !(isPublic && canViewPublic)) {
        throw { statusCode: 403, message: `Access denied to file: ${file.name}` };
      }
    }

    // Determine courseId (use first file's course, or null if mixed)
    const courseIds = [...new Set(courseFiles.map((f: any) => f.course.id))] as string[];
    const courseId: string | null = courseIds.length === 1 ? courseIds[0] : null;

    return { files: courseFiles, courseId, fileType: 'course' };
  }

  // If not all files are CourseFiles, try UploadedFiles
  const uploadedFiles = await db.uploadedFile.findMany({
    where: {
      id: { in: fileIds },
      userId, // User can only access their own uploaded files
      status: 'COMPLETED', // Only completed files
    },
  });

  if (uploadedFiles.length === fileIds.length) {
    return { files: uploadedFiles, courseId: null, fileType: 'uploaded' };
  }

  // If some files found but not all, check what's missing
  const foundCourseIds = courseFiles.map((f: any) => f.id);
  const foundUploadedIds = uploadedFiles.map((f: any) => f.id);
  const allFoundIds = [...foundCourseIds, ...foundUploadedIds];
  const missingIds = fileIds.filter((id) => !allFoundIds.includes(id));

  if (missingIds.length > 0) {
    throw {
      statusCode: 404,
      message: `Files not found or access denied: ${missingIds.join(', ')}`,
    };
  }

  // Mixed file types - not supported
  throw { statusCode: 400, message: 'Cannot mix course files and uploaded files in a study pack' };
}

interface PageContent {
  pageNumber: number;
  heading: string;
  content: string;
}

/**
 * Paginate text into ~300-500 word pages with headings
 */
function paginateContent(
  sections: { fileName: string; text: string }[],
  wordsPerPage: number = 400
): PageContent[] {
  const pages: PageContent[] = [];
  let currentPage: PageContent = { pageNumber: 1, heading: '', content: '' };
  let currentWordCount = 0;

  for (const section of sections) {
    // Create a heading for each file section
    const paragraphs = section.text.split(/\n\n+/).filter((p) => p.trim());

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i].trim();
      const words = paragraph.split(/\s+/).length;

      // If adding this paragraph exceeds the limit, start a new page
      if (currentWordCount + words > wordsPerPage && currentWordCount > 0) {
        pages.push({ ...currentPage });
        currentPage = {
          pageNumber: pages.length + 1,
          heading: section.fileName,
          content: '',
        };
        currentWordCount = 0;
      }

      // Set heading if this is the first content on the page
      if (!currentPage.heading) {
        currentPage.heading = section.fileName;
      }

      // Add paragraph
      currentPage.content += (currentPage.content ? '\n\n' : '') + paragraph;
      currentWordCount += words;
    }
  }

  // Don't forget the last page
  if (currentPage.content) {
    pages.push(currentPage);
  }

  return pages;
}

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

        // Verify access to all files
        const { files, fileType } = await verifyFilesAccess(fileIds, userId, userRole);

        // Generate file hash for idempotency
        const fileHash = generateFileHash(fileIds);

        // Filter to AI-compatible files only
        const compatibleFiles = files.filter((f: any) => isAICompatibleFile(f.fileType));
        if (compatibleFiles.length === 0) {
          return reply.status(400).send({
            error: 'No compatible files for AI processing',
            supportedTypes: SUPPORTED_FILE_TYPES,
          });
        }

        // Extract text from all files
        logger.info(
          { fileCount: compatibleFiles.length, fileType },
          'Extracting text from files for study pack'
        );
        const fileTexts: { fileName: string; text: string }[] = [];

        for (const file of compatibleFiles) {
          try {
            const fileName = fileType === 'course' ? file.name : file.originalName;
            const isCourseFile = fileType === 'course';
            const text = await getFileText(file.id, file.filePath, file.fileType, isCourseFile);
            fileTexts.push({ fileName, text });
          } catch (error: any) {
            logger.warn(
              { fileId: file.id, error: error.message },
              'Failed to extract text from file'
            );
          }
        }

        if (fileTexts.length === 0) {
          return reply.status(400).send({ error: 'Could not extract text from any files' });
        }

        // Combine all text for AI generation
        const combinedText = fileTexts
          .map((f) => `## ${f.fileName}\n\n${f.text}`)
          .join('\n\n---\n\n');
        const language = await getUserLanguage(userId);

        // Generate paginated content
        const pages = paginateContent(fileTexts);

        // Generate quiz and flashcards by default
        const quizCount = 15;
        const difficulty = 'MEDIUM' as QuizDifficulty;
        const cardCount = 30;

        logger.info(
          { quizCount, difficulty, cardCount },
          'Generating quiz and flashcards for study pack'
        );

        const [generatedQuiz, generatedCards] = await Promise.all([
          aiService.generateQuiz(combinedText, quizCount, difficulty, language),
          aiService.generateFlashcards(combinedText, cardCount, language),
        ]);

        const quiz = {
          title: generatedQuiz.title,
          questions: generatedQuiz.questions,
          difficulty,
        };

        const cards = {
          title: generatedCards.title,
          cards: generatedCards.cards,
        };

        // Create study pack
        const studyPack = await db.studyPack.upsert({
          where: {
            ownerId_fileHash: {
              ownerId: userId,
              fileHash,
            },
          },
          create: {
            ownerId: userId,
            courseId,
            fileIds,
            fileHash,
            title: name,
            pages,
            quiz,
            cards,
          },
          update: {
            title: name,
            pages,
            quiz,
            cards,
            updatedAt: new Date(),
          },
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
            totalPages: pages.length,
            pageCount: pages.length,
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

      const { fileIds, title, quiz: quizOptions, cards: cardsOptions } = input;
      const refresh = (request.query as any).refresh === 'true';

      try {
        const startTime = Date.now();

        // Verify access to all files
        const { files, courseId, fileType } = await verifyFilesAccess(fileIds, userId, userRole);

        // Generate file hash for idempotency
        const fileHash = generateFileHash(fileIds);

        // Check for existing study pack with same files (unless refresh)
        if (!refresh) {
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

        // Filter to AI-compatible files only
        const compatibleFiles = files.filter((f: any) => isAICompatibleFile(f.fileType));
        if (compatibleFiles.length === 0) {
          return reply.status(400).send({
            error: 'No compatible files for AI processing',
            supportedTypes: SUPPORTED_FILE_TYPES,
          });
        }

        // Extract text from all files
        logger.info(
          { fileCount: compatibleFiles.length, fileType },
          'Extracting text from files for study pack'
        );
        const fileTexts: { fileName: string; text: string }[] = [];

        for (const file of compatibleFiles) {
          try {
            // Handle both CourseFile (name) and UploadedFile (originalName)
            const fileName = fileType === 'course' ? file.name : file.originalName;
            const isCourseFile = fileType === 'course';
            const text = await getFileText(file.id, file.filePath, file.fileType, isCourseFile);
            fileTexts.push({ fileName, text });
          } catch (error: any) {
            logger.warn(
              { fileId: file.id, error: error.message },
              'Failed to extract text from file'
            );
          }
        }

        if (fileTexts.length === 0) {
          return reply.status(400).send({ error: 'Could not extract text from any files' });
        }

        // Combine all text for AI generation
        const combinedText = fileTexts
          .map((f) => `## ${f.fileName}\n\n${f.text}`)
          .join('\n\n---\n\n');
        const language = await getUserLanguage(userId);

        // Generate paginated content
        const pages = paginateContent(fileTexts);

        // Generate quiz if requested
        let quiz = null;
        if (quizOptions) {
          const quizCount = quizOptions.count || 15;
          const difficulty = (quizOptions.difficulty || 'MEDIUM') as QuizDifficulty;

          logger.info({ quizCount, difficulty }, 'Generating combined quiz');
          const generatedQuiz = await aiService.generateQuiz(
            combinedText,
            quizCount,
            difficulty,
            language
          );
          quiz = {
            title: generatedQuiz.title,
            questions: generatedQuiz.questions,
            difficulty,
          };
        }

        // Generate flashcards if requested
        let cards = null;
        if (cardsOptions) {
          const cardCount = cardsOptions.count || 30;

          logger.info({ cardCount }, 'Generating combined flashcards');
          const generatedCards = await aiService.generateFlashcards(
            combinedText,
            cardCount,
            language
          );
          cards = {
            title: generatedCards.title,
            cards: generatedCards.cards,
          };
        }

        // Create or update study pack
        const studyPack = await db.studyPack.upsert({
          where: {
            ownerId_fileHash: {
              ownerId: userId,
              fileHash,
            },
          },
          create: {
            ownerId: userId,
            courseId,
            fileIds,
            fileHash,
            title,
            pages,
            quiz,
            cards,
          },
          update: {
            title,
            pages,
            quiz,
            cards,
            updatedAt: new Date(),
          },
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
          pageCount: pages.length,
          hasQuiz: !!quiz,
          hasCards: !!cards,
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
        const studyPack = await db.studyPack.findUnique({
          where: { id },
        });

        if (!studyPack) {
          return reply.status(404).send({ error: 'Study pack not found' });
        }

        // Check ownership
        if (studyPack.ownerId !== userId && userRole !== 'ADMIN') {
          return reply.status(403).send({ error: 'Access denied' });
        }

        // Sharing requires Premium or Admin role
        if (generateShareToken && userRole !== 'PREMIUM' && userRole !== 'ADMIN') {
          return reply.status(403).send({ error: 'Sharing requires Premium or Admin access' });
        }

        const updateData: any = {};
        if (title) updateData.title = title;
        if (generateShareToken) updateData.shareToken = createShareToken();
        if (removeShareToken) updateData.shareToken = null;

        const updated = await db.studyPack.update({
          where: { id },
          data: updateData,
        });

        return reply.send({
          id: updated.id,
          title: updated.title,
          shareToken: updated.shareToken,
          message: 'Study pack updated',
        });
      } catch (error: any) {
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
        const studyPack = await db.studyPack.findUnique({
          where: { id },
        });

        if (!studyPack) {
          return reply.status(404).send({ error: 'Study pack not found' });
        }

        // Check ownership
        if (studyPack.ownerId !== userId && userRole !== 'ADMIN') {
          return reply.status(403).send({ error: 'Access denied' });
        }

        await db.studyPack.delete({
          where: { id },
        });

        return reply.send({ success: true, message: 'Study pack deleted' });
      } catch (error: any) {
        logger.error({ error, id }, 'Failed to delete study pack');
        return reply.status(500).send({ error: 'Failed to delete study pack' });
      }
    }
  );
}
