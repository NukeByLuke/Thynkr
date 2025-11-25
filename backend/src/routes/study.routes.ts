import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import { FileProcessorService } from '../services/file-processor.service';
import { AIService } from '../services/ai.service';
import prisma from '../db/client';
import fs from 'fs/promises';
import { normalizeFileForLanguage, resolveUserLanguage } from '../utils/language.utils';

const fileProcessor = new FileProcessorService();
const aiService = new AIService();

// Helper function to check if user can access a file (either owns it or it's in a published course)
async function canAccessFile(fileId: string, userId: string): Promise<boolean> {
  const file = await prisma.uploadedFile.findUnique({
    where: { id: fileId },
    include: {
      courseLessons: {
        include: {
          course: {
            select: { published: true },
          },
        },
      },
    },
  });

  if (!file) return false;
  
  // User owns the file
  if (file.userId === userId) return true;
  
  // File is part of a published course
  return file.courseLessons.some(lesson => lesson.course.published);
}

export default async function studyRoutes(server: FastifyInstance) {
  // Add content type parser for multipart/form-data
  server.addContentTypeParser('multipart/form-data', (_request, _payload, done) => {
    done(null);
  });

  server.post(
    '/upload',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        // Handle multipart form data with multer using promisified version
        const files: Express.Multer.File[] = await new Promise((resolve, reject) => {
          const multerMiddleware = upload.array('files', 5);
          multerMiddleware(request.raw as any, reply.raw as any, (err: any) => {
            if (err) {
              server.log.error({ err }, 'Multer error');
              reject(err);
            } else {
              const uploadedFiles = (request.raw as any).files;
              if (!uploadedFiles) {
                reject(new Error('No files received'));
              } else {
                resolve(uploadedFiles);
              }
            }
          });
        });

        if (!files || files.length === 0) {
          server.log.warn('No files in upload request');
          return reply.code(400).send({ error: 'No files uploaded' });
        }

        server.log.info({ fileCount: files.length }, 'Processing uploaded files');
        const uploadedFiles = [];

        for (const file of files) {
          // Validate file
          if (!fileProcessor.validateFileType(file.mimetype, file.originalname)) {
            await fs.unlink(file.path);
            return reply.code(400).send({ error: `File ${file.originalname} has invalid type` });
          }

          const canExtractText = fileProcessor.supportsTextExtraction(file.mimetype, file.originalname);

          // Extract text when supported; otherwise keep as uploaded-only
          let extractedText: string | null = null;
          let status: 'UPLOADED' | 'COMPLETED' | 'FAILED' = 'UPLOADED';

          if (canExtractText) {
            try {
              extractedText = await fileProcessor.extractText(file.path, file.mimetype);
              status = 'COMPLETED';
            } catch (error: any) {
              server.log.error({ error, file: file.originalname }, 'Failed to extract text');
              status = 'FAILED';
            }
          } else {
            server.log.info({ file: file.originalname, mimetype: file.mimetype }, 'Skipping text extraction for unsupported type');
          }

          // Save to database
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

          uploadedFiles.push(uploadedFile);
        }

        return reply.code(201).send({ files: uploadedFiles });
      } catch (error: any) {
        server.log.error({ error }, 'File upload error');
        return reply.code(500).send({ error: 'Failed to upload files' });
      }
    }
  );

  // Get user's uploaded files
  server.get(
    '/files',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const language = await resolveUserLanguage(request.user!.userId);

      const files = await prisma.uploadedFile.findMany({
        where: { userId: request.user!.userId },
        orderBy: { createdAt: 'desc' },
        include: {
          summaries: {
            where: { language },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
          notes: {
            where: { language },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
          quizzes: {
            where: { language },
            include: {
              questions: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          flashcardSets: {
            where: { language },
            include: {
              cards: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      const normalizedFiles = files.map(normalizeFileForLanguage);

      return reply.send({ files: normalizedFiles });
    }
  );

  // Get single file details
  server.get(
    '/files/:id',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const language = await resolveUserLanguage(request.user!.userId);

      const file = await prisma.uploadedFile.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
        include: {
          summaries: {
            where: { language },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
          notes: {
            where: { language },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
          quizzes: {
            where: { language },
            include: {
              questions: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          flashcardSets: {
            where: { language },
            include: {
              cards: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      return reply.send({ file: normalizeFileForLanguage(file) });
    }
  );

  // Generate summary
  server.post(
    '/files/:id/summary',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const language = await resolveUserLanguage(request.user!.userId);

      // Check if user can access this file (owns it or it's in a published course)
      const hasAccess = await canAccessFile(id, request.user!.userId);
      if (!hasAccess) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const file = await prisma.uploadedFile.findUnique({
        where: { id },
        include: {
          summaries: {
            where: { language },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Return existing summary if available
      const existingSummary = file.summaries?.[0];
      if (existingSummary) {
        return reply.send({ summary: existingSummary });
      }

      if (!file.extractedText) {
        return reply.code(400).send({ error: 'File has no extracted text' });
      }

      // Generate new summary
      try {
        const generated = await aiService.generateSummary(file.extractedText, language);

        const summary = await prisma.fileSummary.upsert({
          where: {
            fileId_language: {
              fileId: file.id,
              language,
            },
          },
          update: {
            content: generated.content,
          },
          create: {
            fileId: file.id,
            content: generated.content,
            language,
          },
        });

        return reply.send({ summary });
      } catch (error: any) {
        server.log.error({ error, fileId: id }, 'Failed to generate summary');
        return reply.code(500).send({ error: 'Failed to generate summary' });
      }
    }
  );

  // Generate notes
  server.post(
    '/files/:id/notes',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const language = await resolveUserLanguage(request.user!.userId);

      // Check if user can access this file
      const hasAccess = await canAccessFile(id, request.user!.userId);
      if (!hasAccess) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const file = await prisma.uploadedFile.findUnique({
        where: { id },
        include: {
          notes: {
            where: { language },
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Return existing notes if available
      const existingNotes = file.notes?.[0];
      if (existingNotes) {
        return reply.send({ notes: existingNotes });
      }

      if (!file.extractedText) {
        return reply.code(400).send({ error: 'File has no extracted text' });
      }

      // Generate new notes
      try {
        const generated = await aiService.generateNotes(file.extractedText, language);

        const notes = await prisma.fileNotes.upsert({
          where: {
            fileId_language: {
              fileId: file.id,
              language,
            },
          },
          update: {
            keyPoints: generated.keyPoints,
            detailed: generated.detailed,
          },
          create: {
            fileId: file.id,
            keyPoints: generated.keyPoints,
            detailed: generated.detailed,
            language,
          },
        });

        return reply.send({ notes });
      } catch (error: any) {
        server.log.error({ error, fileId: id }, 'Failed to generate notes');
        return reply.code(500).send({ error: 'Failed to generate notes' });
      }
    }
  );

  // Generate quiz
  server.post(
    '/files/:id/quiz',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { numQuestions = 10, difficulty = 'MEDIUM' } = request.body as {
        numQuestions?: number;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      };

      // Check if user can access this file
      const hasAccess = await canAccessFile(id, request.user!.userId);
      if (!hasAccess) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const file = await prisma.uploadedFile.findUnique({
        where: { id },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      if (!file.extractedText) {
        return reply.code(400).send({ error: 'File has no extracted text' });
      }

      // Validate inputs
      if (numQuestions < 5 || numQuestions > 20) {
        return reply.code(400).send({ error: 'Number of questions must be between 5 and 20' });
      }

      if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        return reply.code(400).send({ error: 'Invalid difficulty level' });
      }

      const language = await resolveUserLanguage(request.user!.userId);

      // Generate quiz
      try {
        const generated = await aiService.generateQuiz(file.extractedText, numQuestions, difficulty, language);

        const quiz = await prisma.quiz.create({
          data: {
            fileId: file.id,
            title: generated.title,
            difficulty,
            language,
            questions: {
              create: generated.questions.map((q, index) => ({
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                order: index,
              })),
            },
          },
          include: {
            questions: true,
          },
        });

        return reply.send({ quiz });
      } catch (error: any) {
        server.log.error({ error, fileId: id }, 'Failed to generate quiz');
        return reply.code(500).send({ error: 'Failed to generate quiz' });
      }
    }
  );

  // Generate flashcards
  server.post(
    '/files/:id/flashcards',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { numCards = 20 } = request.body as { numCards?: number };

      // Check if user can access this file
      const hasAccess = await canAccessFile(id, request.user!.userId);
      if (!hasAccess) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const file = await prisma.uploadedFile.findUnique({
        where: { id },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      if (!file.extractedText) {
        return reply.code(400).send({ error: 'File has no extracted text' });
      }

      // Validate inputs
      if (numCards < 10 || numCards > 50) {
        return reply.code(400).send({ error: 'Number of flashcards must be between 10 and 50' });
      }

      const language = await resolveUserLanguage(request.user!.userId);

      // Generate flashcards
      try {
        const generated = await aiService.generateFlashcards(file.extractedText, numCards, language);

        const flashcardSet = await prisma.flashcardSet.create({
          data: {
            fileId: file.id,
            title: generated.title,
            language,
            cards: {
              create: generated.cards.map((card, index) => ({
                front: card.front,
                back: card.back,
                order: index,
              })),
            },
          },
          include: {
            cards: true,
          },
        });

        return reply.send({ flashcardSet });
      } catch (error: any) {
        server.log.error({ error, fileId: id }, 'Failed to generate flashcards');
        return reply.code(500).send({ error: 'Failed to generate flashcards' });
      }
    }
  );

  // Submit quiz attempt
  server.post(
    '/quizzes/:id/submit',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { answers } = request.body as { answers: Record<string, string> };

      const quiz = await prisma.quiz.findFirst({
        where: { id },
        include: {
          questions: true,
        },
      });

      if (!quiz) {
        return reply.code(404).send({ error: 'Quiz not found' });
      }

      // Verify the file belongs to the user
      const file = await prisma.uploadedFile.findFirst({
        where: {
          id: quiz.fileId,
          userId: request.user!.userId,
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'Quiz not found' });
      }

      // Calculate score
      let correctCount = 0;
      const results: Record<string, { correct: boolean; correctAnswer: string }> = {};

      quiz.questions.forEach((question: any) => {
        const userAnswer = answers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;

        if (isCorrect) {
          correctCount++;
        }

        results[question.id] = {
          correct: isCorrect,
          correctAnswer: question.correctAnswer,
        };
      });

      // Save attempt
      const attempt = await prisma.quizAttempt.create({
        data: {
          quizId: quiz.id,
          userId: request.user!.userId,
          answers,
          score: correctCount,
          totalQuestions: quiz.questions.length,
        },
      });

      return reply.send({
        attempt,
        results,
        score: correctCount,
        total: quiz.questions.length,
        percentage: Math.round((correctCount / quiz.questions.length) * 100),
      });
    }
  );

  // Delete file
  server.delete(
    '/files/:id',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const file = await prisma.uploadedFile.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Delete physical file
      try {
        await fs.unlink(file.filePath);
      } catch (error) {
        server.log.warn({ error, filePath: file.filePath }, 'Failed to delete physical file');
      }

      // Delete from database (cascade will handle related records)
      await prisma.uploadedFile.delete({
        where: { id },
      });

      return reply.send({ message: 'File deleted successfully' });
    }
  );

  // Rename file
  server.patch(
    '/files/:id/rename',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { originalName } = request.body as { originalName: string };

      if (!originalName || originalName.trim().length === 0) {
        return reply.code(400).send({ error: 'File name is required' });
      }

      const file = await prisma.uploadedFile.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      const updatedFile = await prisma.uploadedFile.update({
        where: { id },
        data: { originalName: originalName.trim() },
      });

      return reply.send({ file: updatedFile });
    }
  );

  // Move file to folder
  server.patch(
    '/files/:id/move',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { folderId } = request.body as { folderId: string | null };

      const file = await prisma.uploadedFile.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
      });

      if (!file) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Verify folder exists and belongs to user (if folderId is provided)
      if (folderId) {
        const folder = await prisma.folder.findFirst({
          where: {
            id: folderId,
            userId: request.user!.userId,
          },
        });

        if (!folder) {
          return reply.code(404).send({ error: 'Folder not found' });
        }
      }

      const updatedFile = await prisma.uploadedFile.update({
        where: { id },
        data: { folderId },
      });

      return reply.send({ file: updatedFile });
    }
  );

  // ============ FOLDER MANAGEMENT ============

  // Create folder
  server.post(
    '/folders',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { name, parentId } = request.body as { name: string; parentId?: string };

      if (!name || name.trim().length === 0) {
        return reply.code(400).send({ error: 'Folder name is required' });
      }

      // Verify parent folder exists and belongs to user (if parentId is provided)
      if (parentId) {
        const parentFolder = await prisma.folder.findFirst({
          where: {
            id: parentId,
            userId: request.user!.userId,
          },
        });

        if (!parentFolder) {
          return reply.code(404).send({ error: 'Parent folder not found' });
        }
      }

      const folder = await prisma.folder.create({
        data: {
          userId: request.user!.userId,
          name: name.trim(),
          parentId: parentId || null,
        },
      });

      return reply.code(201).send({ folder });
    }
  );

  // Get all folders
  server.get(
    '/folders',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const folders = await prisma.folder.findMany({
        where: { userId: request.user!.userId },
        include: {
          children: true,
          files: {
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
        orderBy: { name: 'asc' },
      });

      return reply.send({ folders });
    }
  );

  // Get single folder
  server.get(
    '/folders/:id',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const language = await resolveUserLanguage(request.user!.userId);

      const folder = await prisma.folder.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
        include: {
          parent: true,
          children: true,
          files: {
            include: {
              summaries: {
                where: { language },
                orderBy: { updatedAt: 'desc' },
                take: 1,
              },
              notes: {
                where: { language },
                orderBy: { updatedAt: 'desc' },
                take: 1,
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!folder) {
        return reply.code(404).send({ error: 'Folder not found' });
      }

      const normalizedFiles = folder.files.map(normalizeFileForLanguage);

      return reply.send({
        folder: {
          ...folder,
          files: normalizedFiles,
        },
      });
    }
  );

  // Rename folder
  server.patch(
    '/folders/:id',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { name } = request.body as { name: string };

      if (!name || name.trim().length === 0) {
        return reply.code(400).send({ error: 'Folder name is required' });
      }

      const folder = await prisma.folder.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
      });

      if (!folder) {
        return reply.code(404).send({ error: 'Folder not found' });
      }

      const updatedFolder = await prisma.folder.update({
        where: { id },
        data: { name: name.trim() },
      });

      return reply.send({ folder: updatedFolder });
    }
  );

  // Delete folder
  server.delete(
    '/folders/:id',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const folder = await prisma.folder.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
        include: {
          children: true,
          files: true,
        },
      });

      if (!folder) {
        return reply.code(404).send({ error: 'Folder not found' });
      }

      // Check if folder has children or files
      if (folder.children.length > 0) {
        return reply.code(400).send({ error: 'Cannot delete folder with subfolders. Delete subfolders first.' });
      }

      if (folder.files.length > 0) {
        return reply.code(400).send({ error: 'Cannot delete folder with files. Move or delete files first.' });
      }

      await prisma.folder.delete({
        where: { id },
      });

      return reply.send({ message: 'Folder deleted successfully' });
    }
  );
}
