import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { authenticate, AuthenticatedRequest, requireMinRole } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { AIService, QuizDifficulty, type QuizQuestionType } from '../services/ai.service';
import { FileProcessorService } from '../services/file-processor.service';
import { logger } from '../lib/logger';
import path from 'path';
import fs from 'fs/promises';

// Cast prisma for dynamic model access
const db = prisma as any;

// Initialize services
let aiService: AIService | null = null;
const fileProcessor = new FileProcessorService();

try {
  aiService = new AIService();
  logger.info('AI Service initialized for course file AI');
} catch (error) {
  logger.warn('AI Service not available - OpenAI API key not configured');
}

// Supported file types for text extraction
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const SUPPORTED_QUIZ_QUESTION_TYPES: QuizQuestionType[] = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'FILL_IN_THE_BLANK',
];

function normalizeQuizQuestionTypesInput(questionTypes: unknown): QuizQuestionType[] {
  const rawValues = Array.isArray(questionTypes)
    ? questionTypes
    : typeof questionTypes === 'string'
    ? questionTypes
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
    : [];

  const mapped = rawValues
    .map((value) =>
      String(value || '')
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_')
    )
    .map((value): QuizQuestionType | null => {
      if (value === 'MULTIPLE_CHOICE' || value === 'MCQ' || value === 'MULTIPLECHOICE') {
        return 'MULTIPLE_CHOICE';
      }
      if (value === 'TRUE_FALSE' || value === 'TRUEFALSE' || value === 'TF' || value === 'BOOLEAN') {
        return 'TRUE_FALSE';
      }
      if (
        value === 'FILL_IN_THE_BLANK' ||
        value === 'FILL_BLANK' ||
        value === 'FILLINTHEBLANK' ||
        value === 'SHORT_ANSWER' ||
        value === 'SHORTANSWER' ||
        value === 'BLANK'
      ) {
        return 'FILL_IN_THE_BLANK';
      }
      return null;
    })
    .filter((value): value is QuizQuestionType => value !== null);

  return Array.from(new Set(mapped));
}

/**
 * Check if a file type supports AI text extraction
 */
function isAICompatibleFile(fileType: string): boolean {
  return SUPPORTED_FILE_TYPES.includes(fileType) || fileType.startsWith('text/');
}

/**
 * Get or extract text from a course file
 */
async function getFileText(fileId: string, filePath: string, fileType: string): Promise<string> {
  // Check if we have cached extracted text
  const existing = await db.courseFileAI.findUnique({
    where: { fileId },
    select: { extractedText: true },
  });

  if (existing?.extractedText) {
    return existing.extractedText;
  }

  // Check if file exists - resolve path relative to uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const fullPath = path.join(uploadsDir, filePath);
  try {
    await fs.access(fullPath);
  } catch {
    throw new Error('File not found on server');
  }

  // Extract text
  const extractedText = await fileProcessor.extractText(fullPath, fileType);

  // Cache extracted text
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
 * Verify user has access to a course file
 */
async function verifyFileAccess(
  fileId: string,
  userId: string,
  userRole: string
): Promise<{ file: any; course: any }> {
  const file = await db.courseFile.findUnique({
    where: { id: fileId },
    include: {
      course: {
        select: {
          id: true,
          createdBy: true,
          visibility: true,
        },
      },
    },
  });

  if (!file) {
    throw { statusCode: 404, message: 'File not found' };
  }

  const isOwner = file.course.createdBy === userId;
  const isPublic = file.course.visibility === 'PUBLIC';
  const canViewPublic = userRole === 'PREMIUM' || userRole === 'ADMIN';

  if (!isOwner && !(isPublic && canViewPublic)) {
    throw { statusCode: 403, message: 'You do not have access to this file' };
  }

  return { file, course: file.course };
}

export default async function courseFileAIRoutes(server: FastifyInstance) {
  // GET /api/ai/file/:fileId - Get all AI content for a file
  server.get(
    '/ai/file/:fileId',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      try {
        const { file } = await verifyFileAccess(fileId, userId, userRole);

        const aiContent = await db.courseFileAI.findUnique({
          where: { fileId },
        });

        return reply.send({
          fileId,
          fileName: file.name,
          fileType: file.fileType,
          isAICompatible: isAICompatibleFile(file.fileType),
          hasExtractedText: !!aiContent?.extractedText,
          summary: aiContent?.summary || null,
          summaryGeneratedAt: aiContent?.summaryGeneratedAt || null,
          notes: aiContent?.notes || null,
          notesGeneratedAt: aiContent?.notesGeneratedAt || null,
          quiz: aiContent?.quiz || null,
          quizGeneratedAt: aiContent?.quizGeneratedAt || null,
          cards: aiContent?.cards || null,
          cardsGeneratedAt: aiContent?.cardsGeneratedAt || null,
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, fileId }, 'Failed to get AI content');
        return reply.status(500).send({ error: 'Failed to get AI content' });
      }
    }
  );

  // POST /api/ai/file/:fileId/summary - Generate or get summary
  server.post(
    '/ai/file/:fileId/summary',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const { refresh = false } = request.query as { refresh?: boolean };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      try {
        const { file } = await verifyFileAccess(fileId, userId, userRole);

        if (!isAICompatibleFile(file.fileType)) {
          return reply.status(400).send({
            error: 'This file type does not support AI features',
            supportedTypes: SUPPORTED_FILE_TYPES,
          });
        }

        // Check for cached content
        if (!refresh) {
          const existing = await db.courseFileAI.findUnique({
            where: { fileId },
            select: { summary: true, summaryGeneratedAt: true },
          });

          if (existing?.summary) {
            return reply.send({
              summary: existing.summary,
              generatedAt: existing.summaryGeneratedAt,
              cached: true,
            });
          }
        }

        // Extract text and generate summary
        const startTime = Date.now();
        const text = await getFileText(fileId, file.filePath, file.fileType);
        const language = await getUserLanguage(userId);
        const summary = await aiService.generateSummary(text, language);
        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'SUMMARY_VIEW', { fileId, durationMs });

        // Store generated content
        await db.courseFileAI.upsert({
          where: { fileId },
          create: {
            fileId,
            summary: { content: summary.content },
            summaryGeneratedAt: new Date(),
          },
          update: {
            summary: { content: summary.content },
            summaryGeneratedAt: new Date(),
          },
        });

        return reply.send({
          summary: { content: summary.content },
          generatedAt: new Date(),
          cached: false,
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, fileId }, 'Failed to generate summary');
        return reply.status(500).send({ error: 'Failed to generate summary' });
      }
    }
  );

  // POST /api/ai/file/:fileId/notes - Generate or get notes
  server.post(
    '/ai/file/:fileId/notes',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const { refresh = false } = request.query as { refresh?: boolean };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      try {
        const { file } = await verifyFileAccess(fileId, userId, userRole);

        if (!isAICompatibleFile(file.fileType)) {
          return reply.status(400).send({
            error: 'This file type does not support AI features',
            supportedTypes: SUPPORTED_FILE_TYPES,
          });
        }

        // Check for cached content
        if (!refresh) {
          const existing = await db.courseFileAI.findUnique({
            where: { fileId },
            select: { notes: true, notesGeneratedAt: true },
          });

          if (existing?.notes) {
            return reply.send({
              notes: existing.notes,
              generatedAt: existing.notesGeneratedAt,
              cached: true,
            });
          }
        }

        // Extract text and generate notes
        const startTime = Date.now();
        const text = await getFileText(fileId, file.filePath, file.fileType);
        const language = await getUserLanguage(userId);
        const notes = await aiService.generateNotes(text, language);
        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'NOTES_VIEW', { fileId, durationMs });

        // Store generated content
        await db.courseFileAI.upsert({
          where: { fileId },
          create: {
            fileId,
            notes: { keyPoints: notes.keyPoints, detailed: notes.detailed },
            notesGeneratedAt: new Date(),
          },
          update: {
            notes: { keyPoints: notes.keyPoints, detailed: notes.detailed },
            notesGeneratedAt: new Date(),
          },
        });

        return reply.send({
          notes: { keyPoints: notes.keyPoints, detailed: notes.detailed },
          generatedAt: new Date(),
          cached: false,
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, fileId }, 'Failed to generate notes');
        return reply.status(500).send({ error: 'Failed to generate notes' });
      }
    }
  );

  // POST /api/ai/file/:fileId/quiz - Generate or get quiz
  server.post(
    '/ai/file/:fileId/quiz',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const {
        difficulty = 'MEDIUM',
        count = 10,
        questionTypes,
      } = request.query as {
        difficulty?: QuizDifficulty;
        count?: number;
        questionTypes?: string | string[];
      };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      try {
        const { file } = await verifyFileAccess(fileId, userId, userRole);

        if (!isAICompatibleFile(file.fileType)) {
          return reply.status(400).send({
            error: 'This file type does not support AI features',
            supportedTypes: SUPPORTED_FILE_TYPES,
          });
        }

        // Validate parameters
        const validDifficulty: QuizDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(difficulty)
          ? difficulty
          : 'MEDIUM';
        const validCount = Math.min(Math.max(Number(count) || 10, 5), 40);
        const normalizedQuestionTypes = normalizeQuizQuestionTypesInput(questionTypes);

        if (questionTypes && normalizedQuestionTypes.length === 0) {
          return reply.status(400).send({
            error:
              'Invalid questionTypes. Supported values: MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_THE_BLANK',
          });
        }

        const effectiveQuestionTypes =
          normalizedQuestionTypes.length > 0
            ? normalizedQuestionTypes
            : SUPPORTED_QUIZ_QUESTION_TYPES;

        // Extract text and generate quiz
        const startTime = Date.now();
        const text = await getFileText(fileId, file.filePath, file.fileType);
        const language = await getUserLanguage(userId);
        const quiz = await aiService.generateQuiz(
          text,
          validCount,
          validDifficulty,
          language,
          effectiveQuestionTypes
        );
        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'QUIZ_ATTEMPT', { fileId, durationMs });

        // Store generated content
        await db.courseFileAI.upsert({
          where: { fileId },
          create: {
            fileId,
            quiz: {
              title: quiz.title,
              questions: quiz.questions,
              difficulty: validDifficulty,
              questionTypes: effectiveQuestionTypes,
            },
            quizGeneratedAt: new Date(),
          },
          update: {
            quiz: {
              title: quiz.title,
              questions: quiz.questions,
              difficulty: validDifficulty,
              questionTypes: effectiveQuestionTypes,
            },
            quizGeneratedAt: new Date(),
          },
        });

        return reply.send({
          quiz: {
            title: quiz.title,
            questions: quiz.questions,
            difficulty: validDifficulty,
            questionTypes: effectiveQuestionTypes,
          },
          generatedAt: new Date(),
          cached: false,
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }

        const errorMessage = typeof error?.message === 'string' ? error.message : '';
        if (errorMessage.toLowerCase().includes('not enough content to generate')) {
          return reply.status(400).send({ error: errorMessage });
        }
        if (errorMessage.toLowerCase().includes('not enough distinct information')) {
          return reply.status(400).send({ error: errorMessage });
        }

        logger.error({ error, fileId }, 'Failed to generate quiz');
        return reply.status(500).send({ error: 'Failed to generate quiz' });
      }
    }
  );

  // POST /api/ai/file/:fileId/flashcards - Generate or get flashcards
  server.post(
    '/ai/file/:fileId/flashcards',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const { refresh = false, count = 15 } = request.query as {
        refresh?: boolean;
        count?: number;
      };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      try {
        const { file } = await verifyFileAccess(fileId, userId, userRole);

        if (!isAICompatibleFile(file.fileType)) {
          return reply.status(400).send({
            error: 'This file type does not support AI features',
            supportedTypes: SUPPORTED_FILE_TYPES,
          });
        }

        // Validate parameters
        const validCount = Math.min(Math.max(Number(count) || 15, 5), 30);

        // Check for cached content
        if (!refresh) {
          const existing = await db.courseFileAI.findUnique({
            where: { fileId },
            select: { cards: true, cardsGeneratedAt: true },
          });

          if (existing?.cards) {
            return reply.send({
              flashcards: existing.cards,
              generatedAt: existing.cardsGeneratedAt,
              cached: true,
            });
          }
        }

        // Extract text and generate flashcards
        const startTime = Date.now();
        const text = await getFileText(fileId, file.filePath, file.fileType);
        const language = await getUserLanguage(userId);
        const flashcards = await aiService.generateFlashcards(text, validCount, language);
        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'FLASHCARD_STUDY', { fileId, durationMs });

        // Store generated content
        await db.courseFileAI.upsert({
          where: { fileId },
          create: {
            fileId,
            cards: { title: flashcards.title, cards: flashcards.cards },
            cardsGeneratedAt: new Date(),
          },
          update: {
            cards: { title: flashcards.title, cards: flashcards.cards },
            cardsGeneratedAt: new Date(),
          },
        });

        return reply.send({
          flashcards: { title: flashcards.title, cards: flashcards.cards },
          generatedAt: new Date(),
          cached: false,
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, fileId }, 'Failed to generate flashcards');
        return reply.status(500).send({ error: 'Failed to generate flashcards' });
      }
    }
  );

  // DELETE /api/ai/file/:fileId - Clear all AI content for a file
  server.delete(
    '/ai/file/:fileId',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { fileId } = request.params as { fileId: string };
      const userId = request.user!.userId;
      const userRole = request.user!.role;

      try {
        const { course } = await verifyFileAccess(fileId, userId, userRole);

        // Only file owner can delete AI content
        if (course.createdBy !== userId && userRole !== 'ADMIN') {
          return reply.status(403).send({ error: 'Only the file owner can delete AI content' });
        }

        await db.courseFileAI.deleteMany({
          where: { fileId },
        });

        return reply.send({ success: true, message: 'AI content cleared' });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, fileId }, 'Failed to delete AI content');
        return reply.status(500).send({ error: 'Failed to delete AI content' });
      }
    }
  );
}
