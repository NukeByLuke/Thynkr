/**
 * Admin Routes
 * Comprehensive admin dashboard with user management, analytics, content moderation, and system monitoring.
 */

import { FastifyInstance } from 'fastify';
import { authenticate, AuthenticatedRequest, requireRole } from '../middleware/auth.middleware';
import prisma from '../db/client';
import { createContentSchema, updateContentSchema } from '../schemas/validation.schemas';
import { subDays, startOfMonth, endOfMonth, startOfDay, subMonths, format } from 'date-fns';
import * as digitalOcean from '../services/digitalocean.service';
import * as appLogger from '../lib/app-logger';

/**
 * Register admin-only routes with the Fastify server
 * @param server - Fastify instance
 */
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

        if (!['BASIC', 'STANDARD', 'PREMIUM', 'ADMIN'].includes(role)) {
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
            userRole: 'ADMIN',
            status: 'SUCCESS',
            ipAddress: request.ip,
          },
        });

        return reply.send(user);
      } catch (error: any) {
        server.log.error(
          { error, params: request.params, body: request.body },
          'Role update error'
        );
        return reply.code(500).send({ error: error.message || 'Failed to update role' });
      }
    }
  );

  // Delete user account
  server.delete(
    '/users/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        // Prevent admin from deleting themselves
        if (id === request.user!.userId) {
          return reply.code(400).send({ error: 'You cannot delete your own account' });
        }

        // Check if user exists
        const user = await prisma.user.findUnique({
          where: { id },
          select: { id: true, email: true, role: true },
        });

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Delete all related data in order (due to foreign key constraints)
        await prisma.$transaction(async (tx) => {
          // Delete subscription if exists
          await tx.subscription.deleteMany({ where: { userId: id } });

          // Delete study-related data
          await tx.studySession.deleteMany({ where: { userId: id } });
          await tx.studyStreak.deleteMany({ where: { userId: id } });

          // Delete flashcard sets and flashcards (via cascade from file)
          // Delete quizzes and quiz attempts (via cascade from file)
          // Delete summaries and notes (via cascade from file)

          // Delete tutor-related data
          await tx.tutorMessage.deleteMany({ where: { session: { userId: id } } });
          await tx.tutorSessionFile.deleteMany({ where: { session: { userId: id } } });
          await tx.tutorSession.deleteMany({ where: { userId: id } });

          // Delete courses and course files
          await tx.courseFile.deleteMany({ where: { course: { createdBy: id } } });
          await tx.course.deleteMany({ where: { createdBy: id } });

          // Delete uploaded files (this cascades to summaries, notes, quizzes, flashcards)
          await tx.uploadedFile.deleteMany({ where: { userId: id } });

          // Delete folders
          await tx.folder.deleteMany({ where: { userId: id } });

          // Delete quiz attempts
          await tx.quizAttempt.deleteMany({ where: { userId: id } });

          // Delete refresh tokens
          await tx.refreshToken.deleteMany({ where: { userId: id } });

          // Finally delete the user
          await tx.user.delete({ where: { id } });
        });

        // Log admin action
        await prisma.adminLog.create({
          data: {
            action: 'DELETE_USER',
            details: `Deleted user: ${user.email} (${user.role})`,
            userId: request.user!.userId,
            userEmail: request.user!.email,
            userRole: 'ADMIN',
            status: 'SUCCESS',
            ipAddress: request.ip,
          },
        });

        return reply.send({ message: 'User deleted successfully' });
      } catch (error: any) {
        server.log.error({ error, params: request.params }, 'Delete user error');
        return reply.code(500).send({ error: error.message || 'Failed to delete user' });
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
          userRole: 'ADMIN',
          status: 'SUCCESS',
          ipAddress: request.ip,
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
          userRole: 'ADMIN',
          status: 'SUCCESS',
          ipAddress: request.ip,
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
          userRole: 'ADMIN',
          status: 'SUCCESS',
          ipAddress: request.ip,
        },
      });

      return reply.send({ message: 'Content deleted successfully' });
    }
  );

  // ============ ACTIVITY LOGS & SYSTEM HEALTH ============

  // Get admin logs (enhanced with filters)
  server.get(
    '/logs',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const {
        page = '1',
        limit = '50',
        search,
        action,
        status,
        startDate,
        endDate,
      } = request.query as any;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build where clause
      const where: any = {};

      if (search) {
        where.OR = [
          { userEmail: { contains: search, mode: 'insensitive' } },
          { details: { contains: search, mode: 'insensitive' } },
          { ipAddress: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (action) {
        where.action = action;
      }

      if (status) {
        where.status = status;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const [logs, total] = await Promise.all([
        prisma.adminLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.adminLog.count({ where }),
      ]);

      // Get action types for filters
      const actionTypes = await prisma.adminLog.groupBy({
        by: ['action'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      // Get status counts
      const statusCounts = await prisma.adminLog.groupBy({
        by: ['status'],
        _count: { id: true },
      });

      return reply.send({
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        filters: {
          actionTypes: actionTypes.map((a) => ({ action: a.action, count: a._count.id })),
          statusCounts: statusCounts.map((s) => ({
            status: s.status || 'SUCCESS',
            count: s._count.id,
          })),
        },
      });
    }
  );

  // Export logs
  server.get(
    '/logs/export',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { format: exportFormat = 'json', startDate, endDate } = request.query as any;

      const where: any = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const logs = await prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10000, // Limit export to 10k records
      });

      if (exportFormat === 'csv') {
        const headers = [
          'ID',
          'Action',
          'Details',
          'User Email',
          'User Role',
          'IP Address',
          'Status',
          'Created At',
        ];
        const csvRows = [headers.join(',')];

        for (const log of logs) {
          const row = [
            log.id,
            log.action,
            `"${(log.details || '').replace(/"/g, '""')}"`,
            log.userEmail || '',
            log.userRole || '',
            log.ipAddress || '',
            log.status || 'SUCCESS',
            log.createdAt.toISOString(),
          ];
          csvRows.push(row.join(','));
        }

        const csv = csvRows.join('\n');
        reply.header('Content-Type', 'text/csv');
        reply.header(
          'Content-Disposition',
          `attachment; filename=admin-logs-${new Date().toISOString().split('T')[0]}.csv`
        );
        return reply.send(csv);
      }

      // Default: JSON
      reply.header('Content-Type', 'application/json');
      reply.header(
        'Content-Disposition',
        `attachment; filename=admin-logs-${new Date().toISOString().split('T')[0]}.json`
      );
      return reply.send(JSON.stringify(logs, null, 2));
    }
  );

  // Get log statistics
  server.get(
    '/logs/stats',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const now = new Date();
      const today = startOfDay(now);
      const weekAgo = subDays(now, 7);
      const monthAgo = subDays(now, 30);

      const [totalLogs, logsToday, logsThisWeek, logsThisMonth, errorLogs, warningLogs] =
        await Promise.all([
          prisma.adminLog.count(),
          prisma.adminLog.count({ where: { createdAt: { gte: today } } }),
          prisma.adminLog.count({ where: { createdAt: { gte: weekAgo } } }),
          prisma.adminLog.count({ where: { createdAt: { gte: monthAgo } } }),
          prisma.adminLog.count({ where: { status: 'ERROR' } }),
          prisma.adminLog.count({ where: { status: 'WARNING' } }),
        ]);

      // Activity by hour (last 24 hours)
      const hourlyActivity = [];
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now);
        hourStart.setHours(now.getHours() - i, 0, 0, 0);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourStart.getHours() + 1);

        const count = await prisma.adminLog.count({
          where: { createdAt: { gte: hourStart, lt: hourEnd } },
        });

        hourlyActivity.push({
          hour: format(hourStart, 'HH:00'),
          count,
        });
      }

      // Daily activity (last 14 days)
      const dailyActivity = [];
      for (let i = 13; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i));
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.adminLog.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        });

        dailyActivity.push({
          date: format(dayStart, 'MMM d'),
          count,
        });
      }

      return reply.send({
        summary: {
          totalLogs,
          logsToday,
          logsThisWeek,
          logsThisMonth,
          errorLogs,
          warningLogs,
          successLogs: totalLogs - errorLogs - warningLogs,
        },
        charts: {
          hourly: hourlyActivity,
          daily: dailyActivity,
        },
      });
    }
  );

  // System health endpoint
  server.get(
    '/system-health',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const startTime = Date.now();

      // Database health check
      let dbStatus = 'healthy';
      let dbLatency = 0;
      try {
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        dbLatency = Date.now() - dbStart;
        if (dbLatency > 1000) dbStatus = 'degraded';
      } catch {
        dbStatus = 'unhealthy';
        dbLatency = -1;
      }

      // Get database stats
      const [totalUsers, totalCourses, totalFiles, totalSessions, totalLogs] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.uploadedFile.count(),
        prisma.studySession.count(),
        prisma.adminLog.count(),
      ]);

      // Memory usage (Node.js process)
      const memUsage = process.memoryUsage();
      const formatBytes = (bytes: number) => Math.round((bytes / 1024 / 1024) * 100) / 100;

      // Uptime
      const uptimeSeconds = process.uptime();
      const uptimeDays = Math.floor(uptimeSeconds / 86400);
      const uptimeHours = Math.floor((uptimeSeconds % 86400) / 3600);
      const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);

      // Recent activity (last hour)
      const hourAgo = subDays(new Date(), 1 / 24);
      const [recentLogins, recentErrors, recentUploads] = await Promise.all([
        prisma.user.count({ where: { lastLoginAt: { gte: hourAgo } } }),
        prisma.adminLog.count({ where: { status: 'ERROR', createdAt: { gte: hourAgo } } }),
        prisma.uploadedFile.count({ where: { createdAt: { gte: hourAgo } } }),
      ]);

      // API response time
      const apiLatency = Date.now() - startTime;

      // Get latest logs for quick view
      const recentLogs = await prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          action: true,
          userEmail: true,
          status: true,
          createdAt: true,
        },
      });

      // Overall system status
      let overallStatus = 'healthy';
      if (dbStatus !== 'healthy' || recentErrors > 10) {
        overallStatus = 'degraded';
      }
      if (dbStatus === 'unhealthy' || recentErrors > 50) {
        overallStatus = 'critical';
      }

      return reply.send({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: {
          seconds: Math.floor(uptimeSeconds),
          formatted: `${uptimeDays}d ${uptimeHours}h ${uptimeMinutes}m`,
        },
        database: {
          status: dbStatus,
          latency: dbLatency,
          stats: {
            users: totalUsers,
            courses: totalCourses,
            files: totalFiles,
            sessions: totalSessions,
            logs: totalLogs,
          },
        },
        memory: {
          heapUsed: formatBytes(memUsage.heapUsed),
          heapTotal: formatBytes(memUsage.heapTotal),
          rss: formatBytes(memUsage.rss),
          external: formatBytes(memUsage.external),
          unit: 'MB',
        },
        api: {
          latency: apiLatency,
          status: apiLatency < 500 ? 'healthy' : apiLatency < 2000 ? 'degraded' : 'slow',
        },
        activity: {
          lastHour: {
            logins: recentLogins,
            errors: recentErrors,
            uploads: recentUploads,
          },
        },
        recentLogs,
      });
    }
  );

  // ============ DIGITALOCEAN SYSTEM METRICS ============

  // Get full droplet metrics from DigitalOcean
  server.get(
    '/system/droplet',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const health = await digitalOcean.getSystemHealth();
      return reply.send(health);
    }
  );

  // Get CPU metrics
  server.get(
    '/system/cpu',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const metrics = await digitalOcean.getCpuMetrics();
      if (!metrics) {
        return reply.code(503).send({ error: 'Metrics not available' });
      }
      return reply.send(metrics);
    }
  );

  // Get memory metrics
  server.get(
    '/system/memory',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const metrics = await digitalOcean.getMemoryMetrics();
      if (!metrics) {
        return reply.code(503).send({ error: 'Metrics not available' });
      }
      return reply.send(metrics);
    }
  );

  // Get disk metrics
  server.get(
    '/system/disk',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const metrics = await digitalOcean.getDiskMetrics();
      if (!metrics) {
        return reply.code(503).send({ error: 'Metrics not available' });
      }
      return reply.send(metrics);
    }
  );

  // Get network/bandwidth metrics
  server.get(
    '/system/network',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const metrics = await digitalOcean.getNetworkMetrics();
      if (!metrics) {
        return reply.code(503).send({ error: 'Metrics not available' });
      }
      return reply.send(metrics);
    }
  );

  // Get comprehensive droplet metrics
  server.get(
    '/system/metrics',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const metrics = await digitalOcean.getDropletMetrics();
      if (!metrics) {
        return reply.code(503).send({ error: 'Metrics not available' });
      }
      return reply.send(metrics);
    }
  );

  // ============ APPLICATION LOGS ============

  // Get application logs with pagination and filtering
  server.get(
    '/app-logs',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const {
        page = '1',
        limit = '50',
        level,
        startDate,
        endDate,
        userId,
        userEmail,
        endpoint,
        search,
      } = request.query as any;

      const filter: appLogger.LogFilter = {};

      if (level) filter.level = level;
      if (startDate) filter.startDate = new Date(startDate);
      if (endDate) filter.endDate = new Date(endDate);
      if (userId) filter.userId = userId;
      if (userEmail) filter.userEmail = userEmail;
      if (endpoint) filter.endpoint = endpoint;
      if (search) filter.search = search;

      const result = await appLogger.readAppLogs(parseInt(page), parseInt(limit), filter);

      return reply.send(result);
    }
  );

  // Get application log statistics
  server.get(
    '/app-logs/stats',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { hours = '24' } = request.query as any;
      const stats = await appLogger.getLogStats(parseInt(hours));
      return reply.send(stats);
    }
  );

  // Export application logs
  server.get(
    '/app-logs/export',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const {
        format: exportFormat = 'json',
        level,
        startDate,
        endDate,
        userId,
        userEmail,
        endpoint,
      } = request.query as any;

      const filter: appLogger.LogFilter = {};

      if (level) filter.level = level;
      if (startDate) filter.startDate = new Date(startDate);
      if (endDate) filter.endDate = new Date(endDate);
      if (userId) filter.userId = userId;
      if (userEmail) filter.userEmail = userEmail;
      if (endpoint) filter.endpoint = endpoint;

      let content: string;
      let contentType: string;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];

      if (exportFormat === 'csv') {
        content = await appLogger.exportLogsCsv(filter);
        contentType = 'text/csv';
        filename = `app-logs-${timestamp}.csv`;
      } else {
        content = await appLogger.exportLogsJson(filter);
        contentType = 'application/json';
        filename = `app-logs-${timestamp}.json`;
      }

      reply.header('Content-Type', contentType);
      reply.header('Content-Disposition', `attachment; filename=${filename}`);
      return reply.send(content);
    }
  );

  // Get stats
  server.get(
    '/stats',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const [
        totalUsers,
        basicUsers,
        standardUsers,
        premiumUsers,
        totalContent,
        activeSubscriptions,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: 'BASIC' } }),
        prisma.user.count({ where: { role: 'STANDARD' } }),
        prisma.user.count({ where: { role: 'PREMIUM' } }),
        prisma.content.count({ where: { published: true } }),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      ]);

      return reply.send({
        users: {
          total: totalUsers,
          basic: basicUsers,
          standard: standardUsers,
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

  // Get AI usage metrics
  server.get(
    '/ai-metrics',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { days = '30' } = request.query as { days?: string };
      const daysAgo = parseInt(days);
      const startDate = subDays(new Date(), daysAgo);

      // Get AI-related study sessions - cast to satisfy TypeScript
      const aiActivityTypes = [
        'SUMMARY_VIEW',
        'NOTES_VIEW',
        'QUIZ_ATTEMPT',
        'FLASHCARD_STUDY',
        'TUTOR_CHAT',
        'TTS_GENERATE',
        'STUDY_PACK_CREATE',
      ] as any[];

      // Get total AI requests
      const totalRequests = await prisma.studySession.count({
        where: {
          activityType: { in: aiActivityTypes },
          createdAt: { gte: startDate },
        },
      });

      // Get requests by type
      const requestsByType = await prisma.studySession.groupBy({
        by: ['activityType'],
        where: {
          activityType: { in: aiActivityTypes },
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      // Get requests by user tier
      const sessionsWithUser = await prisma.studySession.findMany({
        where: {
          activityType: { in: aiActivityTypes },
          createdAt: { gte: startDate },
        },
        select: {
          user: { select: { role: true } },
        },
      });

      const requestsByTier = sessionsWithUser.reduce(
        (acc, session) => {
          const tier = session.user.role;
          acc[tier] = (acc[tier] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get daily breakdown for chart
      const dailyRequests = await prisma.studySession.groupBy({
        by: ['createdAt'],
        where: {
          activityType: { in: aiActivityTypes },
          createdAt: { gte: startDate },
        },
        _count: true,
      });

      // Aggregate by day
      const dailyBreakdown = dailyRequests.reduce(
        (acc, item) => {
          const day = format(item.createdAt, 'yyyy-MM-dd');
          const count =
            typeof item._count === 'number' ? item._count : (item._count as any)._all || 0;
          acc[day] = (acc[day] || 0) + count;
          return acc;
        },
        {} as Record<string, number>
      );

      // Get top users by AI usage
      const topUsers = await prisma.studySession.groupBy({
        by: ['userId'],
        where: {
          activityType: { in: aiActivityTypes },
          createdAt: { gte: startDate },
        },
        _count: true,
        orderBy: { _count: { userId: 'desc' } },
        take: 10,
      });

      // Get user details for top users
      const userIds = topUsers.map((u) => u.userId);
      const userDetails = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, email: true, username: true, role: true },
      });

      const topUsersWithDetails = topUsers.map((u) => {
        const user = userDetails.find((ud) => ud.id === u.userId);
        const count = typeof u._count === 'number' ? u._count : (u._count as any)._all || 0;
        return {
          userId: u.userId,
          email: user?.email || 'Unknown',
          username: user?.username || 'Unknown',
          role: user?.role || 'BASIC',
          requestCount: count,
        };
      });

      return reply.send({
        period: {
          days: daysAgo,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
        },
        totalRequests,
        requestsByType: requestsByType.reduce(
          (acc, item) => {
            const count =
              typeof item._count === 'number' ? item._count : (item._count as any)._all || 0;
            acc[item.activityType] = count;
            return acc;
          },
          {} as Record<string, number>
        ),
        requestsByTier,
        dailyBreakdown: Object.entries(dailyBreakdown)
          .map(([date, count]) => ({
            date,
            count,
          }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        topUsers: topUsersWithDetails,
      });
    }
  );

  // Get payment analytics
  server.get(
    '/payments/analytics',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const now = new Date();
      const thisMonthStart = startOfMonth(now);
      const thisMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const sevenDaysAgo = subDays(now, 7);
      const thirtyDaysAgo = subDays(now, 30);

      // Get all payments for calculations
      const [
        allPayments,
        thisMonthPayments,
        lastMonthPayments,
        last7DaysPayments,
        activeSubscriptions,
        canceledSubscriptions,
        newSubscriptions7Days,
      ] = await Promise.all([
        prisma.payment.findMany({
          where: { status: 'SUCCEEDED' },
          select: { amount: true, createdAt: true, planType: true },
        }),
        prisma.payment.findMany({
          where: {
            status: 'SUCCEEDED',
            createdAt: { gte: thisMonthStart, lte: thisMonthEnd },
          },
          select: { amount: true },
        }),
        prisma.payment.findMany({
          where: {
            status: 'SUCCEEDED',
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
          },
          select: { amount: true },
        }),
        prisma.payment.findMany({
          where: {
            status: 'SUCCEEDED',
            createdAt: { gte: sevenDaysAgo },
          },
          select: { amount: true },
        }),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.subscription.count({
          where: {
            status: 'CANCELED',
            updatedAt: { gte: thirtyDaysAgo },
          },
        }),
        prisma.subscription.count({
          where: {
            createdAt: { gte: sevenDaysAgo },
          },
        }),
      ]);

      // Calculate totals
      const totalRevenueAllTime = allPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRevenueThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRevenueLastMonth = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRevenue7Days = last7DaysPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate MRR (Monthly Recurring Revenue)
      // For simplicity, use this month's revenue as MRR
      const mrr = totalRevenueThisMonth;

      // Calculate churn rate (canceled / (active + canceled) * 100)
      const totalSubs = activeSubscriptions + canceledSubscriptions;
      const churnRate = totalSubs > 0 ? (canceledSubscriptions / totalSubs) * 100 : 0;

      // Calculate ARPU (Average Revenue Per User)
      const arpu = activeSubscriptions > 0 ? totalRevenueThisMonth / activeSubscriptions : 0;

      // Calculate revenue growth
      const revenueGrowth =
        lastMonthPayments.length > 0
          ? ((totalRevenueThisMonth - totalRevenueLastMonth) / totalRevenueLastMonth) * 100
          : 0;

      // Generate revenue chart data (last 6 months)
      const revenueChartData = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(now, i));
        const monthEnd = endOfMonth(subMonths(now, i));
        const monthPayments = allPayments.filter(
          (p) => p.createdAt >= monthStart && p.createdAt <= monthEnd
        );
        const monthRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
        revenueChartData.push({
          month: format(monthStart, 'MMM'),
          revenue: monthRevenue / 100, // Convert cents to dollars
        });
      }

      // Generate daily revenue for last 30 days
      const dailyRevenueData = [];
      for (let i = 29; i >= 0; i--) {
        const dayStart = startOfDay(subDays(now, i));
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const dayPayments = allPayments.filter(
          (p) => p.createdAt >= dayStart && p.createdAt <= dayEnd
        );
        const dayRevenue = dayPayments.reduce((sum, p) => sum + p.amount, 0);
        dailyRevenueData.push({
          date: format(dayStart, 'MMM d'),
          revenue: dayRevenue / 100,
        });
      }

      // Plan distribution
      const planDistribution = {
        standard: allPayments.filter((p) => p.planType === 'STANDARD').length,
        premium: allPayments.filter((p) => p.planType === 'PREMIUM').length,
      };

      return reply.send({
        summary: {
          totalRevenueAllTime: totalRevenueAllTime / 100,
          totalRevenueThisMonth: totalRevenueThisMonth / 100,
          totalRevenue7Days: totalRevenue7Days / 100,
          mrr: mrr / 100,
          churnRate: Math.round(churnRate * 10) / 10,
          arpu: Math.round(arpu) / 100,
          revenueGrowth: Math.round(revenueGrowth * 10) / 10,
          activeSubscriptions,
          canceledLast30Days: canceledSubscriptions,
          newSubscriptions7Days,
        },
        charts: {
          monthly: revenueChartData,
          daily: dailyRevenueData,
          planDistribution,
        },
      });
    }
  );

  // Get recent payments
  server.get(
    '/payments/recent',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { page = '1', limit = '20' } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.payment.count(),
      ]);

      return reply.send({
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  );

  // ============ COURSE INSIGHTS ============

  // Get course statistics
  server.get(
    '/course-stats',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      // Get total courses by visibility
      const [totalCourses, publicCourses, privateCourses, publishedCourses] = await Promise.all([
        prisma.course.count(),
        prisma.course.count({ where: { visibility: 'PUBLIC' } }),
        prisma.course.count({ where: { visibility: 'PRIVATE' } }),
        prisma.course.count({ where: { published: true } }),
      ]);

      // Get category distribution
      const categoryDistribution = await prisma.course.groupBy({
        by: ['category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      });

      // Get total files and average per course
      const totalFiles = await prisma.courseFile.count();
      const avgFilesPerCourse =
        totalCourses > 0 ? Math.round((totalFiles / totalCourses) * 10) / 10 : 0;

      // Courses created this month
      const monthStart = startOfMonth(new Date());
      const coursesThisMonth = await prisma.course.count({
        where: { createdAt: { gte: monthStart } },
      });

      // Courses created last 7 days
      const weekAgo = subDays(new Date(), 7);
      const coursesLast7Days = await prisma.course.count({
        where: { createdAt: { gte: weekAgo } },
      });

      // Calculate growth (courses this month vs last month)
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
      const coursesLastMonth = await prisma.course.count({
        where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
      });
      const growthRate =
        coursesLastMonth > 0
          ? ((coursesThisMonth - coursesLastMonth) / coursesLastMonth) * 100
          : coursesThisMonth > 0
            ? 100
            : 0;

      return reply.send({
        summary: {
          totalCourses,
          publicCourses,
          privateCourses,
          publishedCourses,
          unpublishedCourses: totalCourses - publishedCourses,
          totalFiles,
          avgFilesPerCourse,
          coursesThisMonth,
          coursesLast7Days,
          growthRate: Math.round(growthRate * 10) / 10,
        },
        categoryDistribution: categoryDistribution.map((c) => ({
          category: c.category,
          count: c._count.id,
        })),
      });
    }
  );

  // Get top course creators
  server.get(
    '/course-creators',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { page = '1', limit = '10' } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Get creators with course counts
      const creatorsRaw = await prisma.course.groupBy({
        by: ['createdBy'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        skip,
        take: parseInt(limit),
      });

      // Get total unique creators
      const totalCreators = await prisma.course.groupBy({
        by: ['createdBy'],
        _count: { id: true },
      });

      // Get user details and visibility breakdown for each creator
      const creators = await Promise.all(
        creatorsRaw.map(async (c) => {
          const user = await prisma.user.findUnique({
            where: { id: c.createdBy },
            select: { id: true, email: true, firstName: true, lastName: true },
          });

          const [publicCount, privateCount] = await Promise.all([
            prisma.course.count({ where: { createdBy: c.createdBy, visibility: 'PUBLIC' } }),
            prisma.course.count({ where: { createdBy: c.createdBy, visibility: 'PRIVATE' } }),
          ]);

          const totalFiles = await prisma.courseFile.count({
            where: { course: { createdBy: c.createdBy } },
          });

          return {
            userId: c.createdBy,
            email: user?.email || 'Unknown',
            firstName: user?.firstName,
            lastName: user?.lastName,
            totalCourses: c._count.id,
            publicCourses: publicCount,
            privateCourses: privateCount,
            totalFiles,
            avgFilesPerCourse:
              c._count.id > 0 ? Math.round((totalFiles / c._count.id) * 10) / 10 : 0,
          };
        })
      );

      return reply.send({
        creators,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCreators.length,
          pages: Math.ceil(totalCreators.length / parseInt(limit)),
        },
      });
    }
  );

  // Get recent courses
  server.get(
    '/courses/recent',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { page = '1', limit = '12', category, visibility, search } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where: any = {};
      if (category) where.category = category;
      if (visibility) where.visibility = visibility;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            creator: {
              select: { id: true, email: true, firstName: true, lastName: true },
            },
            _count: { select: { files: true } },
          },
        }),
        prisma.course.count({ where }),
      ]);

      return reply.send({
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          slug: c.slug,
          bannerImage: c.bannerImage,
          coverImage: c.coverImage,
          category: c.category,
          visibility: c.visibility,
          published: c.published,
          creator: c.creator,
          fileCount: c._count.files,
          createdAt: c.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  );

  // Get courses by a specific user
  server.get(
    '/users/:userId/courses',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      const { userId } = request.params as { userId: string };
      const { page = '1', limit = '20' } = request.query as any;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where: { createdBy: userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
          include: {
            _count: { select: { files: true } },
          },
        }),
        prisma.course.count({ where: { createdBy: userId } }),
      ]);

      return reply.send({
        user,
        courses: courses.map((c) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          slug: c.slug,
          bannerImage: c.bannerImage,
          coverImage: c.coverImage,
          category: c.category,
          visibility: c.visibility,
          published: c.published,
          fileCount: c._count.files,
          createdAt: c.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    }
  );

  // Update course visibility
  server.patch(
    '/courses/:id/visibility',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const { visibility } = request.body as { visibility: 'PUBLIC' | 'PRIVATE' };

        if (!['PUBLIC', 'PRIVATE'].includes(visibility)) {
          return reply.code(400).send({ error: 'Invalid visibility value' });
        }

        const course = await prisma.course.update({
          where: { id },
          data: { visibility: visibility as any },
          select: { id: true, title: true, visibility: true },
        });

        await prisma.adminLog.create({
          data: {
            action: 'UPDATE_COURSE_VISIBILITY',
            details: `Changed course "${course.title}" visibility to ${visibility}`,
            userId: request.user!.userId,
            userEmail: request.user!.email,
            userRole: 'ADMIN',
            status: 'SUCCESS',
            ipAddress: request.ip,
          },
        });

        return reply.send(course);
      } catch (error: any) {
        server.log.error({ error }, 'Course visibility update error');
        return reply.code(500).send({ error: error.message || 'Failed to update visibility' });
      }
    }
  );

  // Delete course
  server.delete(
    '/courses/:id',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      try {
        const { id } = request.params as { id: string };

        const course = await prisma.course.findUnique({
          where: { id },
          select: { id: true, title: true, createdBy: true },
        });

        if (!course) {
          return reply.code(404).send({ error: 'Course not found' });
        }

        await prisma.$transaction(async (tx) => {
          // Delete course files first
          await tx.courseFile.deleteMany({ where: { courseId: id } });
          // Delete the course
          await tx.course.delete({ where: { id } });
        });

        await prisma.adminLog.create({
          data: {
            action: 'DELETE_COURSE',
            details: `Deleted course "${course.title}"`,
            userId: request.user!.userId,
            userEmail: request.user!.email,
            userRole: 'ADMIN',
            status: 'SUCCESS',
            ipAddress: request.ip,
          },
        });

        return reply.send({ message: 'Course deleted successfully' });
      } catch (error: any) {
        server.log.error({ error }, 'Course deletion error');
        return reply.code(500).send({ error: error.message || 'Failed to delete course' });
      }
    }
  );

  // Course creation trend (for charts)
  server.get(
    '/course-trends',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      // Monthly course creation trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const count = await prisma.course.count({
          where: { createdAt: { gte: monthStart, lte: monthEnd } },
        });
        monthlyTrend.push({
          month: format(monthStart, 'MMM yyyy'),
          courses: count,
        });
      }

      // Daily trend (last 14 days)
      const dailyTrend = [];
      for (let i = 13; i >= 0; i--) {
        const dayStart = startOfDay(subDays(new Date(), i));
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        const count = await prisma.course.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        });
        dailyTrend.push({
          date: format(dayStart, 'MMM d'),
          courses: count,
        });
      }

      return reply.send({
        monthly: monthlyTrend,
        daily: dailyTrend,
      });
    }
  );

  // Dashboard stats endpoint
  server.get(
    '/dashboard/stats',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const now = new Date();
      const startOfToday = startOfDay(now);
      const sevenDaysAgo = subDays(now, 7);

      // Get user stats
      const [totalUsers, usersToday, usersLastWeek] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.user.count({
          where: { createdAt: { lt: sevenDaysAgo } },
        }),
      ]);

      const weekGrowth =
        totalUsers > 0 ? Math.round(((totalUsers - usersLastWeek) / usersLastWeek) * 100) : 0;

      // Get session stats (using StudySession as proxy for active sessions)
      const [activeSessions, sessionsToday] = await Promise.all([
        prisma.studySession.count({
          where: {
            createdAt: { gte: subDays(now, 1) },
          },
        }),
        prisma.studySession.count({
          where: { createdAt: { gte: startOfToday } },
        }),
      ]);

      // Get file stats
      const [totalFiles, filesToday] = await Promise.all([
        prisma.uploadedFile.count(),
        prisma.uploadedFile.count({
          where: { createdAt: { gte: startOfToday } },
        }),
      ]);

      // Calculate total file size
      const filesWithSize = await prisma.uploadedFile.findMany({
        select: { fileSize: true },
      });
      const totalSize = filesWithSize.reduce(
        (sum: number, file: any) => sum + (file.fileSize || 0),
        0
      );

      // Get AI request stats (using TutorSession as proxy)
      const [aiRequestsToday, aiRequestsYesterday, aiRequestsWeek] = await Promise.all([
        prisma.tutorSession.count({
          where: { createdAt: { gte: startOfToday } },
        }),
        prisma.tutorSession.count({
          where: {
            createdAt: {
              gte: subDays(startOfToday, 1),
              lt: startOfToday,
            },
          },
        }),
        prisma.tutorSession.count({
          where: { createdAt: { gte: sevenDaysAgo } },
        }),
      ]);

      const aiTrend =
        aiRequestsYesterday > 0
          ? Math.round(((aiRequestsToday - aiRequestsYesterday) / aiRequestsYesterday) * 100)
          : 0;

      return reply.send({
        users: {
          total: totalUsers,
          today: usersToday,
          weekGrowth,
        },
        sessions: {
          active: activeSessions,
          today: sessionsToday,
          avgDuration: 0, // Can be calculated if you track session duration
        },
        files: {
          total: totalFiles,
          totalSize,
          today: filesToday,
        },
        aiRequests: {
          today: aiRequestsToday,
          week: aiRequestsWeek,
          trend: aiTrend,
        },
      });
    }
  );

  // Dashboard usage trends endpoint
  server.get(
    '/dashboard/usage-trends',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (_request: AuthenticatedRequest, reply) => {
      const trends = [];

      for (let i = 6; i >= 0; i--) {
        const dayStart = startOfDay(subDays(new Date(), i));
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const [users, sessions, aiRequests] = await Promise.all([
          prisma.user.count({
            where: { createdAt: { lte: dayEnd } },
          }),
          prisma.studySession.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          }),
          prisma.tutorSession.count({
            where: {
              createdAt: {
                gte: dayStart,
                lte: dayEnd,
              },
            },
          }),
        ]);

        trends.push({
          date: format(dayStart, 'MMM d'),
          users,
          sessions,
          aiRequests,
        });
      }

      return reply.send(trends);
    }
  );

  // Real-time metrics endpoint (SSE)
  server.get(
    '/metrics/live',
    {
      preHandler: [authenticate, requireRole('ADMIN')],
    },
    async (request: AuthenticatedRequest, reply) => {
      // Set headers for SSE
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      });

      const sendMetrics = async () => {
        try {
          const now = new Date();
          const startOfToday = startOfDay(now);
          const oneMinuteAgo = subDays(now, 0);
          oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
          const sevenDaysAgo = subDays(now, 7);

          // Get all metrics in parallel
          const [
            totalUsers,
            usersToday,
            activeSessions,
            sessionsToday,
            totalFiles,
            filesToday,
            aiRequestsToday,
            aiRequestsWeek,
            activeSubscriptions,
            systemUptime,
          ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
            prisma.studySession.count({
              where: { createdAt: { gte: oneMinuteAgo } },
            }),
            prisma.studySession.count({
              where: { createdAt: { gte: startOfToday } },
            }),
            prisma.uploadedFile.count(),
            prisma.uploadedFile.count({
              where: { createdAt: { gte: startOfToday } },
            }),
            prisma.tutorSession.count({
              where: { createdAt: { gte: startOfToday } },
            }),
            prisma.tutorSession.count({
              where: { createdAt: { gte: sevenDaysAgo } },
            }),
            prisma.subscription.count({
              where: { status: 'ACTIVE' },
            }),
            process.uptime(),
          ]);

          // Calculate file size
          const filesWithSize = await prisma.uploadedFile.findMany({
            select: { fileSize: true },
            take: 10000, // Limit for performance
          });
          const totalSize = filesWithSize.reduce(
            (sum: number, file: any) => sum + (file.fileSize || 0),
            0
          );

          // Get recent activity (last 5 minutes)
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
          const recentActivity = await prisma.adminLog.count({
            where: { createdAt: { gte: fiveMinutesAgo } },
          });

          // Calculate average response time from recent logs
          const recentLogs = await prisma.adminLog.findMany({
            where: { createdAt: { gte: fiveMinutesAgo } },
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          let avgResponseTime = 0;
          if (recentLogs.length > 1) {
            const timeDiffs = [];
            for (let i = 1; i < recentLogs.length; i++) {
              const diff =
                recentLogs[i - 1].createdAt.getTime() - recentLogs[i].createdAt.getTime();
              timeDiffs.push(diff);
            }
            avgResponseTime = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
          }

          // System health status
          let healthStatus = 'healthy';
          if (avgResponseTime > 1000) healthStatus = 'degraded';
          if (avgResponseTime > 3000) healthStatus = 'critical';

          const metrics = {
            users: {
              total: totalUsers,
              today: usersToday,
            },
            sessions: {
              active: activeSessions,
              today: sessionsToday,
            },
            files: {
              total: totalFiles,
              today: filesToday,
              totalSize,
            },
            aiRequests: {
              today: aiRequestsToday,
              week: aiRequestsWeek,
            },
            subscriptions: {
              active: activeSubscriptions,
            },
            system: {
              uptime: Math.floor(systemUptime),
              avgResponseTime: Math.round(avgResponseTime),
              status: healthStatus,
              recentActivity,
            },
            timestamp: now.toISOString(),
          };

          // Send data as SSE
          reply.raw.write(`data: ${JSON.stringify(metrics)}\n\n`);
        } catch (error) {
          server.log.error({ error }, 'Error sending metrics');
        }
      };

      // Send initial metrics immediately
      await sendMetrics();

      // Send updates every 5 seconds
      const interval = setInterval(sendMetrics, 5000);

      // Cleanup on connection close
      request.raw.on('close', () => {
        clearInterval(interval);
        reply.raw.end();
      });
    }
  );
}
