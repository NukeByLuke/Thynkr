/**
 * Study Routes
 * Handles file uploads, AI-generated study materials (summaries, notes, quizzes, flashcards), and folders.
 *
 * TODO: This file is 1300+ lines. Consider splitting into:
 * - study/files.controller.ts (upload, list, delete)
 * - study/ai-content.controller.ts (summaries, notes, flashcards)
 * - study/quizzes.controller.ts (generate, submit, history)
 * - study/folders.controller.ts (organization)
 */

import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import { FileProcessorService } from '../services/file-processor.service';
import { AIService } from '../services/ai.service';
import prisma from '../db/client';
import fs from 'fs/promises';
import { normalizeFileForLanguage, resolveUserLanguage } from '../utils/language.utils';
import { canUploadFile, getUserUsageStats } from '../lib/tier-limits';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { GoogleGenAI } from '@google/genai';

const fileProcessor = new FileProcessorService();
const aiService = new AIService();

/**
 * Track user study activity and update streaks
 * @param userId - User ID
 * @param activityType - Type of study activity
 * @param fileId - Optional associated file ID
 * @param durationMinutes - Duration of study session (default: 1)
 */
async function trackStudyActivity(
  userId: string,
  activityType: 'FILE_UPLOAD' | 'SUMMARY_VIEW' | 'NOTES_VIEW' | 'QUIZ_ATTEMPT' | 'FLASHCARD_STUDY',
  fileId?: string,
  durationMinutes: number = 1
) {
  try {
    const now = new Date();

    // Convert to EST for time-based achievements
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hourEST = estTime.getHours();

    await prisma.studySession.create({
      data: {
        userId,
        activityType,
        fileId,
        durationMinutes,
      },
    });

    // Import checkAchievements dynamically to avoid circular dependencies
    const { checkAchievements } = await import('../services/gamification.service');

    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const streak = await prisma.studyStreak.findUnique({
      where: { userId },
    });

    if (!streak) {
      await prisma.studyStreak.create({
        data: {
          userId,
          currentStreak: 1,
          longestStreak: 1,
          lastStudyDate: today,
          totalStudyDays: 1,
          totalMinutes: durationMinutes,
        },
      });

      // Track first day of streak
      await checkAchievements(userId, 'study_streak', 1);
    } else {
      const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
      lastStudy?.setHours(0, 0, 0, 0);

      let newCurrentStreak = streak.currentStreak;
      let newTotalDays = streak.totalStudyDays;
      let isNewDay = false;

      if (!lastStudy || lastStudy.getTime() !== today.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastStudy && lastStudy.getTime() === yesterday.getTime()) {
          newCurrentStreak = streak.currentStreak + 1;
        } else if (!lastStudy || lastStudy.getTime() < yesterday.getTime()) {
          newCurrentStreak = 1;
        }
        newTotalDays = streak.totalStudyDays + 1;
        isNewDay = true;
      }

      await prisma.studyStreak.update({
        where: { userId },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
          lastStudyDate: today,
          totalStudyDays: newTotalDays,
          totalMinutes: streak.totalMinutes + durationMinutes,
        },
      });

      // Track streak only on new days
      if (isNewDay) {
        await checkAchievements(userId, 'study_streak', newCurrentStreak);
      }
    }

    // Track study hours (convert minutes to hours)
    const hoursToAdd = durationMinutes / 60;
    await checkAchievements(userId, 'study_hours', hoursToAdd);

    // Track time-based achievements (only once per session)
    if (durationMinutes >= 5) {
      // Only count sessions 5+ minutes
      if (hourEST >= 5 && hourEST < 8) {
        await checkAchievements(userId, 'early_study', 1);
      } else if (hourEST >= 22 || hourEST < 3) {
        await checkAchievements(userId, 'night_study', 1);
      }

      // Track long session achievement (2+ hours)
      if (durationMinutes >= 120) {
        await checkAchievements(userId, 'long_session', 1);
      }
    }
  } catch (error) {
    // Silently fail - don't break the main operation
    console.error('Failed to track study activity:', error);
  }
}

/**
 * Track language usage for multilingual achievement
 * Checks if user has used this language before and triggers achievement tracking
 */
async function trackLanguageUsage(userId: string, language: string): Promise<void> {
  try {
    const { checkAchievements } = await import('../services/gamification.service');

    // Check if user has any content in this language
    const [summaryCount, notesCount, flashcardCount, quizCount] = await Promise.all([
      prisma.fileSummary.count({ where: { file: { userId }, language } }),
      prisma.fileNotes.count({ where: { file: { userId }, language } }),
      prisma.flashcardSet.count({ where: { file: { userId }, language } }),
      prisma.quiz.count({ where: { file: { userId }, language } }),
    ]);

    // If this is the first content in this language, count it as a new language used
    if (summaryCount + notesCount + flashcardCount + quizCount === 1) {
      // Get total unique languages used
      const uniqueLanguages = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT language) as count
        FROM (
          SELECT language FROM file_summaries WHERE file_id IN (SELECT id FROM uploaded_files WHERE user_id = ${userId})
          UNION
          SELECT language FROM file_notes WHERE file_id IN (SELECT id FROM uploaded_files WHERE user_id = ${userId})
          UNION
          SELECT language FROM flashcard_sets WHERE file_id IN (SELECT id FROM uploaded_files WHERE user_id = ${userId})
          UNION
          SELECT language FROM quizzes WHERE file_id IN (SELECT id FROM uploaded_files WHERE user_id = ${userId})
        ) AS languages
      `;

      const languageCount = Number(uniqueLanguages[0]?.count || 0);
      await checkAchievements(userId, 'language_used', languageCount);
    }
  } catch (error) {
    console.error('Failed to track language usage:', error);
  }
}

// Helper function to check if user can access a file (owns it)
async function canAccessFile(fileId: string, userId: string): Promise<boolean> {
  const file = await prisma.uploadedFile.findUnique({
    where: { id: fileId },
    select: { userId: true },
  });

  if (!file) return false;

  // User owns the file
  return file.userId === userId;
}

export default async function studyRoutes(server: FastifyInstance) {
  // Add content type parser for multipart/form-data
  server.addContentTypeParser('multipart/form-data', (_request, _payload, done) => {
    done(null);
  });

  // Get user's usage stats
  server.get(
    '/usage',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: { role: true },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const stats = await getUserUsageStats(request.user!.userId, user.role);
      return reply.send(stats);
    }
  );

  server.post(
    '/upload',
    {
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        // Check upload limits before processing
        const user = await prisma.user.findUnique({
          where: { id: request.user!.userId },
          select: { role: true },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        const uploadCheck = await canUploadFile(request.user!.userId, user.role);
        if (!uploadCheck.allowed) {
          return reply.code(403).send({
            error: uploadCheck.reason,
            upgradeRequired: true,
          });
        }

        // Handle multipart form data with multer using promisified version
        const files: Express.Multer.File[] = await new Promise((resolve, reject) => {
          const multerMiddleware = upload.array('files', 10);
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

        // Verify we don't exceed limits with multiple files
        if (uploadCheck.remaining !== undefined && files.length > uploadCheck.remaining) {
          // Clean up all uploaded files
          for (const file of files) {
            await fs.unlink(file.path).catch(() => {});
          }
          return reply.code(403).send({
            error: `You can only upload ${uploadCheck.remaining} more file(s) this month. Upgrade to get more uploads.`,
            upgradeRequired: true,
          });
        }

        server.log.info({ fileCount: files.length }, 'Processing uploaded files');
        const uploadedFiles = [];

        for (const file of files) {
          // Validate file
          if (!fileProcessor.validateFileType(file.mimetype, file.originalname)) {
            await fs.unlink(file.path);
            return reply.code(400).send({ error: `File ${file.originalname} has invalid type` });
          }

          const canExtractText = fileProcessor.supportsTextExtraction(
            file.mimetype,
            file.originalname
          );

          // Save to database immediately with PROCESSING status
          const uploadedFile = await prisma.uploadedFile.create({
            data: {
              userId: request.user!.userId,
              fileName: file.filename,
              originalName: file.originalname,
              fileType: file.mimetype,
              fileSize: file.size,
              filePath: file.path,
              status: canExtractText ? 'PROCESSING' : 'UPLOADED',
              extractedText: null,
            },
          });

          uploadedFiles.push(uploadedFile);

          // Process text extraction asynchronously in the background (don't await)
          if (canExtractText) {
            setImmediate(async () => {
              try {
                const extractedText = await fileProcessor.extractText(file.path, file.mimetype);
                await prisma.uploadedFile.update({
                  where: { id: uploadedFile.id },
                  data: {
                    extractedText,
                    status: 'COMPLETED',
                  },
                });
                server.log.info(
                  { fileId: uploadedFile.id, fileName: file.originalname },
                  'Text extraction completed'
                );
              } catch (error: any) {
                server.log.error(
                  { error, fileId: uploadedFile.id, file: file.originalname },
                  'Failed to extract text in background'
                );
                await prisma.uploadedFile.update({
                  where: { id: uploadedFile.id },
                  data: { status: 'FAILED' },
                });
              }
            });
          }
        }

        // Track study activity for file upload
        for (const file of uploadedFiles) {
          await trackStudyActivity(request.user!.userId, 'FILE_UPLOAD', file.id);
        }

        // Trigger Librarian achievement for file uploads
        try {
          const { checkAchievements } = await import('../services/gamification.service');
          await checkAchievements(request.user!.userId, 'file_upload', uploadedFiles.length);
        } catch (error) {
          server.log.error({ error }, 'Failed to check achievements for file upload');
        }

        return reply.code(201).send({ files: uploadedFiles });
      } catch (error: any) {
        server.log.error({ error }, 'File upload error');
        return reply.code(500).send({ error: 'Failed to upload files' });
      }
    }
  );

  // Upload YouTube link
  server.post(
    '/upload-youtube',
    {
      preHandler: [authenticate, checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { url, folderId } = request.body as { url: string; folderId?: string };
        const userId = request.user!.userId;

        // Validate YouTube URL
        const youtubeRegex =
          /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&[\w=]*)?$/;
        if (!youtubeRegex.test(url)) {
          return reply.code(400).send({ error: 'Invalid YouTube URL' });
        }

        // Check user existence
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        });
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Check if user tier allows YouTube processing (paid plans only)
        const { getTierLimits } = await import('../lib/tier-limits');
        const limits = getTierLimits(user.role);
        if (!limits.canProcessYouTube) {
          return reply.code(403).send({
            error: 'YouTube video processing is only available for Standard and Premium plans',
            upgradeRequired: true,
          });
        }

        // Check upload limits (temporarily disabled for development)
        // const uploadCheck = await canUploadFile(userId, user.role);
        // if (!uploadCheck.allowed) {
        //   return reply.code(403).send({
        //     error: uploadCheck.reason,
        //     remaining: uploadCheck.remaining,
        //   });
        // }

        // Validate folder if provided
        if (folderId) {
          const folder = await prisma.folder.findFirst({
            where: { id: folderId, userId },
          });
          if (!folder) {
            return reply.code(404).send({ error: 'Folder not found' });
          }
        }

        // Extract video ID from URL
        let videoId = '';
        if (url.includes('youtube.com')) {
          const match = url.match(/[?&]v=([^&]+)/);
          videoId = match ? match[1] : '';
        } else if (url.includes('youtu.be')) {
          const match = url.match(/youtu\.be\/([^?]+)/);
          videoId = match ? match[1] : '';
        }

        // Fetch video metadata using oEmbed API (reliable, doesn't get blocked)
        let videoTitle = `YouTube Video ${videoId}`;
        let videoDescription = '';

        try {
          server.log.info({ videoId }, 'Fetching YouTube video metadata via oEmbed...');
          
          const oembedResponse = await fetch(
            `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
          );
          if (oembedResponse.ok) {
            const oembedData = (await oembedResponse.json()) as { title?: string; author_name?: string };
            videoTitle = oembedData.title || videoTitle;
            videoDescription = oembedData.author_name ? `By ${oembedData.author_name}` : '';
            server.log.info({ videoId, title: videoTitle }, 'Video metadata fetched successfully');
          }
        } catch (oembedError) {
          server.log.warn({ error: oembedError, videoId }, 'oEmbed API failed, using default title');
        }

        // Build content with title and description as baseline
        const contentParts = [`Title: ${videoTitle}`];

        if (videoDescription && videoDescription.trim().length > 0) {
          // Limit description to first 2000 characters to avoid overly long text
          const truncatedDescription =
            videoDescription.length > 2000
              ? videoDescription.substring(0, 2000) + '...'
              : videoDescription;
          contentParts.push(`\nDescription:\n${truncatedDescription}`);
        }

        // Track extraction method and results
        let hasTranscript = false;
        let transcriptText = '';
        let extractionMethod = 'metadata-only';

        // ===== Gemini Direct YouTube URL (Processes Video Natively) =====
        // Uses gemini-2.5-flash-lite for cost efficiency
        // Limitations: public videos only, up to 10 videos per request
        try {
          server.log.info({ videoId }, 'Processing YouTube video with Gemini 2.5 Flash Lite...');
          
          const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
          
          // Use the correct format from official docs: https://ai.google.dev/gemini-api/docs/video-understanding
          const contents = [
            {
              fileData: {
                fileUri: url,
              },
            },
            { 
              text: 'Please provide a complete transcript of this video. Include all spoken dialogue, narration, and important visual descriptions. Format it as a clean, readable transcript without timestamps.' 
            }
          ];
          
          // 3 minute timeout for longer videos
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Gemini request timed out after 3 minutes')), 180000);
          });
          
          const geminiPromise = genai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: contents,
          });
          
          const response = await Promise.race([geminiPromise, timeoutPromise]);
          
          const geminiTranscript = response.text;
          if (geminiTranscript && geminiTranscript.trim().length > 50) {
            transcriptText = geminiTranscript;
            hasTranscript = true;
            extractionMethod = 'gemini-youtube-direct';
            server.log.info({ videoId, length: transcriptText.length }, 'Gemini YouTube processing successful');
          } else {
            server.log.warn({ videoId }, 'Gemini returned empty or insufficient transcript');
          }
        } catch (geminiError: any) {
          const errorMsg = geminiError instanceof Error ? geminiError.message : String(geminiError);
          server.log.error({ error: geminiError, videoId }, 'Gemini YouTube URL processing failed');
          
          // Parse Gemini API errors for better user feedback
          if (geminiError?.error?.code === 400) {
            const details = geminiError.error;
            if (details.message?.includes('API key expired') || details.message?.includes('API_KEY_INVALID')) {
              return reply.code(503).send({ 
                error: 'YouTube processing is temporarily unavailable. Please try again later or contact support.',
                technical: 'AI service configuration issue'
              });
            }
            if (details.message?.includes('Video not found') || details.message?.includes('private')) {
              return reply.code(400).send({ 
                error: 'This video cannot be processed. It may be private, age-restricted, or unavailable.',
              });
            }
          }
          
          // Generic Gemini failure - still return a user-friendly error
          return reply.code(503).send({ 
            error: 'Unable to process this YouTube video at the moment. Please try again later.',
            technical: errorMsg
          });
        }

        // Add transcript to content
        if (hasTranscript && transcriptText) {
          contentParts.push(`\nTranscript:\n${transcriptText}`);
          server.log.info({ videoId, extractionMethod, transcriptLength: transcriptText.length }, 
            'Video content extracted successfully');
        }

        const extractedText = contentParts.join('\n');

        // Create file record for YouTube link
        const uploadedFile = await prisma.uploadedFile.create({
          data: {
            userId,
            folderId: folderId || null,
            fileName: `youtube_${videoId}.url`,
            originalName: videoTitle,
            fileType: 'video/youtube',
            fileSize: 0,
            filePath: url,
            status: 'COMPLETED',
            extractedText: extractedText,
          },
        });

        // Track activity
        await trackStudyActivity(userId, 'FILE_UPLOAD', uploadedFile.id);

        // Record AI usage for YouTube transcription (uses Gemini tokens)
        if (hasTranscript) {
          await recordAIUsage(userId, 'SUMMARY_VIEW', {
            fileId: uploadedFile.id,
            tokensUsed: Math.ceil(transcriptText.length / 4), // Approximate token count
          });
        }

        return reply.code(201).send({ file: uploadedFile });
      } catch (error: any) {
        server.log.error({ error }, 'YouTube upload error');
        return reply.code(500).send({ error: 'Failed to add YouTube link' });
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
      const { regenerate } = (request.body as { regenerate?: boolean }) || {};
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

      // Return existing summary if available and not regenerating
      const existingSummary = file.summaries?.[0];
      if (existingSummary && !regenerate) {
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

        // Track study activity
        await trackStudyActivity(request.user!.userId, 'SUMMARY_VIEW', file.id);

        // Track language usage for multilingual achievement
        await trackLanguageUsage(request.user!.userId, language);

        // Track achievement for summary generation
        const { checkAchievements } = await import('../services/gamification.service');
        const achievementResult = await checkAchievements(
          request.user!.userId,
          'summary_created',
          1
        );
        const notifications: any[] = [];

        if (achievementResult.tierUnlocked) {
          notifications.push({
            type: 'achievement',
            ...achievementResult,
          });
        }

        return reply.send({
          summary,
          ...(notifications.length > 0 && { notifications }),
        });
      } catch (error: any) {
        server.log.error(
          {
            error: error.message,
            stack: error.stack,
            fileId: id,
            language,
          },
          'Failed to generate summary'
        );

        // Return more specific error message
        const errorMessage =
          error.message?.includes('API key') || error.message?.includes('invalid')
            ? 'AI service is not configured properly. Please contact support.'
            : 'Failed to generate summary. Please try again.';

        return reply.code(500).send({ error: errorMessage, details: error.message });
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
      const { regenerate } = (request.body as { regenerate?: boolean }) || {};
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

      // Return existing notes if available and not regenerating
      const existingNotes = file.notes?.[0];
      if (existingNotes && !regenerate) {
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

        // Track study activity
        await trackStudyActivity(request.user!.userId, 'NOTES_VIEW', file.id);

        // Track language usage for multilingual achievement
        await trackLanguageUsage(request.user!.userId, language);

        // Track achievement for notes generation
        const { checkAchievements } = await import('../services/gamification.service');
        const achievementResult = await checkAchievements(request.user!.userId, 'notes_created', 1);
        const notifications: any[] = [];

        if (achievementResult.tierUnlocked) {
          notifications.push({
            type: 'achievement',
            ...achievementResult,
          });
        }

        return reply.send({
          notes,
          ...(notifications.length > 0 && { notifications }),
        });
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
      const { numQuestions = 1, difficulty = 'MEDIUM' } = request.body as {
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
      if (numQuestions < 1 || numQuestions > 20) {
        return reply.code(400).send({ error: 'Number of questions must be between 1 and 20' });
      }

      if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
        return reply.code(400).send({ error: 'Invalid difficulty level' });
      }

      const language = await resolveUserLanguage(request.user!.userId);

      // Generate quiz
      try {
        const generated = await aiService.generateQuiz(
          file.extractedText,
          numQuestions,
          difficulty,
          language
        );

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

        // Track study activity
        await trackStudyActivity(request.user!.userId, 'QUIZ_ATTEMPT', file.id);

        // Track language usage for multilingual achievement
        await trackLanguageUsage(request.user!.userId, language);

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
        const generated = await aiService.generateFlashcards(
          file.extractedText,
          numCards,
          language
        );

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

        // Track study activity
        await trackStudyActivity(request.user!.userId, 'FLASHCARD_STUDY', file.id);

        // Track language usage for multilingual achievement
        await trackLanguageUsage(request.user!.userId, language);

        // Track achievement for flashcard generation/completion
        const { checkAchievements } = await import('../services/gamification.service');
        const achievementResult = await checkAchievements(
          request.user!.userId,
          'flashcard_completed',
          1
        );
        const notifications: any[] = [];

        if (achievementResult.tierUnlocked) {
          notifications.push({
            type: 'achievement',
            ...achievementResult,
          });
        }

        return reply.send({
          flashcardSet,
          ...(notifications.length > 0 && { notifications }),
        });
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
      const { answers, timeSpentSeconds, questionTimings } = request.body as {
        answers: Record<string, string>;
        timeSpentSeconds?: number;
        questionTimings?: Record<string, number>;
      };

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

      // Anti-cheat: Check if time spent is suspiciously low
      if (timeSpentSeconds !== undefined && timeSpentSeconds < quiz.questions.length * 2) {
        server.log.warn(
          {
            userId: request.user!.userId,
            quizId: id,
            timeSpent: timeSpentSeconds,
            questions: quiz.questions.length,
          },
          'Suspicious quiz submission - time too low'
        );
        return reply.code(400).send({
          error: 'Quiz submission too fast. Please take time to read each question carefully.',
        });
      }

      // Anti-cheat: Check for recent duplicate submissions (within last 10 seconds)
      const recentAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quiz.id,
          userId: request.user!.userId,
          createdAt: {
            gte: new Date(Date.now() - 10000), // Last 10 seconds
          },
        },
      });

      if (recentAttempt) {
        server.log.warn(
          {
            userId: request.user!.userId,
            quizId: id,
          },
          'Duplicate quiz submission attempt'
        );
        return reply.code(429).send({
          error: 'Please wait before submitting another attempt.',
        });
      }

      // Calculate score server-side
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

      const scorePercentage = Math.round((correctCount / quiz.questions.length) * 100);
      const isPerfectScore = scorePercentage === 100;
      // Normalize difficulty to uppercase for case-insensitive comparison
      const isHardDifficulty = quiz.difficulty?.toUpperCase() === 'HARD';

      server.log.info(
        {
          quizId: quiz.id,
          difficulty: quiz.difficulty,
          difficultyUpperCase: quiz.difficulty?.toUpperCase(),
          isHardDifficulty,
          scorePercentage,
          isPerfectScore,
          correctCount,
          totalQuestions: quiz.questions.length,
        },
        'Quiz submission details'
      );

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

      // Track achievements and award XP
      const unlockedAchievements: any[] = [];

      try {
        // Import gamification service dynamically
        const { checkAchievements } = await import('../services/gamification.service');

        // 1. Quiz Whiz achievement (for perfect scores)
        if (isPerfectScore) {
          const quizWhizResult = await checkAchievements(request.user!.userId, 'quiz_perfect', 1);
          if (quizWhizResult.tierUnlocked) {
            unlockedAchievements.push(quizWhizResult);
          }
        }

        // 2. Perfectionist achievement (hard difficulty + perfect score)
        if (isHardDifficulty && isPerfectScore) {
          server.log.info(
            {
              userId: request.user!.userId,
              attemptingPerfectionist: true,
              difficulty: quiz.difficulty,
              score: scorePercentage,
            },
            'Checking Perfectionist achievement'
          );

          const perfectionistResult = await checkAchievements(
            request.user!.userId,
            'hard_quiz_perfect',
            1
          );

          server.log.info(
            {
              userId: request.user!.userId,
              perfectionistResult,
              tierUnlocked: perfectionistResult.tierUnlocked,
              newTier: perfectionistResult.newTier,
            },
            'Perfectionist achievement check completed'
          );

          if (perfectionistResult.tierUnlocked) {
            unlockedAchievements.push(perfectionistResult);
          }
        }

        // 3. Speed Demon achievement (fast answers per question)
        // Award points based on individual question speed
        if (questionTimings && Object.keys(questionTimings).length > 0) {
          let pointsToAward = 0;

          // Evaluate each question individually
          Object.entries(questionTimings).forEach(([questionId, timeInSeconds]) => {
            // Award 1 point if answered in under 5 seconds
            if (timeInSeconds < 5) {
              pointsToAward += 1;
            }
            // Award 0.5 points if answered in 5-10 seconds with correct answer
            else if (timeInSeconds < 10) {
              const wasCorrect = results[questionId]?.correct;
              if (wasCorrect) {
                pointsToAward += 0.5;
              }
            }
          });

          // Round down to whole number
          pointsToAward = Math.floor(pointsToAward);

          if (pointsToAward > 0) {
            const speedDemonResult = await checkAchievements(
              request.user!.userId,
              'quick_answer',
              pointsToAward
            );
            if (speedDemonResult.tierUnlocked) {
              unlockedAchievements.push(speedDemonResult);
            }
          }
        }

        // 4. Scholar achievement (add study time in hours)
        if (timeSpentSeconds) {
          const hoursSpent = timeSpentSeconds / 3600;
          if (hoursSpent > 0.01) {
            // Only count if > ~36 seconds
            const scholarResult = await checkAchievements(
              request.user!.userId,
              'study_hours',
              hoursSpent
            );
            if (scholarResult.tierUnlocked) {
              unlockedAchievements.push(scholarResult);
            }
          }
        }
      } catch (error) {
        server.log.error({ error }, 'Failed to check achievements for quiz submission');
      }

      // Track study activity
      await trackStudyActivity(request.user!.userId, 'QUIZ_ATTEMPT', file.id);

      // Map achievements to notifications format for frontend interceptor
      const notifications = unlockedAchievements.map((ach) => ({
        type: 'achievement' as const,
        achievementId: ach.achievementId,
        achievementName: ach.achievementName || 'Achievement Unlocked',
        newTier: ach.newTier || 'COPPER',
        xpAwarded: ach.xpAwarded || 0,
        leveledUp: ach.leveledUp || false,
        newLevel: ach.newLevel,
      }));

      return reply.send({
        attempt,
        results,
        score: correctCount,
        total: quiz.questions.length,
        percentage: scorePercentage,
        notifications,
        xpGained: unlockedAchievements.reduce((sum, ach) => sum + (ach.xpAwarded || 0), 0),
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
        return reply
          .code(400)
          .send({ error: 'Cannot delete folder with subfolders. Delete subfolders first.' });
      }

      if (folder.files.length > 0) {
        return reply
          .code(400)
          .send({ error: 'Cannot delete folder with files. Move or delete files first.' });
      }

      await prisma.folder.delete({
        where: { id },
      });

      return reply.send({ message: 'Folder deleted successfully' });
    }
  );
}
