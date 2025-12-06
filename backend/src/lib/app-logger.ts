import { logger } from './logger';
import fs from 'fs';
import path from 'path';

// Application log configuration
const LOG_DIR = process.env.LOG_DIR || '/var/log/thynkr';
const APP_LOG_FILE = process.env.APP_LOG_FILE || 'app.log';
const MAX_LOG_SIZE = 100 * 1024 * 1024; // 100MB max log file

export interface AppLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  action: string;
  endpoint?: string;
  method?: string;
  userId?: string;
  userEmail?: string;
  duration?: number;
  statusCode?: number;
  message?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface LogFilter {
  level?: 'info' | 'warn' | 'error' | 'debug';
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  search?: string;
}

export interface PaginatedLogs {
  logs: AppLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  stats: {
    info: number;
    warn: number;
    error: number;
    debug: number;
  };
}

// In-memory log buffer for recent logs (fallback when file logging not available)
const LOG_BUFFER_SIZE = 10000;
const logBuffer: AppLogEntry[] = [];

// Ensure log directory exists
function ensureLogDir(): boolean {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    return true;
  } catch (error) {
    logger.warn({ error }, 'Could not create log directory, using memory buffer');
    return false;
  }
}

// Generate unique log ID
function generateLogId(): string {
  return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Write log entry to file
export async function writeAppLog(entry: Omit<AppLogEntry, 'id' | 'timestamp'>): Promise<void> {
  const logEntry: AppLogEntry = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  // Add to memory buffer
  logBuffer.unshift(logEntry);
  if (logBuffer.length > LOG_BUFFER_SIZE) {
    logBuffer.pop();
  }

  // Try to write to file
  if (ensureLogDir()) {
    try {
      const logPath = path.join(LOG_DIR, APP_LOG_FILE);
      const logLine = JSON.stringify(logEntry) + '\n';
      await fs.promises.appendFile(logPath, logLine);

      // Check file size and rotate if needed
      const stats = await fs.promises.stat(logPath);
      if (stats.size > MAX_LOG_SIZE) {
        await rotateLogFile();
      }
    } catch (error) {
      // Silently fail - logs are still in memory buffer
    }
  }
}

// Rotate log file
async function rotateLogFile(): Promise<void> {
  try {
    const logPath = path.join(LOG_DIR, APP_LOG_FILE);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(LOG_DIR, `app-${timestamp}.log`);

    await fs.promises.rename(logPath, archivePath);

    // Keep only last 5 archived logs
    const files = await fs.promises.readdir(LOG_DIR);
    const archiveFiles = files
      .filter((f) => f.startsWith('app-') && f.endsWith('.log'))
      .sort()
      .reverse();

    for (const file of archiveFiles.slice(5)) {
      await fs.promises.unlink(path.join(LOG_DIR, file));
    }
  } catch (error) {
    logger.error({ error }, 'Error rotating log file');
  }
}

// Read logs from file with pagination and filtering
export async function readAppLogs(
  page: number = 1,
  limit: number = 50,
  filter: LogFilter = {}
): Promise<PaginatedLogs> {
  const logs: AppLogEntry[] = [];
  const stats = { info: 0, warn: 0, error: 0, debug: 0 };

  // Try reading from file first
  const logPath = path.join(LOG_DIR, APP_LOG_FILE);

  if (fs.existsSync(logPath)) {
    try {
      const fileContent = await fs.promises.readFile(logPath, 'utf-8');
      const lines = fileContent.trim().split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as AppLogEntry;
          logs.push(entry);
          stats[entry.level]++;
        } catch {
          // Skip malformed lines
        }
      }
    } catch (error) {
      logger.error({ error }, 'Error reading log file');
    }
  }

  // Fallback to memory buffer if no file logs
  if (logs.length === 0) {
    logs.push(...logBuffer);
    for (const entry of logBuffer) {
      stats[entry.level]++;
    }
  }

  // Sort by timestamp (newest first)
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply filters
  let filteredLogs = logs;

  if (filter.level) {
    filteredLogs = filteredLogs.filter((l) => l.level === filter.level);
  }

  if (filter.startDate) {
    filteredLogs = filteredLogs.filter((l) => new Date(l.timestamp) >= filter.startDate!);
  }

  if (filter.endDate) {
    filteredLogs = filteredLogs.filter((l) => new Date(l.timestamp) <= filter.endDate!);
  }

  if (filter.userId) {
    filteredLogs = filteredLogs.filter((l) => l.userId === filter.userId);
  }

  if (filter.userEmail) {
    filteredLogs = filteredLogs.filter((l) =>
      l.userEmail?.toLowerCase().includes(filter.userEmail!.toLowerCase())
    );
  }

  if (filter.endpoint) {
    filteredLogs = filteredLogs.filter((l) =>
      l.endpoint?.toLowerCase().includes(filter.endpoint!.toLowerCase())
    );
  }

  if (filter.search) {
    const searchLower = filter.search.toLowerCase();
    filteredLogs = filteredLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(searchLower) ||
        l.message?.toLowerCase().includes(searchLower) ||
        l.endpoint?.toLowerCase().includes(searchLower) ||
        l.userEmail?.toLowerCase().includes(searchLower)
    );
  }

  // Paginate
  const total = filteredLogs.length;
  const start = (page - 1) * limit;
  const paginatedLogs = filteredLogs.slice(start, start + limit);

  return {
    logs: paginatedLogs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    stats,
  };
}

// Export logs to JSON format
export async function exportLogsJson(filter: LogFilter = {}): Promise<string> {
  const result = await readAppLogs(1, 100000, filter);
  return JSON.stringify(result.logs, null, 2);
}

// Export logs to CSV format
export async function exportLogsCsv(filter: LogFilter = {}): Promise<string> {
  const result = await readAppLogs(1, 100000, filter);

  const headers = [
    'ID',
    'Timestamp',
    'Level',
    'Action',
    'Endpoint',
    'Method',
    'User ID',
    'User Email',
    'Duration (ms)',
    'Status Code',
    'Message',
    'IP Address',
  ];

  const rows = result.logs.map((log) => [
    log.id,
    log.timestamp,
    log.level,
    log.action,
    log.endpoint || '',
    log.method || '',
    log.userId || '',
    log.userEmail || '',
    log.duration?.toString() || '',
    log.statusCode?.toString() || '',
    `"${(log.message || '').replace(/"/g, '""')}"`,
    log.ipAddress || '',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Get log statistics for a time period
export async function getLogStats(hours: number = 24): Promise<{
  total: number;
  byLevel: { info: number; warn: number; error: number; debug: number };
  byHour: { hour: string; count: number; errors: number }[];
  topEndpoints: { endpoint: string; count: number }[];
  avgResponseTime: number;
  errorRate: number;
}> {
  const result = await readAppLogs(1, 100000, {
    startDate: new Date(Date.now() - hours * 60 * 60 * 1000),
  });

  const logs = result.logs;

  // Count by level
  const byLevel = { info: 0, warn: 0, error: 0, debug: 0 };
  logs.forEach((l) => byLevel[l.level]++);

  // Count by hour
  const hourCounts: Map<string, { count: number; errors: number }> = new Map();
  logs.forEach((l) => {
    const hour = new Date(l.timestamp).toISOString().slice(0, 13) + ':00';
    const existing = hourCounts.get(hour) || { count: 0, errors: 0 };
    existing.count++;
    if (l.level === 'error') existing.errors++;
    hourCounts.set(hour, existing);
  });

  const byHour = Array.from(hourCounts.entries())
    .map(([hour, data]) => ({ hour, ...data }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Top endpoints
  const endpointCounts: Map<string, number> = new Map();
  logs.forEach((l) => {
    if (l.endpoint) {
      endpointCounts.set(l.endpoint, (endpointCounts.get(l.endpoint) || 0) + 1);
    }
  });

  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([endpoint, count]) => ({ endpoint, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Average response time
  const responseTimes = logs.filter((l) => l.duration !== undefined).map((l) => l.duration!);
  const avgResponseTime =
    responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

  // Error rate
  const errorRate = logs.length > 0 ? (byLevel.error / logs.length) * 100 : 0;

  return {
    total: logs.length,
    byLevel,
    byHour,
    topEndpoints,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    errorRate: Math.round(errorRate * 100) / 100,
  };
}

// Create request logging middleware
export function createRequestLogger() {
  return async (request: any, reply: any) => {
    const start = Date.now();

    // Add hook to log after response
    reply.raw.on('finish', async () => {
      const duration = Date.now() - start;
      const statusCode = reply.statusCode;

      // Determine log level based on status code
      let level: 'info' | 'warn' | 'error' = 'info';
      if (statusCode >= 500) level = 'error';
      else if (statusCode >= 400) level = 'warn';

      // Extract user info if available
      const userId = request.user?.userId;
      const userEmail = request.user?.email;

      // Don't log health checks
      if (request.url === '/health') return;

      await writeAppLog({
        level,
        action: 'HTTP_REQUEST',
        endpoint: request.url,
        method: request.method,
        userId,
        userEmail,
        duration,
        statusCode,
        message: `${request.method} ${request.url} - ${statusCode}`,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
    });
  };
}
