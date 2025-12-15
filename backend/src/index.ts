/**
 * Thynkr Backend API Server
 * Main entry point for the Fastify-based REST API serving the Thynkr learning platform.
 * 
 * Performance Optimizations:
 * - Response caching with Redis
 * - Advanced rate limiting
 * - Response compression (gzip/br)
 * - Database connection pooling
 * - Query optimization utilities
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config';
import { logger } from './lib/logger';
import { initializeGameSocket } from './services/gameSocket.service';
import { initializeRedis, disconnectRedis } from './middleware/cache.middleware';
import { compressionMiddleware } from './middleware/compression.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import contentRoutes from './routes/content.routes';
import adminRoutes from './routes/admin.routes';
import stripeRoutes from './routes/stripe.routes';
import studyRoutes from './routes/study.routes';
import userCoursesRoutes from './routes/user-courses.routes';
import tutorRoutes from './routes/tutor.routes';
import progressRoutes from './routes/progress.routes';
import courseFileAIRoutes from './routes/course-file-ai.routes';
import studyPackRoutes from './routes/study-pack.routes';
import ttsRoutes from './routes/tts.routes';
import courseStudyRoutes from './routes/course-study.routes';
import oauthRoutes from './routes/oauth.routes';
import gamesRoutes from './routes/games.routes';
import { errorHandler } from './middleware/error-handler';

/**
 * Initialize Fastify server instance with optimized configuration
 */
const server = Fastify({
  logger: true,
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
  // Optimized body limits
  bodyLimit: 10 * 1024 * 1024, // 10MB max body size
  // Request timeout
  requestTimeout: 30000, // 30 seconds
  // Connection keep-alive
  keepAliveTimeout: 72000, // 72 seconds
});

/**
 * Start the Fastify server with all plugins and routes registered
 */
async function start() {
  try {
    // Initialize Redis for caching and rate limiting
    await initializeRedis().catch((err) => {
      logger.warn({ err }, 'Redis initialization failed, continuing without caching');
    });

    // Add response compression (gzip/brotli)
    server.addHook('onSend', compressionMiddleware({
      threshold: 1024, // 1KB minimum
      level: 6, // Balanced compression
    }));

    // Configure multipart/form-data handling - delegate to multer middleware
    server.addContentTypeParser(/^multipart\/form-data(;.*)?$/, (_req, _payload, done) => {
      done(null as any);
    });

    // Add content type parser for Stripe webhooks to preserve raw body
    server.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
      try {
        (req as any).rawBody = body;
        const json = JSON.parse(body.toString('utf8'));
        done(null, json);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    });

    // Register security plugins
    await server.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images from different origins
    });

    // CORS
    await server.register(cors, {
      origin: [
        'https://thynkr.ca',
        'https://www.thynkr.ca',
        'http://thynkr.ca',
        'http://www.thynkr.ca',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'http://localhost:5176',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'http://127.0.0.1:5175',
        'http://127.0.0.1:5176',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
    });

    // Rate limiting (using in-memory store for development)
    await server.register(rateLimit, {
      max: 1000,
      timeWindow: '15 minutes',
    });

    // Serve static files from uploads directory
    await server.register(fastifyStatic, {
      root: path.join(process.cwd(), 'uploads'),
      prefix: '/uploads/',
      decorateReply: false,
    });

    // Routes
    server.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // OAuth routes (no /api prefix - frontend expects /auth/google, /auth/apple)
    await server.register(oauthRoutes, { prefix: '/auth' });

    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(userRoutes, { prefix: '/api/users' });
    await server.register(contentRoutes, { prefix: '/api/content' });
    await server.register(adminRoutes, { prefix: '/api/admin' });
    await server.register(stripeRoutes, { prefix: '/api/stripe' });
    await server.register(studyRoutes, { prefix: '/api/study' });
    await server.register(userCoursesRoutes, { prefix: '/api' });
    await server.register(tutorRoutes, { prefix: '/api/tutor' });
    await server.register(progressRoutes, { prefix: '/api/progress' });
    await server.register(courseFileAIRoutes, { prefix: '/api' });
    await server.register(studyPackRoutes, { prefix: '/api' });
    await server.register(ttsRoutes, { prefix: '/api' });
    await server.register(courseStudyRoutes, { prefix: '/api' });
    await server.register(gamesRoutes, { prefix: '/api' });

    // Error handler
    server.setErrorHandler(errorHandler);

    // Start server
    await server.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Server running on http://localhost:${config.port}`);
    logger.info('Performance optimizations enabled: compression, caching, advanced rate limiting');

    // Initialize Socket.io for Thynkr Arcade
    const httpServer = server.server;
    initializeGameSocket(httpServer);
  } catch (err) {
    server.log.error(err);
    await disconnectRedis(); // Clean up Redis connection
    process.exit(1);
  }
}

// Graceful shutdown with cleanup
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`${signal} received, shutting down gracefully`);
    await server.close();
    await disconnectRedis(); // Clean up Redis connection
    process.exit(0);
  });
});

start();
