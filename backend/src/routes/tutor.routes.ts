/**
 * AI Tutor Routes
 * Manages tutor chat sessions, messages, and AI-powered tutoring with source references.
 */

import { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate, AuthenticatedRequest, requireMinRole } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { TutorService } from '../services/tutor.service';
import prisma from '../db/client';
import { resolveUserLanguage } from '../utils/language.utils';

const tutorService = new TutorService();

/**
 * Register AI tutor routes with the Fastify server
 * @param server - Fastify instance
 */
export default async function tutorRoutes(server: FastifyInstance) {
  // Get all tutor sessions for the user
  server.get(
    '/sessions',
    {
      preHandler: [authenticate, requireMinRole('PREMIUM')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const sessions = await prisma.tutorSession.findMany({
        where: { userId: request.user!.userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          files: {
            include: {
              file: {
                select: { id: true, originalName: true },
              },
            },
          },
        },
      });

      return reply.send(sessions);
    }
  );

  // Get a single session with all messages
  server.get(
    '/sessions/:id',
    {
      preHandler: [authenticate, requireMinRole('PREMIUM')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const session = await prisma.tutorSession.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          files: {
            include: {
              file: {
                select: { id: true, originalName: true },
              },
            },
          },
        },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      return reply.send(session);
    }
  );

  // Create a new tutor session
  server.post(
    '/sessions',
    {
      preHandler: [authenticate, requireMinRole('PREMIUM')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { title, fileIds } = request.body as { title?: string; fileIds?: string[] };

      // Verify files belong to user
      if (fileIds && fileIds.length > 0) {
        const files = await prisma.uploadedFile.findMany({
          where: {
            id: { in: fileIds },
            userId: request.user!.userId,
          },
        });

        if (files.length !== fileIds.length) {
          return reply.code(400).send({ error: 'One or more files not found' });
        }
      }

      const session = await prisma.tutorSession.create({
        data: {
          userId: request.user!.userId,
          title: title || 'New Chat',
          files: fileIds
            ? {
                create: fileIds.map((fileId) => ({
                  fileId,
                })),
              }
            : undefined,
        },
        include: {
          messages: true,
          files: {
            include: {
              file: {
                select: { id: true, originalName: true },
              },
            },
          },
        },
      });

      return reply.code(201).send(session);
    }
  );

  // Update session (title, add/remove files)
  server.patch(
    '/sessions/:id',
    {
      preHandler: [authenticate, requireMinRole('PREMIUM')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { title, addFileIds, removeFileIds } = request.body as {
        title?: string;
        addFileIds?: string[];
        removeFileIds?: string[];
      };

      const session = await prisma.tutorSession.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      // Handle file additions
      if (addFileIds && addFileIds.length > 0) {
        const files = await prisma.uploadedFile.findMany({
          where: {
            id: { in: addFileIds },
            userId: request.user!.userId,
          },
        });

        if (files.length !== addFileIds.length) {
          return reply.code(400).send({ error: 'One or more files not found' });
        }

        await prisma.tutorSessionFile.createMany({
          data: addFileIds.map((fileId) => ({
            sessionId: id,
            fileId,
          })),
          skipDuplicates: true,
        });
      }

      // Handle file removals
      if (removeFileIds && removeFileIds.length > 0) {
        await prisma.tutorSessionFile.deleteMany({
          where: {
            sessionId: id,
            fileId: { in: removeFileIds },
          },
        });
      }

      // Update title if provided
      const updatedSession = await prisma.tutorSession.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          files: {
            include: {
              file: {
                select: { id: true, originalName: true },
              },
            },
          },
        },
      });

      return reply.send(updatedSession);
    }
  );

  // Delete a session
  server.delete(
    '/sessions/:id',
    {
      preHandler: [authenticate, requireMinRole('PREMIUM')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const session = await prisma.tutorSession.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      await prisma.tutorSession.delete({
        where: { id },
      });

      return reply.send({ message: 'Session deleted' });
    }
  );

  // Send a message (streaming response)
  server.post(
    '/sessions/:id/messages',
    {
      preHandler: [authenticate, requireMinRole('PREMIUM'), checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const { message } = request.body as { message: string };

      if (!message || message.trim().length === 0) {
        return reply.code(400).send({ error: 'Message is required' });
      }

      const startTime = Date.now();

      // Get session with files
      const session = await prisma.tutorSession.findFirst({
        where: {
          id,
          userId: request.user!.userId,
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
          files: {
            include: {
              file: {
                select: { id: true, originalName: true, extractedText: true },
              },
            },
          },
        },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      // Check if user has premium access
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
      });

      if (!user || (user.role !== 'PREMIUM' && user.role !== 'ADMIN')) {
        return reply.code(403).send({ error: 'AI Tutor requires Premium subscription' });
      }

      // Save user message
      await prisma.tutorMessage.create({
        data: {
          sessionId: id,
          role: 'user',
          content: message.trim(),
        },
      });

      // Record study session for progress tracking
      await prisma.studySession
        .create({
          data: {
            userId: request.user!.userId,
            activityType: 'TUTOR_CHAT',
            durationMinutes: 1, // Will be updated on session end
          },
        })
        .catch(() => {
          // Ignore if StudySession model doesn't exist yet
        });

      // Get user's language preference
      const language = await resolveUserLanguage(request.user!.userId);

      // Build messages for AI
      const aiMessages = [
        ...session.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: message.trim() },
      ];

      // Get files for context
      const files = session.files.map((f) => ({
        id: f.file.id,
        originalName: f.file.originalName,
        extractedText: f.file.extractedText,
      }));

      // Set up streaming response with CORS headers
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:5175',
        'Access-Control-Allow-Credentials': 'true',
      });

      let fullResponse = '';

      try {
        // Find relevant sources from user's question
        const sources = tutorService.findRelevantSources(message, files);

        // Stream the response
        for await (const chunk of tutorService.streamChat(aiMessages, files, language)) {
          fullResponse += chunk;
          reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }

        // Save assistant message
        await prisma.tutorMessage.create({
          data: {
            sessionId: id,
            role: 'assistant',
            content: fullResponse,
          },
        });

        // Update session timestamp
        await prisma.tutorSession.update({
          where: { id },
          data: { updatedAt: new Date() },
        });

        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(request.user!.userId, 'TUTOR_CHAT', {
          sessionId: id,
          durationMs,
        });

        // Send sources as a separate event before DONE
        if (sources.length > 0) {
          reply.raw.write(`data: ${JSON.stringify({ sources })}\n\n`);
        }

        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to generate response';
        server.log.error({ error: errorMessage, stack: error.stack }, 'Tutor streaming error');

        // Send error to client in SSE format
        reply.raw.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();
      }
    }
  );
}
