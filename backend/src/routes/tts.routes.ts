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
import path from 'path';

// Supported Chirp 3: HD voices (LLM-powered, studio-quality, natural human intonation)
const VOICES = ['charon', 'fenrir', 'puck', 'enceladus', 'aoede', 'kore'] as const;
type Voice = (typeof VOICES)[number];

// Map voice IDs to Google Cloud TTS Chirp 3: HD voice names
const VOICE_MAP: Record<Voice, string> = {
  charon: 'en-US-Chirp3-HD-Charon',       // Male, warm & trustworthy
  fenrir: 'en-US-Chirp3-HD-Fenrir',       // Male, firm & authoritative
  puck: 'en-US-Chirp3-HD-Puck',           // Male, breezy & storytelling
  enceladus: 'en-US-Chirp3-HD-Enceladus', // Male, deep & commanding
  aoede: 'en-US-Chirp3-HD-Aoede',         // Female, energetic & expressive
  kore: 'en-US-Chirp3-HD-Kore',           // Female, upbeat & bright
};

// Map old OpenAI voice IDs to new Chirp 3: HD voices (backward compat for DB preferences)
const LEGACY_VOICE_MAP: Record<string, Voice> = {
  alloy: 'charon',
  echo: 'fenrir',
  fable: 'puck',
  onyx: 'enceladus',
  nova: 'aoede',
  shimmer: 'kore',
};

/** Resolve a voice ID, handling legacy OpenAI names gracefully */
function resolveVoice(raw: string | undefined | null): Voice {
  if (!raw) return 'charon';
  if (VOICES.includes(raw as Voice)) return raw as Voice;
  if (raw in LEGACY_VOICE_MAP) return LEGACY_VOICE_MAP[raw];
  return 'charon';
}

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
      pendingGenerations.delete(token);
    }
  }
}, 60000);

// Pending audio generation promises (started during negotiate for faster stream delivery)
const pendingGenerations = new Map<string, Promise<Buffer>>();

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
// Long texts are streamed chunk-by-chunk for much faster time-to-first-audio.
const FAST_START_THRESHOLD = 2000;

/**
 * Hard split overly long sentence-like content by words when punctuation
 * boundaries are not available.
 */
function splitByWordBoundary(text: string, maxSize: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const parts: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) {
      parts.push(current.trim());
      current = '';
    }
  };

  for (const word of words) {
    // Fallback for very long single tokens/URLs.
    if (word.length > maxSize) {
      pushCurrent();
      for (let i = 0; i < word.length; i += maxSize) {
        parts.push(word.slice(i, i + maxSize));
      }
      continue;
    }

    if (!current) {
      current = word;
      continue;
    }

    if (current.length + 1 + word.length <= maxSize) {
      current += ` ${word}`;
    } else {
      pushCurrent();
      current = word;
    }
  }

  pushCurrent();
  return parts;
}

/**
 * Split text into speakable chunks at sentence boundaries
 * First chunk is smaller for faster time-to-first-byte
 */
function splitTextIntoChunks(text: string): string[] {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  // For short texts, return as-is
  if (normalized.length <= FIRST_CHUNK_TARGET_SIZE) {
    return [normalized];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  let isFirstChunk = true;

  // Split by sentences (period, exclamation, question mark followed by space or end)
  const sentences = normalized.split(/(?<=[.!?])\s+/);

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    // Use smaller target for first chunk (near-instant playback)
    let targetSize = isFirstChunk ? FIRST_CHUNK_TARGET_SIZE : CHUNK_TARGET_SIZE;
    let minSize = isFirstChunk ? 100 : CHUNK_MIN_SIZE;

    // If punctuation splitting produced a very long segment, force chunking by words.
    if (trimmed.length > targetSize) {
      const forcedParts = splitByWordBoundary(trimmed, targetSize);
      for (const part of forcedParts) {
        const partTargetSize = isFirstChunk ? FIRST_CHUNK_TARGET_SIZE : CHUNK_TARGET_SIZE;
        const partMinSize = isFirstChunk ? 100 : CHUNK_MIN_SIZE;

        if (currentChunk.length > 0 && currentChunk.length + part.length > partTargetSize) {
          if (currentChunk.length >= partMinSize) {
            chunks.push(currentChunk.trim());
            currentChunk = part;
            isFirstChunk = false;
          } else {
            currentChunk += ` ${part}`;
          }
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${part}` : part;
        }
      }
      continue;
    }

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

// No pcmToWav needed — we use MP3 output directly from Google Cloud TTS

/**
 * Shared helper to call Google Cloud TTS via the official client library
 * Uses service account credentials (handles OAuth2 automatically)
 */
async function callGoogleTTS(text: string, voiceName: string): Promise<Buffer> {
  const client = getTTSClient();

  // Extract language code from voice name (e.g. "en-US" from "en-US-Chirp3-HD-Charon")
  const languageCode = voiceName.split('-').slice(0, 2).join('-');

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3' as const,
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
    
    // Call API with timeout — returns MP3 directly
    const mp3Buffer = await withTimeout(
      callGoogleTTS(text, googleVoice),
      TTS_TIMEOUT_MS,
      `TTS generation for ${googleVoice}`
    );
     
    const elapsed = Date.now() - startTime;
    logger.info({ voice, googleVoice, elapsed, sizeKB: Math.round(mp3Buffer.length / 1024) }, 'TTS generation completed');

    return mp3Buffer;
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
 * Generate MP3 audio chunk using Google Cloud TTS (for chunked streaming)
 */
async function generateGoogleChunk(text: string, voice: Voice, retries = 2): Promise<Buffer> {
  const googleVoice = VOICE_MAP[voice];

  try {
    return await withTimeout(
      callGoogleTTS(text, googleVoice),
      TTS_TIMEOUT_MS,
      `TTS chunk generation for ${googleVoice}`
    );
  } catch (error: any) {
    logger.error({ voice, googleVoice, error: error.message }, 'TTS chunk generation failed');
    
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return generateGoogleChunk(text, voice, retries - 1);
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

/**
 * Generate or retrieve cached audio for a text+voice combination.
 * For long texts, splits into chunks and generates all in parallel for speed.
 * Returns a complete MP3 buffer ready to serve with Content-Length.
 */
async function generateOrGetCached(text: string, voice: Voice): Promise<Buffer> {
  const hash = generateContentHash(text, voice);

  // 1. Check disk cache first (instant)
  const cached = await getCachedAudio(hash);
  if (cached) {
    logger.info({ hash, voice, fromCache: true, sizeKB: Math.round(cached.length / 1024) }, 'TTS cache hit');
    return cached;
  }

  // 2. For short/medium texts (<=2000 chars), generate in a single API call
  if (text.length <= FAST_START_THRESHOLD) {
    const buffer = await generateGoogleTTS(text, voice);
    cacheAudio(hash, buffer).catch(() => {});
    return buffer;
  }

  // 3. For longer texts, split into chunks and generate ALL in parallel
  const chunks = splitTextIntoChunks(text);
  logger.info({ voice, textLength: text.length, chunkCount: chunks.length }, 'Generating TTS in parallel chunks');

  const MAX_PARALLEL = 8;
  const chunkBuffers: Buffer[] = new Array(chunks.length);

  for (let i = 0; i < chunks.length; i += MAX_PARALLEL) {
    const batchEnd = Math.min(i + MAX_PARALLEL, chunks.length);
    await Promise.all(
      chunks.slice(i, batchEnd).map((chunk, batchIdx) =>
        generateGoogleChunk(chunk, voice).then(buf => {
          chunkBuffers[i + batchIdx] = buf;
        })
      )
    );
  }

  const combined = Buffer.concat(chunkBuffers);
  cacheAudio(hash, combined).catch(() => {});
  logger.info({ hash, voice, sizeKB: Math.round(combined.length / 1024), chunks: chunks.length }, 'Parallel TTS generation complete, cached');
  return combined;
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

  // Pre-warm TTS client on startup (avoids cold-start latency on first request)
  try {
    getTTSClient();
    logger.info('TTS client pre-warmed successfully');
  } catch (e: any) {
    logger.warn({ error: e.message }, 'Failed to pre-warm TTS client (will retry on first request)');
  }

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
      { id: 'charon', name: 'Charon', description: 'Warm — Trustworthy and clear', gender: 'male' },
      { id: 'fenrir', name: 'Fenrir', description: 'Firm — Professional and authoritative', gender: 'male' },
      { id: 'puck', name: 'Puck', description: 'Breezy — Light and storytelling', gender: 'male' },
      { id: 'enceladus', name: 'Enceladus', description: 'Deep — Strong and commanding', gender: 'male' },
      { id: 'aoede', name: 'Aoede', description: 'Energetic — Lively and expressive', gender: 'female' },
      { id: 'kore', name: 'Kore', description: 'Upbeat — Cheerful and bright', gender: 'female' },
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
             voice = voice || resolveVoice(user.ttsVoice);
             speed = speed !== undefined ? speed : user.ttsSpeed;
          }
      }
      voice = resolveVoice(voice);
      speed = speed !== undefined ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed)) : 1.0;

      // Generate token
      const token = randomBytes(16).toString('hex');
      const trimmedText = body.text.slice(0, 4096);
      streamTokens.set(token, {
        text: trimmedText,
        voice,
        speed,
        userId,
        userRole,
        expiresAt: Date.now() + 60000 // 1 minute to start stream
      });

      // Kick off eager generation for short/medium payloads.
      // Long payloads are streamed with fast-start chunking in /stream for better UX.
      if (trimmedText.length <= FAST_START_THRESHOLD) {
        const genPromise = generateOrGetCached(trimmedText, voice);
        pendingGenerations.set(token, genPromise);
        // Auto-cleanup after 2 minutes
        genPromise.finally(() => {
          setTimeout(() => pendingGenerations.delete(token), 120000);
        });
      }

      return reply.send({ token, url: `/api/tts/stream/${token}` });
    }
  );

  /**
   * GET /api/tts/stream/:token - Serve generated audio
   * Short texts: serves complete buffer with Content-Length.
   * Long texts: streams chunk-by-chunk to start playback sooner.
   */
  server.get(
    '/tts/stream/:token',
    async (request: any, reply: FastifyReply) => {
      const { token } = request.params as { token: string };
      const data = streamTokens.get(token);

      if (!data) {
        return reply.status(404).send({ error: 'Invalid or expired stream token' });
      }

      // Extend expiry for browser retries
      data.expiresAt = Date.now() + 30000;
      const { userId } = data;
      const cacheHash = generateContentHash(data.text, data.voice);

      try {
        // 1) Serve from disk cache immediately if available.
        const cachedAudio = await getCachedAudio(cacheHash);
        if (cachedAudio) {
          pendingGenerations.delete(token);
          streamTokens.delete(token);

          reply.header('Content-Type', 'audio/mpeg');
          reply.header('Content-Length', cachedAudio.length);
          reply.header('Cache-Control', 'private, max-age=3600');
          reply.header('Accept-Ranges', 'bytes');
          reply.header('X-TTS-Provider', 'google-cloud');
          reply.header('X-TTS-Cached', 'true');
          return reply.send(cachedAudio);
        }

        // 2) Fast-start mode for long payloads: stream chunks as they complete.
        if (data.text.length > FAST_START_THRESHOLD) {
          const chunks = splitTextIntoChunks(data.text);
          if (chunks.length === 0) {
            pendingGenerations.delete(token);
            streamTokens.delete(token);
            return reply.status(400).send({ error: 'No text to stream' });
          }

          logger.info({ token, userId, chunkCount: chunks.length, textLength: data.text.length }, 'Starting fast-start chunked TTS stream');

          // Start all chunk generations in parallel; first chunk is intentionally short.
          const chunkPromises = chunks.map((chunk) => generateGoogleChunk(chunk, data.voice));
          const chunkBuffers: Buffer[] = new Array(chunks.length);

          // Ensure first chunk is ready before hijacking response.
          const firstChunk = await chunkPromises[0];
          chunkBuffers[0] = firstChunk;

          reply.hijack();
          const raw = reply.raw;
          raw.statusCode = 200;
          raw.setHeader('Content-Type', 'audio/mpeg');
          raw.setHeader('Cache-Control', 'private, max-age=3600');
          raw.setHeader('X-TTS-Provider', 'google-cloud');
          raw.setHeader('X-TTS-Cached', 'false');
          raw.setHeader('X-TTS-Mode', 'chunked-faststart');

          raw.write(firstChunk);

          try {
            for (let i = 1; i < chunkPromises.length; i += 1) {
              const nextChunk = await chunkPromises[i];
              chunkBuffers[i] = nextChunk;
              raw.write(nextChunk);
            }

            raw.end();

            const combined = Buffer.concat(chunkBuffers);
            cacheAudio(cacheHash, combined).catch(() => {});
          } catch (streamErr: any) {
            logger.error({ error: streamErr.message, token, userId }, 'Chunked TTS stream failed mid-stream');
            if (!raw.writableEnded) {
              raw.end();
            }
          } finally {
            pendingGenerations.delete(token);
            streamTokens.delete(token);
          }

          return;
        }

        // 3) Short payload path (full buffer for reliable seeking/duration).
        const pending = pendingGenerations.get(token);
        const buffer = pending
          ? await pending
          : await generateOrGetCached(data.text, data.voice);

        pendingGenerations.delete(token);
        streamTokens.delete(token);

        reply.header('Content-Type', 'audio/mpeg');
        reply.header('Content-Length', buffer.length);
        reply.header('Cache-Control', 'private, max-age=3600');
        reply.header('Accept-Ranges', 'bytes');
        reply.header('X-TTS-Provider', 'google-cloud');
        reply.header('X-TTS-Cached', 'false');
        return reply.send(buffer);
      } catch (error: any) {
        logger.error({ error: error.message, userId }, 'TTS stream generation failed');
        pendingGenerations.delete(token);
        streamTokens.delete(token);
        return reply.status(500).send({ error: 'Generation failed' });
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
            voice = resolveVoice(user.ttsVoice);
          }
        } catch (error) {
          logger.warn({ error, userId }, 'Failed to fetch user preferences, using defaults');
        }
      }

      // Apply defaults if still not set
      voice = resolveVoice(voice);

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
        reply.header('Content-Type', 'audio/mpeg');
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
        reply.header('Content-Type', 'audio/mpeg');
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
          : resolveVoice(user?.ttsVoice);

      // Speed is handled client-side via playbackRate

      // Check cache
      const hash = generateContentHash(textToRead, voice);
      const cachedAudio = await getCachedAudio(hash);

      if (cachedAudio) {
        logger.info({ hash, packId: id, pageNum }, 'Serving cached study pack page TTS');
        reply.header('Content-Type', 'audio/mpeg');
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

        reply.header('Content-Type', 'audio/mpeg');
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
