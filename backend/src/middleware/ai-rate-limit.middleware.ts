import { FastifyReply } from 'fastify';
import { AuthenticatedRequest } from './auth.middleware';
import { canUseAI } from '../lib/tier-limits';
import prisma from '../db/client';
import { logger } from '../lib/logger';

// AI activity types that count toward limits
export type AIActivityType =
  | 'SUMMARY_VIEW'
  | 'NOTES_VIEW'
  | 'QUIZ_ATTEMPT'
  | 'FLASHCARD_STUDY'
  | 'TUTOR_CHAT'
  | 'TTS_GENERATE'
  | 'STUDY_PACK_CREATE';

/**
 * Middleware to enforce AI rate limits based on user tier
 * Checks if user has remaining AI quota before allowing the request
 */
export async function checkAIRateLimit(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user) {
    return reply.code(401).send({ error: 'Authentication required' });
  }

  const { userId, role } = request.user;

  try {
    const result = await canUseAI(userId, role);

    if (!result.allowed) {
      logger.warn({ userId, role, remaining: result.remaining }, 'AI rate limit exceeded');

      return reply.code(429).send({
        error: 'AI usage limit exceeded',
        message: result.reason,
        remaining: result.remaining,
        upgradeRequired: true,
      });
    }

    // Attach remaining quota to request for informational purposes
    (request as any).aiQuota = {
      remaining: result.remaining,
      unlimited: result.remaining === undefined,
    };
  } catch (error) {
    logger.error({ error, userId }, 'Failed to check AI rate limit');
    // Allow request on error to avoid blocking legitimate requests
    // but log for monitoring
  }
}

/**
 * Record an AI usage event for rate limiting tracking
 * Call this after successful AI generation to count toward limits
 */
export async function recordAIUsage(
  userId: string,
  activityType: AIActivityType,
  metadata?: {
    fileId?: string;
    sessionId?: string;
    studyPackId?: string;
    tokensUsed?: number;
    durationMs?: number;
    cost?: number;
  }
): Promise<void> {
  try {
    // Use durationMinutes field which exists in the schema
    const durationMinutes = metadata?.durationMs ? Math.round(metadata.durationMs / 60000) : 0;

    await prisma.studySession.create({
      data: {
        userId,
        activityType: activityType as any, // Type assertion needed until Prisma client regenerated
        ...(metadata?.fileId && { fileId: metadata.fileId }),
        durationMinutes,
      },
    });

    logger.debug({ userId, activityType, ...metadata }, 'AI usage recorded');
  } catch (error) {
    logger.error({ error, userId, activityType }, 'Failed to record AI usage');
    // Don't throw - usage tracking failure shouldn't break the request
  }
}

/**
 * Get AI usage statistics for admin dashboard
 */
export async function getAIUsageMetrics(options?: {
  startDate?: Date;
  endDate?: Date;
  groupBy?: 'day' | 'week' | 'month';
}): Promise<{
  totalRequests: number;
  requestsByType: Record<AIActivityType, number>;
  requestsByTier: Record<string, number>;
  averageResponseTime?: number;
  estimatedCost?: number;
}> {
  const startOfMonth =
    options?.startDate ||
    (() => {
      const d = new Date();
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    })();

  const endDate = options?.endDate || new Date();

  // AI activity types for filtering
  const aiActivityTypes = [
    'SUMMARY_VIEW',
    'NOTES_VIEW',
    'QUIZ_ATTEMPT',
    'FLASHCARD_STUDY',
    'TUTOR_CHAT',
    'TTS_GENERATE',
    'STUDY_PACK_CREATE',
  ] as const;

  // Get total requests
  const sessions = await prisma.studySession.findMany({
    where: {
      activityType: {
        in: aiActivityTypes as any,
      },
      createdAt: {
        gte: startOfMonth,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: { role: true },
      },
    },
  });

  // Aggregate by type
  const requestsByType = sessions.reduce(
    (acc, session) => {
      const type = session.activityType as string;
      acc[type as AIActivityType] = (acc[type as AIActivityType] || 0) + 1;
      return acc;
    },
    {} as Record<AIActivityType, number>
  );

  // Aggregate by tier
  const requestsByTier = sessions.reduce(
    (acc, session) => {
      const tier = (session as any).user?.role || 'UNKNOWN';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalRequests: sessions.length,
    requestsByType,
    requestsByTier,
  };
}
