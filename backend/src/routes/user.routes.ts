/**
 * User Routes
 * Handles user profile retrieval and updates for authenticated users.
 */

import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../db/client';
import { updateProfileSchema } from '../schemas/validation.schemas';

/**
 * Register user profile routes with the Fastify server
 * @param server - Fastify instance
 */
export default async function userRoutes(server: FastifyInstance) {
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
}
