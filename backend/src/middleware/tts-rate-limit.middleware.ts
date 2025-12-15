/**
 * TTS Rate Limiting Middleware
 * Implements IP-based rate limiting for TTS endpoints (20 requests per minute per IP)
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';

// In-memory store for rate limiting
// Key: IP address, Value: { count: number, resetAt: number }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (data.resetAt < now) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get client IP address from request
 */
function getClientIp(request: FastifyRequest): string {
  // Check X-Forwarded-For header (common in proxies/load balancers)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = request.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket address
  return request.ip || 'unknown';
}

/**
 * Rate limiting middleware for TTS endpoints
 * Limits to MAX_REQUESTS_PER_WINDOW requests per RATE_LIMIT_WINDOW_MS per IP
 */
export async function ttsRateLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const clientIp = getClientIp(request);
  const now = Date.now();

  // Get or create rate limit data for this IP
  let rateLimitData = rateLimitStore.get(clientIp);

  if (!rateLimitData || rateLimitData.resetAt < now) {
    // Create new window
    rateLimitData = {
      count: 0,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(clientIp, rateLimitData);
  }

  // Increment request count
  rateLimitData.count++;

  // Check if limit exceeded
  if (rateLimitData.count > MAX_REQUESTS_PER_WINDOW) {
    const resetIn = Math.ceil((rateLimitData.resetAt - now) / 1000);
    
    logger.warn(
      { 
        ip: clientIp, 
        count: rateLimitData.count, 
        resetIn,
        path: request.url 
      },
      'TTS rate limit exceeded'
    );

    // Set rate limit headers
    reply.header('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    reply.header('X-RateLimit-Remaining', 0);
    reply.header('X-RateLimit-Reset', rateLimitData.resetAt);
    reply.header('Retry-After', resetIn);

    return reply.code(429).send({
      error: 'Too Many Requests',
      message: 'Voice limit reached. Please wait a moment.',
      retryAfter: resetIn,
    });
  }

  // Set rate limit headers for successful requests
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - rateLimitData.count);
  reply.header('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  reply.header('X-RateLimit-Remaining', remaining);
  reply.header('X-RateLimit-Reset', rateLimitData.resetAt);

  logger.debug(
    { 
      ip: clientIp, 
      count: rateLimitData.count, 
      remaining,
      path: request.url 
    },
    'TTS rate limit check passed'
  );
}
