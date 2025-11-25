import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.middleware';
import prisma from '../db/client';
import { createContentSchema, updateContentSchema } from '../schemas/validation.schemas';

export default async function adminRoutes(server: FastifyInstance) {
  // Get all users (admin only)
  server.get(
    '/users',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { page = '1', limit = '20', search, role } = request.query as any;

      const where: any = {};

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (role) {
        where.role = role;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            lastLoginAt: true,
            subscription: {
              select: {
                status: true,
                stripePriceId: true,
                currentPeriodEnd: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.user.count({ where }),
      ]);

      return reply.send({
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  );

  // Update user role
  server.patch(
    '/users/:id/role',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { role } = request.body as { role: string };

        if (!['FREE', 'PRO', 'PREMIUM', 'ADMIN'].includes(role)) {
          return reply.code(400).send({ error: 'Invalid role' });
        }

        const user = await prisma.user.update({
          where: { id },
          data: { role: role as any },
          select: {
            id: true,
            email: true,
            role: true,
          },
        });

        // Log admin action
        await prisma.adminLog.create({
          data: {
            action: 'UPDATE_USER_ROLE',
            details: `Changed role to ${role}`,
            userId: request.user!.userId,
            userEmail: request.user!.email,
          },
        });

        return reply.send(user);
      } catch (error: any) {
        server.log.error({ error, params: request.params, body: request.body }, 'Role update error');
        return reply.code(500).send({ error: error.message || 'Failed to update role' });
      }
    }
  );

  // Create content
  server.post(
    '/content',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const validated = createContentSchema.parse(request.body);
      const content = await prisma.content.create({
        data: validated,
      });

      await prisma.adminLog.create({
        data: {
          action: 'CREATE_CONTENT',
          details: `Created content: ${content.title}`,
          userId: request.user!.userId,
          userEmail: request.user!.email,
        },
      });

      return reply.code(201).send(content);
    }
  );

  // Update content
  server.patch(
    '/content/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const validated = updateContentSchema.parse(request.body);

      const content = await prisma.content.update({
        where: { id },
        data: validated,
      });

      await prisma.adminLog.create({
        data: {
          action: 'UPDATE_CONTENT',
          details: `Updated content: ${content.title}`,
          userId: request.user!.userId,
          userEmail: request.user!.email,
        },
      });

      return reply.send(content);
    }
  );

  // Delete content
  server.delete(
    '/content/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };

      const content = await prisma.content.delete({
        where: { id },
      });

      await prisma.adminLog.create({
        data: {
          action: 'DELETE_CONTENT',
          details: `Deleted content: ${content.title}`,
          userId: request.user!.userId,
          userEmail: request.user!.email,
        },
      });

      return reply.send({ message: 'Content deleted successfully' });
    }
  );

  // Get admin logs
  server.get(
    '/logs',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { page = '1', limit = '50' } = request.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [logs, total] = await Promise.all([
        prisma.adminLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.adminLog.count(),
      ]);

      return reply.send({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  );

  // Get stats
  server.get(
    '/stats',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const [totalUsers, freeUsers, proUsers, premiumUsers, totalContent, activeSubscriptions] =
        await Promise.all([
          prisma.user.count(),
          prisma.user.count({ where: { role: 'FREE' } }),
          prisma.user.count({ where: { role: 'PRO' } }),
          prisma.user.count({ where: { role: 'PREMIUM' } }),
          prisma.content.count({ where: { published: true } }),
          prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        ]);

      return reply.send({
        users: {
          total: totalUsers,
          free: freeUsers,
          pro: proUsers,
          premium: premiumUsers,
        },
        content: {
          total: totalContent,
        },
        subscriptions: {
          active: activeSubscriptions,
        },
      });
    }
  );
}
