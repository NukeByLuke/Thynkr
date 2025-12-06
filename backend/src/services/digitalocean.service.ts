import { logger } from '../lib/logger';

// DigitalOcean API configuration
const DO_API_TOKEN = process.env.DIGITALOCEAN_API_TOKEN;
const DROPLET_ID = process.env.DIGITALOCEAN_DROPLET_ID;
const DO_API_BASE = 'https://api.digitalocean.com/v2';
const IS_CONFIGURED = Boolean(DO_API_TOKEN && DROPLET_ID);

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, CacheEntry<any>> = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Types for DigitalOcean metrics
export interface DropletMetrics {
  cpu: {
    usage: number;
    history: { timestamp: string; value: number }[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    history: { timestamp: string; value: number }[];
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  bandwidth: {
    inbound: number;
    outbound: number;
    inboundHistory: { timestamp: string; value: number }[];
    outboundHistory: { timestamp: string; value: number }[];
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
}

export interface DropletInfo {
  id: number;
  name: string;
  status: string;
  region: string;
  size: string;
  vcpus: number;
  memory: number;
  disk: number;
  createdAt: string;
  ipAddress: string;
}

// Format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Fetch from DigitalOcean API
async function doFetch<T>(endpoint: string): Promise<T | null> {
  if (!DO_API_TOKEN) {
    logger.warn('DigitalOcean API token not configured');
    return null;
  }

  try {
    const response = await fetch(`${DO_API_BASE}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${DO_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logger.error({ status: response.status, endpoint }, 'DigitalOcean API error');
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    logger.error({ error, endpoint }, 'DigitalOcean API fetch error');
    return null;
  }
}

// Get droplet information
export async function getDropletInfo(): Promise<DropletInfo | null> {
  if (!IS_CONFIGURED) {
    // Return mock droplet info when not configured
    return {
      id: 0,
      name: 'thynkr-server',
      status: 'active',
      region: 'tor1',
      size: 's-1vcpu-1gb',
      vcpus: 1,
      memory: 1024,
      disk: 25,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      ipAddress: '138.197.208.81',
    };
  }

  const cacheKey = 'droplet-info';
  const cached = getCached<DropletInfo>(cacheKey);
  if (cached) return cached;

  const response = await doFetch<{ droplet: any }>(`/droplets/${DROPLET_ID}`);
  if (!response?.droplet) return null;

  const droplet = response.droplet;
  const info: DropletInfo = {
    id: droplet.id,
    name: droplet.name,
    status: droplet.status,
    region: droplet.region?.name || droplet.region?.slug,
    size: droplet.size_slug,
    vcpus: droplet.vcpus,
    memory: droplet.memory,
    disk: droplet.disk,
    createdAt: droplet.created_at,
    ipAddress: droplet.networks?.v4?.[0]?.ip_address || 'Unknown',
  };

  setCache(cacheKey, info);
  return info;
}

// Get droplet metrics
export async function getDropletMetrics(): Promise<DropletMetrics | null> {
  if (!IS_CONFIGURED) {
    // Return mock data when DigitalOcean API is not configured
    return getMockMetrics();
  }

  const cacheKey = 'droplet-metrics';
  const cached = getCached<DropletMetrics>(cacheKey);
  if (cached) return cached;

  // Calculate time range (last 24 hours)
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // Fetch all metrics in parallel
  const [cpuData, memoryData, diskData, bandwidthInData, bandwidthOutData] = await Promise.all([
    doFetch<any>(
      `/monitoring/metrics/droplet/cpu?host_id=${DROPLET_ID}&start=${startISO}&end=${endISO}`
    ),
    doFetch<any>(
      `/monitoring/metrics/droplet/memory_free?host_id=${DROPLET_ID}&start=${startISO}&end=${endISO}`
    ),
    doFetch<any>(
      `/monitoring/metrics/droplet/filesystem_free?host_id=${DROPLET_ID}&start=${startISO}&end=${endISO}`
    ),
    doFetch<any>(
      `/monitoring/metrics/droplet/bandwidth?host_id=${DROPLET_ID}&start=${startISO}&end=${endISO}&interface=public&direction=inbound`
    ),
    doFetch<any>(
      `/monitoring/metrics/droplet/bandwidth?host_id=${DROPLET_ID}&start=${startISO}&end=${endISO}&interface=public&direction=outbound`
    ),
  ]);

  // Get droplet info for memory/disk totals
  const dropletInfo = await getDropletInfo();
  const totalMemoryMB = dropletInfo?.memory || 1024;
  const totalDiskGB = dropletInfo?.disk || 25;

  // Parse CPU metrics
  const cpuHistory = parseMetricHistory(cpuData?.data?.result?.[0]?.values);
  const currentCpu = cpuHistory.length > 0 ? cpuHistory[cpuHistory.length - 1].value : 0;

  // Parse memory metrics (API returns free memory, we need to calculate used)
  const memoryFreeHistory = parseMetricHistory(memoryData?.data?.result?.[0]?.values);
  const currentMemoryFreeMB =
    memoryFreeHistory.length > 0
      ? memoryFreeHistory[memoryFreeHistory.length - 1].value / (1024 * 1024)
      : totalMemoryMB;
  const usedMemoryMB = totalMemoryMB - currentMemoryFreeMB;
  const memoryPercentage = (usedMemoryMB / totalMemoryMB) * 100;

  // Parse disk metrics
  const diskFreeBytes = diskData?.data?.result?.[0]?.values?.slice(-1)?.[0]?.[1] || 0;
  const diskFreeGB = parseFloat(diskFreeBytes) / (1024 * 1024 * 1024);
  const diskUsedGB = totalDiskGB - diskFreeGB;
  const diskPercentage = (diskUsedGB / totalDiskGB) * 100;

  // Parse bandwidth metrics
  const bandwidthInHistory = parseMetricHistory(bandwidthInData?.data?.result?.[0]?.values);
  const bandwidthOutHistory = parseMetricHistory(bandwidthOutData?.data?.result?.[0]?.values);

  // Calculate total bandwidth (sum of all values for the period)
  const totalInbound = bandwidthInHistory.reduce((sum, p) => sum + p.value, 0);
  const totalOutbound = bandwidthOutHistory.reduce((sum, p) => sum + p.value, 0);

  // Calculate uptime from droplet created_at
  const createdAt = dropletInfo?.createdAt ? new Date(dropletInfo.createdAt) : new Date();
  const uptimeSeconds = Math.floor((Date.now() - createdAt.getTime()) / 1000);

  const metrics: DropletMetrics = {
    cpu: {
      usage: Math.round(currentCpu * 100) / 100,
      history: cpuHistory.slice(-48), // Last 48 data points
    },
    memory: {
      used: Math.round(usedMemoryMB),
      total: totalMemoryMB,
      percentage: Math.round(memoryPercentage * 100) / 100,
      history: memoryFreeHistory.slice(-48).map((p) => ({
        timestamp: p.timestamp,
        value: Math.round(
          ((totalMemoryMB * 1024 * 1024 - p.value) / (totalMemoryMB * 1024 * 1024)) * 100
        ),
      })),
    },
    disk: {
      used: Math.round(diskUsedGB * 100) / 100,
      total: totalDiskGB,
      percentage: Math.round(diskPercentage * 100) / 100,
    },
    bandwidth: {
      inbound: Math.round((totalInbound / (1024 * 1024)) * 100) / 100, // MB
      outbound: Math.round((totalOutbound / (1024 * 1024)) * 100) / 100, // MB
      inboundHistory: bandwidthInHistory.slice(-48).map((p) => ({
        timestamp: p.timestamp,
        value: Math.round(p.value / 1024), // KB
      })),
      outboundHistory: bandwidthOutHistory.slice(-48).map((p) => ({
        timestamp: p.timestamp,
        value: Math.round(p.value / 1024), // KB
      })),
    },
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
    },
  };

  setCache(cacheKey, metrics);
  return metrics;
}

// Parse metric history from DigitalOcean response
function parseMetricHistory(values: any[] | undefined): { timestamp: string; value: number }[] {
  if (!values || !Array.isArray(values)) return [];

  return values.map(([timestamp, value]) => ({
    timestamp: new Date(timestamp * 1000).toISOString(),
    value: parseFloat(value) || 0,
  }));
}

// Get CPU metrics with history
export async function getCpuMetrics(): Promise<{
  current: number;
  status: 'healthy' | 'warning' | 'critical';
  history: { timestamp: string; value: number }[];
} | null> {
  const metrics = await getDropletMetrics();
  if (!metrics) return null;

  return {
    current: metrics.cpu.usage,
    status: metrics.cpu.usage < 70 ? 'healthy' : metrics.cpu.usage < 90 ? 'warning' : 'critical',
    history: metrics.cpu.history,
  };
}

// Get memory metrics with history
export async function getMemoryMetrics(): Promise<{
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
  history: { timestamp: string; value: number }[];
} | null> {
  const metrics = await getDropletMetrics();
  if (!metrics) return null;

  return {
    used: metrics.memory.used,
    total: metrics.memory.total,
    percentage: metrics.memory.percentage,
    status:
      metrics.memory.percentage < 70
        ? 'healthy'
        : metrics.memory.percentage < 90
          ? 'warning'
          : 'critical',
    history: metrics.memory.history,
  };
}

// Get disk metrics
export async function getDiskMetrics(): Promise<{
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
} | null> {
  const metrics = await getDropletMetrics();
  if (!metrics) return null;

  return {
    used: metrics.disk.used,
    total: metrics.disk.total,
    percentage: metrics.disk.percentage,
    status:
      metrics.disk.percentage < 70
        ? 'healthy'
        : metrics.disk.percentage < 90
          ? 'warning'
          : 'critical',
  };
}

// Get network metrics
export async function getNetworkMetrics(): Promise<{
  inbound: number;
  outbound: number;
  inboundHistory: { timestamp: string; value: number }[];
  outboundHistory: { timestamp: string; value: number }[];
} | null> {
  const metrics = await getDropletMetrics();
  if (!metrics) return null;

  return {
    inbound: metrics.bandwidth.inbound,
    outbound: metrics.bandwidth.outbound,
    inboundHistory: metrics.bandwidth.inboundHistory,
    outboundHistory: metrics.bandwidth.outboundHistory,
  };
}

// Generate mock metrics for development/when DO API is not configured
// Uses actual Node.js process metrics where available
function getMockMetrics(): DropletMetrics {
  const now = Date.now();
  const generateHistory = (baseValue: number, variance: number) => {
    const history = [];
    for (let i = 48; i >= 0; i--) {
      const timestamp = new Date(now - i * 30 * 60 * 1000).toISOString();
      const value = baseValue + (Math.random() - 0.5) * variance;
      history.push({ timestamp, value: Math.max(0, Math.min(100, value)) });
    }
    return history;
  };

  // Get actual process metrics
  const uptimeSeconds = process.uptime();
  const memUsage = process.memoryUsage();
  const rssMB = Math.round(memUsage.rss / 1024 / 1024);

  // Estimate system memory (assuming 1GB droplet for demo purposes)
  const totalMemoryMB = 1024;
  const memoryPercentage = Math.min(95, (rssMB / totalMemoryMB) * 100 + 30); // Add baseline for OS

  // CPU is harder to get without external libs, use random realistic values
  const cpuUsage = 10 + Math.random() * 25;

  return {
    cpu: {
      usage: Math.round(cpuUsage * 100) / 100,
      history: generateHistory(cpuUsage, 15),
    },
    memory: {
      used: Math.round((memoryPercentage * totalMemoryMB) / 100),
      total: totalMemoryMB,
      percentage: Math.round(memoryPercentage * 100) / 100,
      history: generateHistory(memoryPercentage, 10),
    },
    disk: {
      used: 8.5,
      total: 25,
      percentage: 34,
    },
    bandwidth: {
      inbound: 1024 + Math.random() * 512,
      outbound: 2048 + Math.random() * 1024,
      inboundHistory: generateHistory(50, 30),
      outboundHistory: generateHistory(100, 50),
    },
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      formatted: formatUptime(uptimeSeconds),
    },
  };
}

// Get comprehensive system health
export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  droplet: DropletInfo | null;
  metrics: DropletMetrics | null;
  timestamp: string;
}> {
  const [droplet, metrics] = await Promise.all([getDropletInfo(), getDropletMetrics()]);

  // Determine overall status based on metrics
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';

  if (metrics) {
    const cpuCritical = metrics.cpu.usage >= 90;
    const memCritical = metrics.memory.percentage >= 90;
    const diskCritical = metrics.disk.percentage >= 90;

    const cpuWarning = metrics.cpu.usage >= 70;
    const memWarning = metrics.memory.percentage >= 70;
    const diskWarning = metrics.disk.percentage >= 70;

    if (cpuCritical || memCritical || diskCritical) {
      status = 'critical';
    } else if (cpuWarning || memWarning || diskWarning) {
      status = 'degraded';
    }
  }

  return {
    status,
    droplet,
    metrics,
    timestamp: new Date().toISOString(),
  };
}
