import { FastifyRequest, FastifyReply } from 'fastify';
import { createHmac } from 'crypto';
import { logger } from '../lib/logger';

const FILE_TOKEN_SECRET = process.env.FILE_TOKEN_SECRET || 'thynkr-file-token-secret-key';
const TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface FileTokenPayload {
  fileId: string;
  courseId: string;
  userId: string;
  exp: number;
}

/**
 * Generate a signed, time-limited token for file viewing
 */
export function generateFileViewToken(fileId: string, courseId: string, userId: string): string {
  const exp = Date.now() + TOKEN_EXPIRY_MS;
  const payload: FileTokenPayload = { fileId, courseId, userId, exp };
  const data = JSON.stringify(payload);
  const signature = createHmac('sha256', FILE_TOKEN_SECRET).update(data).digest('hex');
  const token = Buffer.from(JSON.stringify({ data, signature })).toString('base64url');
  return token;
}

/**
 * Verify and decode a file view token
 */
export function verifyFileViewToken(token: string): FileTokenPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString());
    const { data, signature } = decoded;

    // Verify signature
    const expectedSignature = createHmac('sha256', FILE_TOKEN_SECRET).update(data).digest('hex');
    if (signature !== expectedSignature) {
      logger.warn('Invalid file token signature');
      return null;
    }

    const payload: FileTokenPayload = JSON.parse(data);

    // Check expiry
    if (Date.now() > payload.exp) {
      logger.warn('Expired file token');
      return null;
    }

    return payload;
  } catch (error) {
    logger.error({ error }, 'Failed to verify file token');
    return null;
  }
}

/**
 * Middleware to block download attempts on course file routes
 */
export async function blockDownloadAttempts(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const query = request.query as Record<string, string>;
  const headers = request.headers;

  // Block explicit download query params
  if (query.download === '1' || query.download === 'true' || query.dl === '1') {
    logger.warn({ ip: request.ip, url: request.url }, 'Blocked download attempt via query param');
    return reply.code(403).send({ error: 'File downloads are not allowed' });
  }

  // Block if response-content-disposition is set to attachment
  if (query['response-content-disposition']?.toLowerCase().includes('attachment')) {
    logger.warn(
      { ip: request.ip, url: request.url },
      'Blocked download attempt via content-disposition'
    );
    return reply.code(403).send({ error: 'File downloads are not allowed' });
  }

  // Log Range header usage for monitoring (but allow it for video/audio seeking)
  if (headers.range) {
    logger.info(
      { ip: request.ip, url: request.url, range: headers.range },
      'Range request detected'
    );
  }
}

/**
 * Set security headers for inline file viewing
 */
export function setSecureViewHeaders(
  reply: FastifyReply,
  fileName: string,
  mimeType: string
): void {
  // Sanitize filename for Content-Disposition
  const sanitizedName = fileName
    .replace(/[^\w\s.-]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 100);

  // Force inline viewing - never attachment
  reply.header('Content-Disposition', `inline; filename="${sanitizedName}"`);
  reply.header('Content-Type', mimeType);

  // Prevent MIME type sniffing
  reply.header('X-Content-Type-Options', 'nosniff');

  // Strict CSP to prevent embedding and downloads
  reply.header(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      "img-src 'self'",
      "style-src 'unsafe-inline'",
      "script-src 'none'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "base-uri 'none'",
    ].join('; ')
  );

  // Prevent framing from external sites
  reply.header('X-Frame-Options', 'SAMEORIGIN');

  // No caching for security
  reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  reply.header('Pragma', 'no-cache');
  reply.header('Expires', '0');
}

/**
 * Get MIME type for common file extensions
 */
export function getMimeType(filePath: string): string {
  const ext = filePath.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}
