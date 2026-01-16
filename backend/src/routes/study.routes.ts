/**
 * Study Routes
 * Handles file uploads, AI-generated study materials (summaries, notes, quizzes, flashcards), and folders.
 */

import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { upload } from '../config/multer.config';
import { FileProcessorService } from '../services/file-processor.service';
import { AIService } from '../services/ai.service';
import prisma from '../db/client';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import OpenAI from 'openai';
import { YoutubeTranscript } from 'youtube-transcript';
import { normalizeFileForLanguage, resolveUserLanguage } from '../utils/language.utils';
import { canUploadFile, getUserUsageStats } from '../lib/tier-limits';

const execPromise = promisify(exec);

const fileProcessor = new FileProcessorService();
const aiService = new AIService();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Track user study activity and update streaks
 * @param userId - User ID
 * @param activityType - Type of study activity
 * @param fileId - Optional associated file ID
 */
async function trackStudyActivity(
  userId: string,
  activityType:
    | 'FILE_UPLOAD'
    | 'SUMMARY_VIEW'
    | 'NOTES_VIEW'
    | 'QUIZ_ATTEMPT'
    | 'FLASHCARD_STUDY'
    | 'TUTOR_CHAT',
  fileId?: string
) {
  try {
    await prisma.studySession.create({
      data: {
        userId,
        activityType,
        fileId,
        durationMinutes: 1,
      },
    });

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
          totalMinutes: 1,
        },
      });
    } else {
      const lastStudy = streak.lastStudyDate ? new Date(streak.lastStudyDate) : null;
      lastStudy?.setHours(0, 0, 0, 0);

      let newCurrentStreak = streak.currentStreak;
      let newTotalDays = streak.totalStudyDays;

      if (!lastStudy || lastStudy.getTime() !== today.getTime()) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastStudy && lastStudy.getTime() === yesterday.getTime()) {
          newCurrentStreak = streak.currentStreak + 1;
        } else if (!lastStudy || lastStudy.getTime() < yesterday.getTime()) {
          newCurrentStreak = 1;
        }
        newTotalDays = streak.totalStudyDays + 1;
      }

      await prisma.studyStreak.update({
        where: { userId },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
          lastStudyDate: today,
          totalStudyDays: newTotalDays,
          totalMinutes: streak.totalMinutes + 1,
        },
      });
    }
  } catch (error) {
    // Silently fail - don't break the main operation
    console.error('Failed to track study activity:', error);
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
            server.log.info(
              { file: file.originalname, mimetype: file.mimetype },
              'Skipping text extraction for unsupported type'
            );
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

        // Track study activity for file upload
        for (const file of uploadedFiles) {
          await trackStudyActivity(request.user!.userId, 'FILE_UPLOAD', file.id);
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
      preHandler: [authenticate],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { url, folderId } = request.body as { url: string; folderId?: string };
        const userId = request.user!.userId;

        // Validate YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}(&[\w=]*)?$/;
        if (!youtubeRegex.test(url)) {
          return reply.code(400).send({ error: 'Invalid YouTube URL' });
        }

        // Check user existence
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
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

        // Fetch video metadata using yt-dlp (more reliable than ytdl-core)
        let videoTitle = `YouTube Video ${videoId}`;
        let videoDescription = '';
        
        try {
          server.log.info({ videoId }, 'Fetching YouTube video metadata with yt-dlp...');
          
          // Use yt-dlp to extract metadata as JSON
          const { stdout } = await execPromise(
            `yt-dlp --dump-json --no-download "${url}"`,
            { timeout: 30000 }
          );
          
          const metadata = JSON.parse(stdout);
          videoTitle = metadata.title || videoTitle;
          videoDescription = metadata.description || '';
          
          server.log.info({ 
            videoId, 
            title: videoTitle,
            descLength: videoDescription.length 
          }, 'Video metadata fetched successfully');
        } catch (error: any) {
          server.log.warn({ 
            error: error.message,
            videoId 
          }, 'Failed to fetch video metadata with yt-dlp, trying oEmbed fallback');
          
          // Fallback to oEmbed API for title only
          try {
            const oembedResponse = await fetch(
              `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
            );
            if (oembedResponse.ok) {
              const oembedData = (await oembedResponse.json()) as { title?: string };
              videoTitle = oembedData.title || videoTitle;
            }
          } catch (oembedError) {
            server.log.warn({ error: oembedError, videoId }, 'oEmbed fallback also failed');
          }
        }

        // Build content with title and description as baseline
        let contentParts = [`Title: ${videoTitle}`];
        
        if (videoDescription && videoDescription.trim().length > 0) {
          // Limit description to first 2000 characters to avoid overly long text
          const truncatedDescription = videoDescription.length > 2000 
            ? videoDescription.substring(0, 2000) + '...' 
            : videoDescription;
          contentParts.push(`\nDescription:\n${truncatedDescription}`);
        }

        // Attempt to fetch transcript
        let hasTranscript = false;
        let transcriptText = '';
        
        try {
          server.log.info({ videoId }, 'Attempting to fetch YouTube captions...');
          const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
          transcriptText = transcriptItems.map((item: any) => item.text).join(' ');
          
          if (transcriptText && transcriptText.trim().length > 0) {
            hasTranscript = true;
            server.log.info({ videoId, length: transcriptText.length }, 'Captions fetched successfully');
          }
        } catch (error) {
          server.log.warn({ error, videoId }, 'No captions available, will try Whisper transcription');
        }

        // Fallback to Whisper transcription if no captions
        if (!hasTranscript) {
          try {
            server.log.info({ videoId }, 'Starting Whisper transcription fallback...');
            
            // Create temp directory if it doesn't exist
            const tempDir = path.join(process.cwd(), 'uploads', 'temp');
            await fs.mkdir(tempDir, { recursive: true });
            
            const tempAudioPath = path.join(tempDir, `${videoId}.mp3`);
            
            // Download audio using yt-dlp (more reliable than ytdl-core)
            server.log.info({ videoId, path: tempAudioPath }, 'Downloading audio with yt-dlp...');
            
            try {
              // yt-dlp command: extract audio, convert to mp3, limit file size
              const ytdlpCmd = `yt-dlp -f "bestaudio[filesize<25M]/worst" --extract-audio --audio-format mp3 --audio-quality 96K -o "${tempAudioPath}" "${url}"`;
              
              const { stdout, stderr } = await execPromise(ytdlpCmd, {
                timeout: 120000 // 2 minute timeout
              });
              
              server.log.info({ videoId, stdout, stderr }, 'yt-dlp download completed');
            } catch (downloadError: any) {
              server.log.error({ 
                error: downloadError.message,
                stderr: downloadError.stderr,
                stdout: downloadError.stdout,
                videoId 
              }, 'yt-dlp download failed');
              throw new Error(`Failed to download audio: ${downloadError.message}`);
            }

            // Check if file exists and get size
            const stats = await fs.stat(tempAudioPath);
            const fileSizeMB = stats.size / (1024 * 1024);
            server.log.info({ videoId, fileSizeMB: fileSizeMB.toFixed(2) }, 'Audio file size');

            if (fileSizeMB > 24) {
              server.log.warn({ videoId, fileSizeMB }, 'Audio file too large for Whisper (25MB limit)');
              throw new Error(`Audio file too large: ${fileSizeMB.toFixed(2)}MB (max 25MB)`);
            }

            if (fileSizeMB < 0.01) {
              server.log.warn({ videoId, fileSizeMB }, 'Audio file too small, likely failed');
              throw new Error('Audio download produced invalid file');
            }

            // Transcribe with Whisper
            server.log.info({ videoId }, 'Transcribing with Whisper...');
            const transcription = await openai.audio.transcriptions.create({
              file: fsSync.createReadStream(tempAudioPath),
              model: 'whisper-1',
              response_format: 'text'
            });

            transcriptText = transcription as string;
            hasTranscript = true;
            
            server.log.info({ 
              videoId, 
              transcriptLength: transcriptText.length 
            }, 'Whisper transcription completed successfully');

            // Clean up temp file
            try {
              await fs.unlink(tempAudioPath);
              server.log.info({ videoId }, 'Temp audio file deleted');
            } catch (cleanupError) {
              server.log.warn({ 
                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
                videoId 
              }, 'Failed to delete temp audio file');
            }

          } catch (whisperError) {
            const errorMessage = whisperError instanceof Error ? whisperError.message : String(whisperError);
            const errorStack = whisperError instanceof Error ? whisperError.stack : undefined;
            server.log.error({ 
              error: errorMessage,
              stack: errorStack,
              videoId 
            }, 'Whisper transcription failed');
            // Continue with metadata only
          }
        }

        // Add transcript or note if unavailable
        if (hasTranscript && transcriptText) {
          contentParts.push(`\nTranscript:\n${transcriptText}`);
        } else {
          contentParts.push('\n(Transcript unavailable. Summary based on video metadata.)');
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
