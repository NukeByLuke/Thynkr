/**
 * Optimized Prisma Database Client
 * - Connection pooling for better concurrency
 * - Query logging in development
 * - Performance monitoring
 * - Automatic connection management
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../lib/logger';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });
};

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
  var queryStats: { count: number; totalDuration: number; slowQueries: number };
}

// Initialize query statistics
if (!globalThis.queryStats) {
  globalThis.queryStats = { count: 0, totalDuration: 0, slowQueries: 0 };
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

// Enhanced query logging with performance tracking
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma.$on('query', (e: any) => {
    globalThis.queryStats.count++;
    globalThis.queryStats.totalDuration += e.duration;
    
    // Flag slow queries (>100ms)
    if (e.duration > 100) {
      globalThis.queryStats.slowQueries++;
      logger.warn(
        { query: e.query, duration: e.duration, params: e.params },
        'Slow database query detected'
      );
    } else {
      logger.debug({ query: e.query, duration: e.duration }, 'Database query');
    }
  });

  // Log query statistics every 5 minutes
  setInterval(() => {
    const stats = globalThis.queryStats;
    if (stats.count > 0) {
      logger.info({
        totalQueries: stats.count,
        avgDuration: (stats.totalDuration / stats.count).toFixed(2) + 'ms',
        slowQueries: stats.slowQueries,
      }, 'Database query statistics');
    }
  }, 300000);
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

/**
 * Graceful disconnect on process termination
 */
async function disconnect() {
  await prisma.$disconnect();
  logger.info('Prisma client disconnected');
}

process.on('beforeExit', disconnect);
process.on('SIGINT', disconnect);
process.on('SIGTERM', disconnect);

export default prisma;
