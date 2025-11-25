import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import prisma from '../db/client';

export default async function contentRoutes(server: FastifyInstance) {
  // Get all content (with access control)
  server.get(
    '/',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const { featured, search, page = '1', limit = '12' } = request.query as any;

      const roleHierarchy: { [key: string]: string[] } = {
        FREE: ['FREE'],
        PRO: ['FREE', 'PRO'],
        PREMIUM: ['FREE', 'PRO', 'PREMIUM'],
        ADMIN: ['FREE', 'PRO', 'PREMIUM', 'ADMIN'],
      };

      const accessibleRoles = roleHierarchy[request.user!.role] || ['FREE'];

      const where: any = {
        published: true,
        requiredRole: { in: accessibleRoles },
      };

      if (featured !== undefined) {
        where.featured = featured === 'true';
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [content, total] = await Promise.all([
        prisma.content.findMany({
          where,
          select: {
            id: true,
            title: true,
            description: true,
            slug: true,
            requiredRole: true,
            featured: true,
            thumbnail: true,
            tags: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.content.count({ where }),
      ]);

      return reply.send({
        content,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  );

  // Get single content by slug
  server.get(
    '/:slug',
    {
      preHandler: authenticate,
    },
    async (request: AuthenticatedRequest, reply) => {
      const { slug } = request.params as { slug: string };

      const content = await prisma.content.findUnique({
        where: { slug, published: true },
      });

      if (!content) {
        return reply.code(404).send({ error: 'Content not found' });
      }

      // Check access
      const roleHierarchy: { [key: string]: number } = {
        FREE: 1,
        PRO: 2,
        PREMIUM: 3,
        ADMIN: 4,
      };

      const userLevel = roleHierarchy[request.user!.role] || 0;
      const requiredLevel = roleHierarchy[content.requiredRole] || 0;

      if (userLevel < requiredLevel) {
        return reply.code(403).send({
          error: 'Upgrade required',
          requiredRole: content.requiredRole,
          currentRole: request.user!.role,
        });
      }

      return reply.send(content);
    }
  );
}
