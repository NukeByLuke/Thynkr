import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { config } from './config';
import { logger } from './lib/logger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import contentRoutes from './routes/content.routes';
import adminRoutes from './routes/admin.routes';
import stripeRoutes from './routes/stripe.routes';
import studyRoutes from './routes/study.routes';
import courseRoutes from './routes/course.routes';
import { errorHandler } from './middleware/error-handler';

// Create Fastify instance with proper logger
const server = Fastify({
  logger: true, // Use Fastify's built-in logger
  requestIdLogLabel: 'reqId',
  disableRequestLogging: false,
  requestIdHeader: 'x-request-id',
});

async function start() {
  try {
    // Accept multipart/form-data without Fastify trying to parse it (multer will handle it)
    server.addContentTypeParser(/^multipart\/form-data(;.*)?$/, (_req, _payload, done) => {
      // Let multer handle the raw stream via request.raw; don't parse here
      done(null as any);
    });

    // Security plugins
    await server.register(helmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from different origins
    });

    // CORS
    await server.register(cors, {
      origin: config.frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    });

    // Rate limiting (using in-memory store for development)
    await server.register(rateLimit, {
      max: 100,
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

    await server.register(authRoutes, { prefix: '/api/auth' });
    await server.register(userRoutes, { prefix: '/api/users' });
    await server.register(contentRoutes, { prefix: '/api/content' });
    await server.register(adminRoutes, { prefix: '/api/admin' });
    await server.register(stripeRoutes, { prefix: '/api/stripe' });
    await server.register(studyRoutes, { prefix: '/api/study' });
  await server.register(courseRoutes, { prefix: '/api' });
  // Tutor routes removed

    // Error handler
    server.setErrorHandler(errorHandler);

    // Start server
    await server.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`${signal} received, shutting down gracefully`);
    await server.close();
    process.exit(0);
  });
});

start();
