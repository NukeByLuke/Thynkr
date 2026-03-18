import { FastifyInstance } from 'fastify';
import prisma from '../db/client';
import { authenticate, AuthenticatedRequest, requireMinRole } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { AIService, QuizDifficulty } from '../services/ai.service';
import { FileProcessorService } from '../services/file-processor.service';
import { logger } from '../lib/logger';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs/promises';

const db = prisma as any;

// Initialize services
let aiService: AIService | null = null;
const fileProcessor = new FileProcessorService();

try {
  aiService = new AIService();
  logger.info('AI Service initialized for course study');
} catch (error) {
  logger.warn('AI Service not available - OpenAI API key not configured');
}

// Supported file types for AI
const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow',
];

function isAICompatibleFile(fileType: string): boolean {
  return SUPPORTED_FILE_TYPES.includes(fileType) || fileType.startsWith('text/');
}

// Generate hash for file combination
function generateFileHash(fileIds: string[]): string {
  const sorted = [...fileIds].sort();
  return createHash('sha256').update(sorted.join(',')).digest('hex').substring(0, 32);
}

// Get or extract text from a course file
async function getFileText(fileId: string, filePath: string, fileType: string): Promise<string> {
  const existing = await db.courseFileAI.findUnique({
    where: { fileId },
    select: { extractedText: true },
  });

  if (existing?.extractedText) {
    return existing.extractedText;
  }

  // Resolve file path relative to uploads directory
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const fullPath = path.join(uploadsDir, filePath);
  try {
    await fs.access(fullPath);
  } catch (error) {
    logger.error({ error, fileId, filePath, fullPath }, 'File not accessible');
    throw new Error(`File not found: ${fileId} at ${fullPath}`);
  }

  const extractedText = await fileProcessor.extractText(fullPath, fileType);

  await db.courseFileAI.upsert({
    where: { fileId },
    create: { fileId, extractedText },
    update: { extractedText },
  });

  return extractedText;
}

// Get user's preferred language
async function getUserLanguage(userId: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { preferredLanguage: true },
  });
  return user?.preferredLanguage || 'en';
}

// Verify user has access to a course
async function verifyCourseAccess(
  courseId: string,
  userId: string,
  userRole: string,
  shareToken?: string
): Promise<any> {
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      files: {
        select: {
          id: true,
          name: true,
          filePath: true,
          fileType: true,
          fileSize: true,
        },
      },
    },
  });

  if (!course) {
    throw { statusCode: 404, message: 'Course not found' };
  }

  const isOwner = course.createdBy === userId;
  const isPublic = course.visibility === 'PUBLIC';
  const hasValidToken = shareToken && course.shareToken === shareToken;
  const canViewPublic = userRole === 'PREMIUM' || userRole === 'ADMIN';

  // Role-based access:
  // - BASIC: No study access at all
  // - STANDARD: Can study own courses OR via valid share token
  // - PREMIUM/ADMIN: Can study own + public courses OR via valid share token
  if (userRole === 'BASIC') {
    throw { statusCode: 403, message: 'Upgrade to Standard or higher to access AI study features' };
  }

  if (!isOwner && !hasValidToken && !(isPublic && canViewPublic)) {
    throw { statusCode: 403, message: 'You do not have access to study this course' };
  }

  return course;
}

interface StudyRequestBody {
  courseId: string;
  fileIds: string[];
  type: 'summary' | 'notes' | 'quiz' | 'flashcards';
  difficulty?: QuizDifficulty;
  count?: number;
}

interface SummaryPage {
  pageNumber: number;
  fileId: string;
  fileName: string;
  content: string;
}

interface NotesPage {
  pageNumber: number;
  fileId: string;
  fileName: string;
  keyPoints: string[];
  detailed: string;
}

export default async function courseStudyRoutes(server: FastifyInstance) {
  /**
   * POST /api/ai/study - Unified study endpoint for multi-file AI content
   *
   * Body: { courseId, fileIds[], type: "summary" | "notes" | "quiz" | "flashcards" }
   * Query: ?refresh=true to bypass cache
   */
  server.post(
    '/ai/study',
    {
      preHandler: [authenticate, requireMinRole('STANDARD'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const { refresh = false } = request.query as { refresh?: boolean };
      const body = request.body as StudyRequestBody;

      if (!aiService) {
        return reply.status(503).send({ error: 'AI service not available' });
      }

      // Validate request
      if (
        !body.courseId ||
        !body.fileIds ||
        !Array.isArray(body.fileIds) ||
        body.fileIds.length === 0
      ) {
        return reply.status(400).send({ error: 'courseId and fileIds are required' });
      }

      const validTypes = ['summary', 'notes', 'quiz', 'flashcards'];
      if (!body.type || !validTypes.includes(body.type)) {
        return reply
          .status(400)
          .send({ error: 'Invalid type. Must be: summary, notes, quiz, or flashcards' });
      }

      try {
        // Verify course access (share token passed via query param)
        const { token: shareToken } = request.query as { token?: string };
        const course = await verifyCourseAccess(body.courseId, userId, userRole, shareToken);

        // Validate file IDs belong to this course
        const courseFileIds = new Set(course.files.map((f: any) => f.id));
        const validFileIds = body.fileIds.filter((id: string) => courseFileIds.has(id));

        if (validFileIds.length === 0) {
          return reply
            .status(400)
            .send({ error: 'None of the provided files belong to this course' });
        }

        // Filter to AI-compatible files only
        const compatibleFiles = course.files.filter(
          (f: any) => validFileIds.includes(f.id) && isAICompatibleFile(f.fileType)
        );

        if (compatibleFiles.length === 0) {
          return reply
            .status(400)
            .send({ error: 'None of the selected files support AI features' });
        }

        const fileHash = generateFileHash(compatibleFiles.map((f: any) => f.id));

        // Check cache
        if (!refresh) {
          const cached = await db.studyCache.findUnique({
            where: {
              userId_courseId_fileHash_type: {
                userId,
                courseId: body.courseId,
                fileHash,
                type: body.type,
              },
            },
          });

          if (cached) {
            return reply.send({
              type: body.type,
              fileCount: compatibleFiles.length,
              files: compatibleFiles.map((f: any) => ({ id: f.id, name: f.name })),
              result: cached.result,
              cached: true,
              generatedAt: cached.updatedAt,
            });
          }
        }

        // Extract text from all files
        const startTime = Date.now();
        const fileTexts: { fileId: string; fileName: string; text: string }[] = [];

        for (const file of compatibleFiles) {
          try {
            const text = await getFileText(file.id, file.filePath, file.fileType);
            fileTexts.push({ fileId: file.id, fileName: file.name, text });
          } catch (error) {
            logger.warn({ error, fileId: file.id }, 'Failed to extract text from file');
          }
        }

        if (fileTexts.length === 0) {
          return reply.status(500).send({ error: 'Failed to extract text from any files' });
        }

        const language = await getUserLanguage(userId);
        let result: any;

        switch (body.type) {
          case 'summary': {
            // Generate summary for each file and create paginated result
            const pages: SummaryPage[] = [];
            for (let i = 0; i < fileTexts.length; i++) {
              const { fileId, fileName, text } = fileTexts[i];
              const summary = await aiService.generateSummary(text, language);
              pages.push({
                pageNumber: i + 1,
                fileId,
                fileName,
                content: summary.content,
              });
            }
            result = { pages, totalPages: pages.length };
            break;
          }

          case 'notes': {
            // Generate notes for each file and create paginated result
            const pages: NotesPage[] = [];
            for (let i = 0; i < fileTexts.length; i++) {
              const { fileId, fileName, text } = fileTexts[i];
              const notes = await aiService.generateNotes(text, language);
              pages.push({
                pageNumber: i + 1,
                fileId,
                fileName,
                keyPoints: notes.keyPoints,
                detailed: notes.detailed,
              });
            }
            result = { pages, totalPages: pages.length };
            break;
          }

          case 'quiz': {
            // Combine all texts and generate a unified quiz
            const combinedText = fileTexts
              .map((f) => `### ${f.fileName}\n\n${f.text}`)
              .join('\n\n---\n\n');
            const difficulty = body.difficulty || 'MEDIUM';
            const count = Math.min(Math.max(body.count || 10, 5), 20);
            const quiz = await aiService.generateQuiz(combinedText, count, difficulty, language);
            result = {
              title: quiz.title,
              questions: quiz.questions,
              difficulty,
              sourceFiles: fileTexts.map((f) => f.fileName),
            };
            break;
          }

          case 'flashcards': {
            // Combine all texts and generate unified flashcards
            const combinedText = fileTexts
              .map((f) => `### ${f.fileName}\n\n${f.text}`)
              .join('\n\n---\n\n');
            const count = Math.min(Math.max(body.count || 20, 10), 50);
            const flashcards = await aiService.generateFlashcards(combinedText, count, language);
            result = {
              title: flashcards.title,
              cards: flashcards.cards,
              sourceFiles: fileTexts.map((f) => f.fileName),
            };
            break;
          }
        }

        const durationMs = Date.now() - startTime;

        // Record AI usage
        const activityType = {
          summary: 'SUMMARY_VIEW',
          notes: 'NOTES_VIEW',
          quiz: 'QUIZ_ATTEMPT',
          flashcards: 'FLASHCARD_STUDY',
        }[body.type] as any;

        await recordAIUsage(userId, activityType, {
          durationMs,
        });

        // Cache the result
        await db.studyCache.upsert({
          where: {
            userId_courseId_fileHash_type: {
              userId,
              courseId: body.courseId,
              fileHash,
              type: body.type,
            },
          },
          create: {
            userId,
            courseId: body.courseId,
            fileIds: compatibleFiles.map((f: any) => f.id),
            fileHash,
            type: body.type,
            result,
          },
          update: {
            result,
            updatedAt: new Date(),
          },
        });

        return reply.send({
          type: body.type,
          fileCount: compatibleFiles.length,
          files: compatibleFiles.map((f: any) => ({ id: f.id, name: f.name })),
          result,
          cached: false,
          generatedAt: new Date(),
        });
      } catch (error: any) {
        if (error.statusCode) {
          return reply.status(error.statusCode).send({ error: error.message });
        }
        logger.error({ error, body }, 'Failed to generate study content');
        return reply.status(500).send({ error: 'Failed to generate study content' });
      }
    }
  );

  /**
   * GET /api/ai/study/status - Get study access status for a course
   */
  server.get(
    '/ai/study/status/:courseId',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const { courseId } = request.params as { courseId: string };

      try {
        const course = await db.course.findUnique({
          where: { id: courseId },
          select: {
            id: true,
            visibility: true,
            createdBy: true,
            shareToken: true,
            files: {
              select: {
                id: true,
                name: true,
                fileType: true,
                fileSize: true,
              },
            },
          },
        });

        if (!course) {
          return reply.status(404).send({ error: 'Course not found' });
        }

        const isOwner = course.createdBy === userId;
        const isPublic = course.visibility === 'PUBLIC';
        const { token: shareToken } = request.query as { token?: string };
        const hasValidToken = shareToken && course.shareToken === shareToken;

        // Determine access level
        let canStudy = false;
        let reason = '';

        if (userRole === 'BASIC') {
          canStudy = false;
          reason = 'Upgrade to Standard or higher to access AI study features';
        } else if (userRole === 'STANDARD') {
          canStudy = isOwner || !!hasValidToken;
          reason = canStudy ? '' : 'Standard users can only study their own courses';
        } else {
          // PREMIUM or ADMIN
          canStudy = isOwner || isPublic || !!hasValidToken;
          reason = canStudy ? '' : 'This course is private';
        }

        // Get AI-compatible files
        const aiCompatibleFiles = course.files.filter((f: any) => isAICompatibleFile(f.fileType));

        return reply.send({
          canStudy,
          reason,
          isOwner,
          role: userRole,
          totalFiles: course.files.length,
          aiCompatibleFiles: aiCompatibleFiles.length,
          files: course.files.map((f: any) => ({
            id: f.id,
            name: f.name,
            fileType: f.fileType,
            fileSize: f.fileSize,
            isAICompatible: isAICompatibleFile(f.fileType),
          })),
        });
      } catch (error: any) {
        logger.error({ error, courseId }, 'Failed to get study status');
        return reply.status(500).send({ error: 'Failed to get study status' });
      }
    }
  );

  /**
   * DELETE /api/ai/study/cache - Clear study cache for a course
   */
  server.delete(
    '/ai/study/cache/:courseId',
    {
      preHandler: [authenticate, requireMinRole('STANDARD')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const userId = request.user!.userId;
      const { courseId } = request.params as { courseId: string };

      try {
        const deleted = await db.studyCache.deleteMany({
          where: {
            userId,
            courseId,
          },
        });

        return reply.send({
          success: true,
          deletedCount: deleted.count,
        });
      } catch (error: any) {
        logger.error({ error, courseId }, 'Failed to clear study cache');
        return reply.status(500).send({ error: 'Failed to clear study cache' });
      }
    }
  );
}
