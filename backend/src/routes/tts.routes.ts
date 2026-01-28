import { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate, AuthenticatedRequest, isPro } from '../middleware/auth.middleware';
import { checkAIRateLimit } from '../middleware/ai-rate-limit.middleware';
import { ttsRateLimit } from '../middleware/tts-rate-limit.middleware';
import { canUseTTS } from '../lib/tier-limits';
import OpenAI from 'openai';
import { createHash, randomBytes } from 'crypto';
// NodeCache imported for potential future in-memory caching
import prisma from '../db/client';
import { logger } from '../lib/logger';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Supported voices
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
type Voice = (typeof VOICES)[number];

// Supported speeds
const MIN_SPEED = 0.25;
const MAX_SPEED = 4.0;

// Temporary token store for streaming (Token -> { text, voice, speed, userId, userRole })
// Expires after 1 minute
interface StreamRequest {
  text: string;
  voice: Voice;
  speed: number;
  userId: string;
  userRole: string;
  expiresAt: number;
}
const streamTokens = new Map<string, StreamRequest>();

// Periodic cleanup of expired tokens
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of streamTokens.entries()) {
    if (data.expiresAt < now) {
      streamTokens.delete(token);
    }
  }
}, 60000);

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

// Get voice description
function getVoiceDescription(voice: Voice): string {
  const descriptions: Record<Voice, string> = {
    alloy: 'Neutral and balanced voice',
    echo: 'Clear and versatile voice',
    fable: 'Warm and expressive voice',
    onyx: 'Deep and authoritative voice',
    nova: 'Bright and energetic voice',
    shimmer: 'Soft and soothing voice',
  };
  return descriptions[voice] || 'Default voice';
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
   * GET /api/tts/preferences - Get user's saved TTS preferences
   */
  server.get(
    '/tts/preferences',
    { preHandler: [authenticate] },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;

      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            ttsVoice: true,
            ttsSpeed: true,
          },
        });

        if (!user) {
          return reply.status(404).send({ error: 'User not found' });
        }

        return reply.send({
          voice: user.ttsVoice,
          speed: user.ttsSpeed,
        });
      } catch (error: any) {
        logger.error({ error, userId }, 'Failed to fetch TTS preferences');
        return reply.status(500).send({ error: 'Failed to fetch preferences' });
      }
    }
  );

  /**
   * PATCH /api/tts/preferences - Update user's TTS preferences
   */
  server.patch(
    '/tts/preferences',
    { preHandler: [authenticate] },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const body = request.body as TTSPreferencesBody;

      try {
        const updateData: any = {};

        if (body.voice !== undefined) {
          if (!VOICES.includes(body.voice)) {
            return reply.status(400).send({
              error: 'Invalid voice',
              validVoices: VOICES,
            });
          }
          updateData.ttsVoice = body.voice;
        }

        if (body.speed !== undefined) {
          if (body.speed < MIN_SPEED || body.speed > MAX_SPEED) {
            return reply.status(400).send({
              error: 'Invalid speed',
              minSpeed: MIN_SPEED,
              maxSpeed: MAX_SPEED,
            });
          }
          updateData.ttsSpeed = body.speed;
        }

        if (Object.keys(updateData).length === 0) {
          return reply.status(400).send({ error: 'No valid updates provided' });
        }

        const user = await prisma.user.update({
          where: { id: userId },
          data: updateData,
          select: {
            ttsVoice: true,
            ttsSpeed: true,
          },
        });

        logger.info({ userId, updates: updateData }, 'Updated TTS preferences');

        return reply.send({
          voice: user.ttsVoice,
          speed: user.ttsSpeed,
        });
      } catch (error: any) {
        logger.error({ error, userId }, 'Failed to update TTS preferences');
        return reply.status(500).send({ error: 'Failed to update preferences' });
      }
    }
  );

  /**
   * GET /api/tts/voices - Get list of available TTS voices
   */
  server.get('/tts/voices', async (_request, reply: FastifyReply) => {
    return reply.send({
      voices: VOICES.map((voice) => ({
        id: voice,
        name: voice.charAt(0).toUpperCase() + voice.slice(1),
        description: getVoiceDescription(voice),
      })),
    });
  });

  /**
   * POST /api/tts/negotiate - Prepare for streaming
   * Validates request and returns a one-time token for the stream endpoint
   */
  server.post(
    '/tts/negotiate',
    {
      preHandler: [authenticate, ttsRateLimit, checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const body = request.body as TTSRequestBody;

      if (!body.text || typeof body.text !== 'string') {
        return reply.status(400).send({ error: 'Text is required' });
      }

      // Check limits early
      const ttsCheck = await canUseTTS(userId, userRole, body.text.length);
      if (!ttsCheck.allowed) {
        return reply.status(403).send({ error: ttsCheck.reason, upgradeRequired: true });
      }

      // Resolve voice/speed defaults
      let voice = body.voice as Voice | undefined;
      let speed = body.speed;

      if (!voice || speed === undefined) {
          const user = await prisma.user.findUnique({
             where: { id: userId },
             select: { ttsVoice: true, ttsSpeed: true }
          });
          if (user) {
             voice = voice || (user.ttsVoice as Voice);
             speed = speed !== undefined ? speed : user.ttsSpeed;
          }
      }
      voice = voice || 'alloy';
      speed = speed !== undefined ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed)) : 1.0;

      // Generate token
      const token = randomBytes(16).toString('hex');
      streamTokens.set(token, {
        text: body.text.slice(0, 4096),
        voice,
        speed,
        userId,
        userRole,
        expiresAt: Date.now() + 60000 // 1 minute to start stream
      });

      return reply.send({ token, url: `/api/tts/stream/${token}` });
    }
  );

  /**
   * GET /api/tts/stream/:token - Stream the audio
   * Uses the token to retrieve parameters and streams directly from OpenAI
   */
  server.get(
    '/tts/stream/:token',
    async (request: any, reply: FastifyReply) => {
      const { token } = request.params as { token: string };
      const data = streamTokens.get(token);

      if (!data) {
        return reply.status(404).send({ error: 'Invalid or expired stream token' });
      }

      // One-time use? strictly speaking yes, but for seeking sometimes browsers request multiple times if we supported range. 
      // For now, let's keep it but maybe expire it purely on time or remove after a short delay.
      // We won't delete immediately to allow potential browser retries or segmented loading.

      const { text, voice, speed, userId } = data;
      const model = 'tts-1'; // Force fast model

      // 1. Check disk cache first
      const cacheHash = generateContentHash(text, voice, speed);
      const cachePath = getCacheFilePath(cacheHash);
      
      try {
        await fs.access(cachePath);
        // Serve from disk if exists
        const stat = await fs.stat(cachePath);
        
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Length', stat.size);
        reply.header('X-TTS-Cached', 'true');
        
        const fileStream = createReadStream(cachePath);
        return reply.send(fileStream); 
      } catch (e) {
        // Not in cache, stream from OpenAI
      }

      try {
        logger.info({ userId, textLength: text.length }, 'Starting TTS stream');
        
        const response = await openai.audio.speech.create({
          model,
          voice,
          input: text,
          speed,
          response_format: 'mp3',
        });

        if (!response.body) {
          throw new Error('No response body from OpenAI');
        }

        // Set headers for streaming
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('X-TTS-Quality', model);
        
        // Convert ReadableStream to Node Stream
        // @ts-ignore
        const nodeStream = Readable.fromWeb(response.body);
        
        return reply.send(nodeStream);

      } catch (error: any) {
        logger.error({ error: error.message, userId }, 'Stream generation failed');
        return reply.status(500).send({ error: 'Generation failed' });
      }
    }
  );

  /**
   * POST /api/tts - Legacy endpoint (kept for compatibility)
    '/tts',
    {
      preHandler: [authenticate, ttsRateLimit, checkAIRateLimit],
    },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const body = request.body as TTSRequestBody;

      // Validate text
      if (!body.text || typeof body.text !== 'string') {
        return reply.status(400).send({ error: 'Text is required' });
      }

      // Fetch user preferences if voice/speed not provided
      let voice = body.voice as Voice | undefined;
      let speed = body.speed;

      if (!voice || speed === undefined) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ttsVoice: true, ttsSpeed: true },
          });

          if (user) {
            voice = voice || (user.ttsVoice as Voice);
            speed = speed !== undefined ? speed : user.ttsSpeed;
          }
        } catch (error) {
          logger.warn({ error, userId }, 'Failed to fetch user preferences, using defaults');
        }
      }

      // Apply defaults if still not set
      voice = voice || 'alloy';
      speed = speed !== undefined ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed)) : 1.0;

      // Validate voice
      if (!VOICES.includes(voice)) {
        return reply.status(400).send({ 
          error: 'Invalid voice',
          validVoices: VOICES
        });
      }

      // Limit text length (OpenAI has a 4096 character limit per request)
      const text = body.text.slice(0, 4096);

      // Check tier-based limits
      const ttsCheck = await canUseTTS(userId, userRole, text.length);
      if (!ttsCheck.allowed) {
        logger.warn({ userId, userRole, textLength: text.length }, 'TTS tier limit exceeded');
        return reply.status(403).send({
          error: 'Usage limit exceeded',
          message: ttsCheck.reason,
          upgradeRequired: true,
        });
      }

      // Determine model quality based on user tier using reusable helper
      const isProUser = isPro(userRole);
      // Forced downgrade to tts-1 for speed per user request, even for Pro users
      const model = 'tts-1'; 

      // Check cache for common phrases (helps reduce API costs)
      const cacheHash = generateContentHash(text, voice, speed);
      const cachedAudio = await getCachedAudio(cacheHash);

      if (cachedAudio) {
        logger.info({ 
          hash: cacheHash, 
          userId, 
          model, 
          fromCache: true 
        }, 'Serving cached TTS audio');

        // Send cached audio with edge caching headers
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400, s-maxage=604800'); // 1 day browser, 7 days edge
        reply.header('X-TTS-Cached', 'true');
        reply.header('X-TTS-Quality', model);
        return reply.send(cachedAudio);
      }

      try {
        const startTime = Date.now();
        logger.info({ 
          textLength: text.length, 
          voice, 
          speed,
          model,
          isProUser,
          userId 
        }, 'Generating TTS audio with streaming');

        // Generate audio using OpenAI TTS with tier-based quality
        const response = await openai.audio.speech.create({
          model: model, // tts-1-hd for Pro, tts-1 for Free
          voice: voice,
          input: text,
          speed: speed,
          response_format: 'mp3',
        });

        // Stream response: convert to buffer (OpenAI SDK doesn't support true streaming yet)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const durationMs = Date.now() - startTime;

        // Cache audio for future requests (especially common phrases)
        // Only cache for common phrases (< 500 chars) to avoid filling disk
        if (text.length < 500) {
          await cacheAudio(cacheHash, buffer).catch((err) => {
            logger.warn({ error: err.message }, 'Failed to cache audio');
          });
        }

        // Record AI usage for rate limiting (only durationMs is supported in metadata)
        await recordAIUsage(userId, 'TTS_GENERATE', { durationMs });

        // Send response with edge caching headers for browser/CDN
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=3600, s-maxage=86400'); // 1 hour browser, 1 day edge
        reply.header('X-TTS-Cached', 'false');
        reply.header('X-TTS-Quality', model);
        reply.header('X-TTS-Duration-Ms', durationMs.toString());
        
        return reply.send(buffer);
      } catch (error: any) {
        logger.error({ 
          error: error.message, 
          userId, 
          model,
          textLength: text.length 
        }, 'TTS generation failed');
        
        return reply.status(500).send({ 
          error: 'Failed to generate audio',
          message: error.message 
        });
      }
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
        // Determine quality model for cache hit response header
        const userWithRole = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        const isProUser = isPro(userWithRole?.role || 'BASIC');
        
        logger.info({ hash, packId: id, pageNum }, 'Serving cached study pack page TTS');
        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400');
        reply.header('X-TTS-Cached', 'true');
        reply.header('X-TTS-Quality', isProUser ? 'tts-1-hd' : 'tts-1');
        return reply.send(cachedAudio);
      }

      try {
        // Determine model quality based on user tier using reusable helper
        const userWithRole = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true }
        });
        const isProUser = isPro(userWithRole?.role || 'BASIC');
        const model = isProUser ? 'tts-1-hd' : 'tts-1';

        logger.info(
          { packId: id, pageNum, textLength: textToRead.length, voice, speed, model, isProUser },
          'Generating study pack page TTS'
        );

        const response = await openai.audio.speech.create({
          model: model, // Tier-based quality selection
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
        reply.header('X-TTS-Quality', model);
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
