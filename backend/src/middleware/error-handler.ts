/**
 * Error Handler Middleware
 * Centralized error handling for Fastify with specific handlers for Zod, JWT, and Prisma errors.
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

/**
 * Global error handler for all API routes
 * @param error - Fastify error object
 * @param request - Fastify request
 * @param reply - Fastify reply
 */
export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): FastifyReply | void {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    },
    'Error occurred'
  );

  // Zod validation errors
  if (error instanceof ZodError) {
    reply.code(400).send({
      error: 'Validation error',
      details: error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    reply.code(401).send({
      error: 'Invalid or expired token',
    });
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      reply.code(409).send({
        error: 'Resource already exists',
        field: prismaError.meta?.target,
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      reply.code(404).send({
        error: 'Resource not found',
      });
      return;
    }
  }

  // Default error
  const statusCode = error.statusCode || 500;

  reply.code(statusCode).send({
    error: statusCode === 500 ? 'Internal server error' : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}
