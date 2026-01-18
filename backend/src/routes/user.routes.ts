/**
 * User Routes
 * Handles user profile retrieval and updates for authenticated users.
 */

import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../db/client';
import { updateProfileSchema } from '../schemas/validation.schemas';
import { ACHIEVEMENTS } from '../services/gamification.service';

/**
 * Register user profile routes with the Fastify server
 * @param server - Fastify instance
 */
export default async function userRoutes(server: FastifyInstance) {
  // Public Profile - Get user achievements
  server.get<{ Params: { username: string } }>(
    '/:username/achievements',
    async (request, reply) => {
      const { username } = request.params;

      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          xp: true,
          level: true,
          createdAt: true,
          userAchievements: {
            select: {
              achievementId: true,
              unlockedAt: true,
              currentTier: true,
              currentValue: true,
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }

      // Format achievements with definitions
      const achievementsWithMetadata = user.userAchievements
        .map((ua) => {
          const definition = ACHIEVEMENTS[ua.achievementId];
          if (!definition) return null;

          // Simple progress approximation for public view
          // In a real implementation, we would replicate the service logic to determine "next required"
          // based on currentTier.
          return {
            ...ua,
            tier: ua.currentTier, // Map currentTier to tier if frontend expects it, or keep it as is
            definition,
            progress: {
              current: ua.currentValue,
              required: 0, // Placeholder - calculation complex without service utility
              percentage: 0
            } 
          };
        })
        .filter(Boolean);

      return reply.send({
        user: {
          username: user.username,
          displayName: user.firstName,
          avatarUrl: user.avatarUrl,
          xp: user.xp,
          level: user.level,
          joinedAt: user.createdAt,
        },
        achievements: achievementsWithMetadata,
      });
    }
  );

  // Get current user profile
  server.get(
    '/me',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          theme: true,
          preferredLanguage: true,
          ttsVoice: true,
          ttsSpeed: true,
          role: true,
          emailVerified: true,
          createdAt: true,
          lastLoginAt: true,
          subscription: {
            select: {
              status: true,
              stripePriceId: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              cancelAtPeriodEnd: true,
            },
          },
        },
      });

      return reply.send(user);
    }
  );

  // Update profile
  server.patch(
    '/me',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const validated = updateProfileSchema.parse(request.body);
      const user = await prisma.user.update({
        where: { id: request.user!.userId },
        data: validated,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          preferredLanguage: true,
        },
      });

      return reply.send(user);
    }
  );

  // Get notification preferences
  server.get(
    '/me/notifications',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.userId },
        select: {
          notificationsEnabled: true,
          notificationsPersist: true,
        },
      });

      return reply.send(user);
    }
  );

  // Update notification preferences
  server.patch(
    '/me/notifications',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const body = request.body as {
        notificationsEnabled?: boolean;
        notificationsPersist?: boolean;
      };

      const user = await prisma.user.update({
        where: { id: request.user!.userId },
        data: {
          ...(body.notificationsEnabled !== undefined && { notificationsEnabled: body.notificationsEnabled }),
          ...(body.notificationsPersist !== undefined && { notificationsPersist: body.notificationsPersist }),
        },
        select: {
          notificationsEnabled: true,
          notificationsPersist: true,
        },
      });

      return reply.send(user);
    }
  );
}
