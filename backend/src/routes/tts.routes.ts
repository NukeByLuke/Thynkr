import { FastifyInstance, FastifyReply } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { checkAIRateLimit, recordAIUsage } from '../middleware/ai-rate-limit.middleware';
import { ttsRateLimit } from '../middleware/tts-rate-limit.middleware';
import { canUseTTS } from '../lib/tier-limits';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { createHash, randomBytes } from 'crypto';
import prisma from '../db/client';
import { logger } from '../lib/logger';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';

// Supported voices (frontend IDs kept stable, mapped to Gemini voices on the backend)
const VOICES = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'] as const;
type Voice = (typeof VOICES)[number];

// Map frontend voice IDs to Google Cloud TTS Neural2 voices
// Neural2 provides "Amazing" quality and human-like intonation (Paid tier, reliable)
const VOICE_MAP: Record<Voice, string> = {
  alloy: 'en-US-Neural2-D',    // Male, trustworthy
  echo: 'en-US-Neural2-J',     // Male, firm
  fable: 'en-GB-Neural2-B',    // Male, British accent (Breezy/Story)
  onyx: 'en-US-Neural2-A',     // Male, deep/authoritative
  nova: 'en-US-Neural2-F',     // Female, energetic
  shimmer: 'en-US-Neural2-H',  // Female, upbeat
};

// Supported speeds (handled client-side via playbackRate, kept for API compat)
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

// Google Cloud TTS client (uses service account credentials)
// Pass credentials via GOOGLE_TTS_CREDENTIALS env var (JSON string) or GOOGLE_APPLICATION_CREDENTIALS file path
let ttsClient: TextToSpeechClient;

function getTTSClient(): TextToSpeechClient {
  if (!ttsClient) {
    const credsJson = process.env.GOOGLE_TTS_CREDENTIALS;
    if (credsJson) {
      try {
        const credentials = JSON.parse(credsJson);
        ttsClient = new TextToSpeechClient({ credentials });
        logger.info('Google Cloud TTS client initialized with GOOGLE_TTS_CREDENTIALS');
      } catch (e: any) {
        logger.error({ error: e.message }, 'Failed to parse GOOGLE_TTS_CREDENTIALS JSON');
        throw new Error('Invalid GOOGLE_TTS_CREDENTIALS JSON');
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      ttsClient = new TextToSpeechClient();
      logger.info('Google Cloud TTS client initialized with GOOGLE_APPLICATION_CREDENTIALS file');
    } else {
      throw new Error('No Google Cloud TTS credentials configured. Set GOOGLE_TTS_CREDENTIALS or GOOGLE_APPLICATION_CREDENTIALS.');
    }
  }
  return ttsClient;
}

// Timeout for TTS API calls (20 seconds - fast API)
const TTS_TIMEOUT_MS = 20000;

/**
 * Wrap a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`TIMEOUT: ${operation} took longer than ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Chunk size target for streaming
// First chunk is smaller (~200 chars) for near-instant playback
// Subsequent chunks are larger (~2000 chars) for efficiency
const FIRST_CHUNK_TARGET_SIZE = 200;
const CHUNK_TARGET_SIZE = 2000;
// Minimum chunk size to avoid very short audio clips
const CHUNK_MIN_SIZE = 150;

/**
 * Split text into speakable chunks at sentence boundaries
 * First chunk is smaller for faster time-to-first-byte
 */
function splitTextIntoChunks(text: string): string[] {
  // For short texts, return as-is
  if (text.length <= FIRST_CHUNK_TARGET_SIZE) {
    return [text.trim()];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  let isFirstChunk = true;

  // Split by sentences (period, exclamation, question mark followed by space or end)
  const sentences = text.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Use smaller target for first chunk (near-instant playback)
    const targetSize = isFirstChunk ? FIRST_CHUNK_TARGET_SIZE : CHUNK_TARGET_SIZE;
    const minSize = isFirstChunk ? 100 : CHUNK_MIN_SIZE;

    // If adding this sentence would exceed target and we already have content
    if (currentChunk.length > 0 && currentChunk.length + trimmed.length > targetSize) {
      // Only push if chunk meets minimum size
      if (currentChunk.length >= minSize) {
        chunks.push(currentChunk.trim());
        currentChunk = trimmed;
        isFirstChunk = false;
      } else {
        // Chunk is too small, keep adding
        currentChunk += ' ' + trimmed;
      }
    } else {
      // Add to current chunk
      currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.trim()];
}

/**
 * Convert raw PCM audio (16-bit, 24kHz, mono) to a WAV buffer
 */
function pcmToWav(pcmData: Buffer): Buffer {
  const numChannels = 1;
  const sampleRate = 24000;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmData.length;
  const headerSize = 44;

  const header = Buffer.alloc(headerSize);
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(dataSize + headerSize - 8, 4);
  header.write('WAVE', 8);
  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // PCM sub-chunk size
  header.writeUInt16LE(1, 20);  // PCM format
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Shared helper to call Google Cloud TTS via the official client library
 * Uses service account credentials (handles OAuth2 automatically)
 */
async function callGoogleTTS(text: string, voiceName: string): Promise<Buffer> {
  const client = getTTSClient();

  // Extract language code from voice name (e.g. "en-US" from "en-US-Neural2-D")
  const languageCode = voiceName.split('-').slice(0, 2).join('-');

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'LINEAR16' as const,
      sampleRateHertz: 24000,
    },
  });

  if (!response.audioContent) {
    throw new Error('No audio content received from Google Cloud TTS');
  }

  // audioContent can be Uint8Array or string (base64)
  if (typeof response.audioContent === 'string') {
    return Buffer.from(response.audioContent, 'base64');
  }
  return Buffer.from(response.audioContent);
}

/**
 * Generate WAV audio using Google Cloud TTS
 */
async function generateGoogleTTS(text: string, voice: Voice, retries = 2): Promise<Buffer> {
  const googleVoice = VOICE_MAP[voice];
  logger.info({ voice, googleVoice, textLength: text.length }, 'Starting Google TTS generation');

  try {
    const startTime = Date.now();
    
    // Call API with timeout
    const pcmBuffer = await withTimeout(
      callGoogleTTS(text, googleVoice),
      TTS_TIMEOUT_MS,
      `TTS generation for ${googleVoice}`
    );
     
    const elapsed = Date.now() - startTime;
    logger.info({ voice, googleVoice, elapsed }, 'TTS generation completed');

    return pcmToWav(pcmBuffer);
  } catch (error: any) {
    logger.error({ voice, googleVoice, error: error.message }, 'TTS generation failed');
    
    // Simple retry logic
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return generateGoogleTTS(text, voice, retries - 1);
    }
    throw error;
  }
}

/**
 * Generate raw PCM audio using Google Cloud TTS (for chunked streaming)
 */
async function generateGooglePCM(text: string, voice: Voice, retries = 2): Promise<Buffer> {
  const googleVoice = VOICE_MAP[voice];

  try {
    return await withTimeout(
      callGoogleTTS(text, googleVoice),
      TTS_TIMEOUT_MS,
      `TTS PCM generation for ${googleVoice}`
    );
  } catch (error: any) {
    logger.error({ voice, googleVoice, error: error.message }, 'TTS PCM generation failed');
    
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return generateGooglePCM(text, voice, retries - 1);
    }
    throw error;
  }
}

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

// Generate content hash for caching (voice-only, speed is handled client-side)
function generateContentHash(text: string, voice: Voice): string {
  const content = `google:${text}:${voice}`;
  return createHash('sha256').update(content).digest('hex').substring(0, 32);
}

// Get cached audio file path
function getCacheFilePath(hash: string): string {
  return path.join(TTS_CACHE_DIR, `${hash}.wav`);
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
   * All 6 voices map to distinct Gemini TTS voices
   */
  server.get('/tts/voices', async (_request, reply: FastifyReply) => {
    const availableVoices = [
      { id: 'alloy', name: 'Alloy', description: 'Informative — Clear and neutral' },
      { id: 'echo', name: 'Echo', description: 'Firm — Professional and authoritative' },
      { id: 'fable', name: 'Fable', description: 'Breezy — Light and casual' },
      { id: 'onyx', name: 'Onyx', description: 'Deep — Strong and commanding' },
      { id: 'nova', name: 'Nova', description: 'Energetic — Lively and expressive' },
      { id: 'shimmer', name: 'Shimmer', description: 'Upbeat — Cheerful and bright' },
    ];
    return reply.send({ voices: availableVoices });
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
   * GET /api/tts/stream/:token - Stream the audio with chunked generation
   * Uses the token to retrieve parameters and generates audio in chunks for faster start
   */
  server.get(
    '/tts/stream/:token',
    async (request: any, reply: FastifyReply) => {
      const { token } = request.params as { token: string };
      const data = streamTokens.get(token);

      if (!data) {
        return reply.status(404).send({ error: 'Invalid or expired stream token' });
      }

      // Mark token as used but keep it for 30s to handle browser retries
      // After 30s the periodic cleanup will remove it
      data.expiresAt = Date.now() + 30000;

      const { text, voice, userId } = data;

      // 1. Check disk cache first (for the full text)
      const cacheHash = generateContentHash(text, voice);
      const cachePath = getCacheFilePath(cacheHash);
      
      try {
        await fs.access(cachePath);
        // Serve from disk if exists
        const stat = await fs.stat(cachePath);
        
        reply.header('Content-Type', 'audio/wav');
        reply.header('Content-Length', stat.size);
        reply.header('Cache-Control', 'private, max-age=3600');
        reply.header('X-TTS-Cached', 'true');
        reply.header('X-TTS-Provider', 'google-cloud');
        
        const fileStream = createReadStream(cachePath);
        return reply.send(fileStream); 
      } catch (e) {
        // Not in cache, generate with Gemini TTS
      }

      // 2. For short texts, generate all at once (faster than chunking overhead)
      if (text.length <= FIRST_CHUNK_TARGET_SIZE * 2) {
        try {
          logger.info({ userId, textLength: text.length, voice }, 'Generating short TTS audio');
          
          const buffer = await generateGoogleTTS(text, voice);

          // Cache in background
          cacheAudio(cacheHash, buffer).catch((err) => {
            logger.warn({ error: err.message, hash: cacheHash }, 'Failed to cache TTS audio');
          });

          reply.header('Content-Type', 'audio/wav');
          reply.header('Content-Length', buffer.length);
          reply.header('X-TTS-Provider', 'google-cloud');
          reply.header('X-TTS-Cached', 'false');
          return reply.send(buffer);
        } catch (error: any) {
          logger.error({ error: error.message, userId }, 'Short TTS generation failed');
          return reply.status(500).send({ error: 'Generation failed' });
        }
      }

      // 3. For longer texts, use chunked generation
      const chunks = splitTextIntoChunks(text);
      logger.info({ userId, textLength: text.length, voice, chunkCount: chunks.length }, 'Starting chunked TTS generation');

      try {
        // Generate chunks - Google Cloud TTS has much higher rate limits than Gemini
        // We can process more chunks in parallel (e.g., 5-6 concurrent requests)
        const MAX_CONCURRENT = 5;
        const pcmBuffers: (Buffer | null)[] = new Array(chunks.length).fill(null);
        
        // Process chunks in batches of MAX_CONCURRENT
        for (let batchStart = 0; batchStart < chunks.length; batchStart += MAX_CONCURRENT) {
          const batchEnd = Math.min(batchStart + MAX_CONCURRENT, chunks.length);
          const batchPromises: Promise<void>[] = [];
          
          for (let i = batchStart; i < batchEnd; i++) {
            batchPromises.push(
              generateGooglePCM(chunks[i], voice).then(pcm => {
                pcmBuffers[i] = pcm;
              })
            );
          }
          
          // Wait for current batch to complete
          await Promise.all(batchPromises);
          
          // No delay needed for Cloud TTS usually
        }

        // Concatenate all PCM data and convert to WAV (filter out any nulls just in case)
        const validBuffers = pcmBuffers.filter((b): b is Buffer => b !== null);
        const combinedPcm = Buffer.concat(validBuffers);
        const wavBuffer = pcmToWav(combinedPcm);

        // Cache the complete audio in background
        cacheAudio(cacheHash, wavBuffer).then(() => {
          logger.info({ hash: cacheHash, userId, size: wavBuffer.length, chunks: chunks.length }, 'Chunked TTS audio cached');
        }).catch((err) => {
          logger.warn({ error: err.message, hash: cacheHash }, 'Failed to cache chunked TTS audio');
        });

        reply.header('Content-Type', 'audio/wav');
        reply.header('Content-Length', wavBuffer.length);
        reply.header('X-TTS-Provider', 'google-cloud');
        reply.header('X-TTS-Cached', 'false');
        reply.header('X-TTS-Chunks', chunks.length.toString());
        return reply.send(wavBuffer);

      } catch (error: any) {
        logger.error({ error: error.message, userId, chunkCount: chunks.length }, 'Chunked TTS generation failed');
        return reply.status(500).send({ 
          error: 'Generation failed', 
          details: error.message 
        });
      }
    }
  );

  /**
   * POST /api/tts - Legacy endpoint (kept for compatibility)
   */
  server.post(
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

      // Fetch user preferences if voice not provided
      let voice = body.voice as Voice | undefined;

      if (!voice) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { ttsVoice: true },
          });

          if (user) {
            voice = user.ttsVoice as Voice;
          }
        } catch (error) {
          logger.warn({ error, userId }, 'Failed to fetch user preferences, using defaults');
        }
      }

      // Apply defaults if still not set
      voice = voice || 'alloy';

      // Validate voice
      if (!VOICES.includes(voice)) {
        return reply.status(400).send({ 
          error: 'Invalid voice',
          validVoices: VOICES
        });
      }

      // Limit text length (Gemini TTS has a 32k token context window)
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

      // Check cache for common phrases (helps reduce API costs)
      const cacheHash = generateContentHash(text, voice);
      const cachedAudio = await getCachedAudio(cacheHash);

      if (cachedAudio) {
        logger.info({ 
          hash: cacheHash, 
          userId, 
          fromCache: true 
        }, 'Serving cached TTS audio');

        // Send cached audio with edge caching headers
        reply.header('Content-Type', 'audio/wav');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400, s-maxage=604800');
        reply.header('X-TTS-Cached', 'true');
        reply.header('X-TTS-Provider', 'google-cloud');
        return reply.send(cachedAudio);
      }

      try {
        const startTime = Date.now();
        logger.info({ 
          textLength: text.length, 
          voice, 
          userId 
        }, 'Generating TTS audio via Google Cloud');

        const buffer = await generateGoogleTTS(text, voice);

        const durationMs = Date.now() - startTime;

        // Cache audio for future requests
        if (text.length < 500) {
          await cacheAudio(cacheHash, buffer).catch((err) => {
            logger.warn({ error: err.message }, 'Failed to cache audio');
          });
        }

        // Record AI usage for rate limiting
        await recordAIUsage(userId, 'TTS_GENERATE', { durationMs });

        // Send response with edge caching headers for browser/CDN
        reply.header('Content-Type', 'audio/wav');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=3600, s-maxage=86400');
        reply.header('X-TTS-Cached', 'false');
        reply.header('X-TTS-Provider', 'google-cloud');
        reply.header('X-TTS-Duration-Ms', durationMs.toString());
        
        return reply.send(buffer);
      } catch (error: any) {
        logger.error({ 
          error: error.message, 
          userId, 
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

      // Speed is handled client-side via playbackRate

      // Check cache
      const hash = generateContentHash(textToRead, voice);
      const cachedAudio = await getCachedAudio(hash);

      if (cachedAudio) {
        logger.info({ hash, packId: id, pageNum }, 'Serving cached study pack page TTS');
        reply.header('Content-Type', 'audio/wav');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400');
        reply.header('X-TTS-Cached', 'true');
        reply.header('X-TTS-Provider', 'google-cloud');
        return reply.send(cachedAudio);
      }

      try {
        logger.info(
          { packId: id, pageNum, textLength: textToRead.length, voice },
          'Generating study pack page TTS via Google Cloud'
        );

        const buffer = await generateGoogleTTS(textToRead.slice(0, 4096), voice);

        await cacheAudio(hash, buffer);

        reply.header('Content-Type', 'audio/wav');
        reply.header('Content-Disposition', 'inline');
        reply.header('Cache-Control', 'public, max-age=86400');
        reply.header('X-TTS-Cached', 'false');
        reply.header('X-TTS-Provider', 'google-cloud');
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
