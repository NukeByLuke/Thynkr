import { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import OpenAI from 'openai';
import { createHash } from 'crypto';
// NodeCache imported for potential future in-memory caching
import prisma from '../db/client';
import { logger } from '../lib/logger';
import fs from 'fs/promises';
import path from 'path';

// Supported voices
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
type Voice = (typeof VOICES)[number];

// Supported speeds
const MIN_SPEED = 0.25;
const MAX_SPEED = 4.0;

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// TTS cache directory
const TTS_CACHE_DIR = path.join(process.cwd(), 'uploads', 'tts-cache');

// Ensure cache directory exists
async function ensureCacheDir() {
  try {
    await fs.mkdir(TTS_CACHE_DIR, { recursive: true });
  } catch (error) {
    logger.error({ error }, 'Failed to create TTS cache directory');
  }
}

// Generate content hash for caching
function generateContentHash(text: string, voice: Voice, speed: number): string {
  const content = `${text}:${voice}:${speed.toFixed(2)}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 32);
}

// Get cached audio file path
function getCacheFilePath(hash: string): string {
  return path.join(TTS_CACHE_DIR, `${hash}.mp3`);
}

// Check if cached audio exists
async function getCachedAudio(hash: string): Promise<Buffer | null> {
  const filePath = getCacheFilePath(hash);
  try {
    const buffer = await fs.readFile(filePath);
    return buffer;
  } catch {
    return null;
  }
}

// Save audio to cache
async function cacheAudio(hash: string, buffer: Buffer): Promise<void> {
  await ensureCacheDir();
  const filePath = getCacheFilePath(hash);
  await fs.writeFile(filePath, buffer);
}

interface TTSRequestBody {
  text: string;
  voice?: Voice;
  speed?: number;
}

interface TTSPreferencesBody {
  voice?: Voice;
  speed?: number;
}

export default async function ttsRoutes(server: FastifyInstance) {
  // Initialize cache directory
  await ensureCacheDir();

  /**
   * POST /api/tts - Generate TTS audio (streaming, no disk cache)
   * Returns audio as mp3 stream directly from OpenAI
   */
  server.post(
    '/tts',
    {
      preHandler: [authenticate, checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const body = request.body as TTSRequestBody;

      // Validate text
      if (!body.text || typeof body.text !== 'string') {
        return reply.status(400).send({ error: 'Text is required' });
      }

      // Validate voice
      if (!body.voice || !VOICES.includes(body.voice as Voice)) {
        return reply.status(400).send({ 
          error: 'Voice is required and must be one of: alloy, echo, fable, onyx, nova, shimmer' 
        });
      }

      // Limit text length (OpenAI has a 4096 character limit per request)
      const text = body.text.slice(0, 4096);
      const voice = body.voice as Voice;

      try {
        const startTime = Date.now();
        logger.info({ textLength: text.length, voice }, 'Generating TTS audio (streaming)');

        // Generate audio using OpenAI TTS
        const response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voice,
          input: text,
          response_format: 'mp3',
        });

        // Convert response to buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const durationMs = Date.now() - startTime;

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'TTS_GENERATE', { durationMs });

        // Send response - stream directly to client, no disk caching
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Disposition', 'inline');
        return reply.send(buffer);
      } catch (error: any) {
        logger.error({ error: error.message }, 'TTS generation failed');
        return reply.status(500).send({ error: 'Failed to generate audio' });
      }
    }
  );

  /**
   * GET /api/tts/voices - Get available voices
   */
  server.get(
    '/tts/voices',
    {
      preHandler: authenticate,
    },
    async (_request: AuthenticatedRequest, reply: FastifyReply) => {
      const voices = [
        { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
        { id: 'echo', name: 'Echo', description: 'Warm, conversational voice' },
        { id: 'fable', name: 'Fable', description: 'Expressive, narrative voice' },
        { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
        { id: 'nova', name: 'Nova', description: 'Friendly, energetic voice' },
        { id: 'shimmer', name: 'Shimmer', description: 'Clear, pleasant voice' },
      ];

      return reply.send({ voices });
    }
  );

  /**
   * GET /api/tts/preferences - Get user's TTS preferences
   */
  server.get(
    '/tts/preferences',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { ttsVoice: true, ttsSpeed: true },
      });

      return reply.send({
        voice: user?.ttsVoice || 'alloy',
        speed: user?.ttsSpeed || 1.0,
      });
    }
  );

  /**
   * PATCH /api/tts/preferences - Update user's TTS preferences
   */
  server.patch(
    '/tts/preferences',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const body = request.body as TTSPreferencesBody;

      const updateData: { ttsVoice?: string; ttsSpeed?: number } = {};

      if (body.voice && VOICES.includes(body.voice)) {
        updateData.ttsVoice = body.voice;
      }

      if (body.speed !== undefined) {
        updateData.ttsSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, body.speed));
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: { ttsVoice: true, ttsSpeed: true },
      });

      return reply.send({
        voice: user.ttsVoice || 'alloy',
        speed: user.ttsSpeed || 1.0,
      });
    }
  );

  /**
   * POST /api/tts/study-pack/:id/page/:pageNumber - Generate TTS for a study pack page
   * This is a convenience endpoint that fetches the page content and generates TTS
   */
  server.post(
    '/tts/study-pack/:id/page/:pageNumber',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const { id, pageNumber } = request.params as { id: string; pageNumber: string };
      const body = request.body as { voice?: Voice; speed?: number } | undefined;

      const pageNum = parseInt(pageNumber, 10);
      if (isNaN(pageNum) || pageNum < 0) {
        return reply.status(400).send({ error: 'Invalid page number' });
      }

      // Fetch study pack
      const studyPack = await prisma.studyPack.findUnique({
        where: { id },
        select: { ownerId: true, pages: true },
      });

      if (!studyPack) {
        return reply.status(404).send({ error: 'Study pack not found' });
      }

      if (studyPack.ownerId !== userId) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const pages = studyPack.pages as any[];
      if (pageNum >= pages.length) {
        return reply.status(404).send({ error: 'Page not found' });
      }

      const page = pages[pageNum];
      const textToRead = page.heading ? `${page.heading}. ${page.content}` : page.content;

      // Get user's preferred voice/speed or use provided values
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { ttsVoice: true, ttsSpeed: true },
      });

      const voice =
        body?.voice && VOICES.includes(body.voice)
          ? body.voice
          : (user?.ttsVoice as Voice) || 'alloy';

      const speed =
        body?.speed !== undefined
          ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, body.speed))
          : user?.ttsSpeed || 1.0;

      // Check cache
      const hash = generateContentHash(textToRead, voice, speed);
      const cachedAudio = await getCachedAudio(hash);

      if (cachedAudio) {
        logger.info({ hash, packId: id, pageNum }, 'Serving cached study pack page TTS');
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400');
        reply.header('X-TTS-Cached', 'true');
        return reply.send(cachedAudio);
      }

      try {
        logger.info(
          { packId: id, pageNum, textLength: textToRead.length, voice, speed },
          'Generating study pack page TTS'
        );

        const response = await openai.audio.speech.create({
          model: 'tts-1',
          voice: voice,
          input: textToRead.slice(0, 4096),
          speed: speed,
          response_format: 'mp3',
        });

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await cacheAudio(hash, buffer);

        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400');
        reply.header('X-TTS-Cached', 'false');
        return reply.send(buffer);
      } catch (error: any) {
        logger.error(
          { error: error.message, packId: id, pageNum },
          'Study pack page TTS generation failed'
        );
        return reply.status(500).send({ error: 'Failed to generate audio' });
      }
    }
  );
}
