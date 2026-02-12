/**
 * Error Handler Middleware
 * Centralized error handling for Fastify with specific handlers for Zod, JWT, and Prisma errors.
 * Provides user-friendly error messages for frontend consumption.
 */

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

/**
 * User-friendly error messages for common technical errors
 */
const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  'rate limit': 'Our AI is busy right now. Please try again in a moment.',
  'empty response': 'The AI couldn\'t generate a response. Please try again.',
  'gemini api error': 'The AI service is temporarily unavailable. Please try again shortly.',
  'failed to generate': 'Content generation failed. Please try again.',
  'network error': 'Connection issue. Please check your internet and try again.',
  'timeout': 'The request took too long. Please try again with shorter content.',
  'too many tokens': 'The content is too long. Please upload a shorter document.',
  'internal server error': 'Something went wrong. Please try again.',
};

/**
 * Get user-friendly message based on error content
 */
function getUserFriendlyMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  for (const [pattern, friendlyMessage] of Object.entries(USER_FRIENDLY_MESSAGES)) {
    if (lowerMessage.includes(pattern)) {
      return friendlyMessage;
    }
  }
  
  return errorMessage;
}

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
      error: 'Please check your input and try again.',
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
      error: 'Your session has expired. Please sign in again.',
    });
    return;
  }

  // Prisma errors
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    if (prismaError.code === 'P2002') {
      reply.code(409).send({
        error: 'This already exists. Please try a different value.',
        field: prismaError.meta?.target,
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      reply.code(404).send({
        error: 'The requested item could not be found.',
      });
      return;
    }
  }

  // Default error with user-friendly message transformation
  const statusCode = error.statusCode || 500;
  const friendlyMessage = statusCode === 500 
    ? getUserFriendlyMessage(error.message) 
    : error.message;

  reply.code(statusCode).send({
    error: friendlyMessage,
    ...(process.env.NODE_ENV === 'development' && { 
      originalError: error.message,
      stack: error.stack 
    }),
  });
}
