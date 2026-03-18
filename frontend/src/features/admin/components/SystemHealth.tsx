import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  CircleDot,
  RefreshCw,
  Cpu,
  Activity,
  HardDrive,
  Wifi,
  Clock,
  Database,
  Zap,
  Server,
  Users,
  FileDown,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../../../lib/api';

// Types
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    latency: number;
    stats: {
      users: number;
      courses: number;
      files: number;
      sessions: number;
      logs: number;
    };
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
    external: number;
    unit: string;
  };
  api: {
    latency: number;
    status: 'healthy' | 'degraded' | 'slow';
  };
  activity: {
    lastHour: {
      logins: number;
      errors: number;
      uploads: number;
    };
  };
  recentLogs: {
    id: string;
    action: string;
    userEmail: string | null;
    status: string | null;
    createdAt: string;
  }[];
}

interface DropletMetrics {
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

interface DropletInfo {
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

interface DropletHealth {
  status: 'healthy' | 'degraded' | 'critical';
  droplet: DropletInfo | null;
  metrics: DropletMetrics | null;
  timestamp: string;
}

interface AppLogStats {
  total: number;
  byLevel: { info: number; warn: number; error: number; debug: number };
  byHour: { hour: string; count: number; errors: number }[];
  topEndpoints: { endpoint: string; count: number }[];
  avgResponseTime: number;
  errorRate: number;
}

// Status indicator component
const StatusIndicator = ({
  value,
  thresholds = [70, 90],
}: {
  value: number;
  thresholds?: [number, number];
}) => {
  const status = value < thresholds[0] ? 'healthy' : value < thresholds[1] ? 'warning' : 'critical';
  const colors = {
    healthy: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
  };
  return <span className={`w-3 h-3 rounded-full ${colors[status]} inline-block`} />;
};

// Progress bar with color gradient
const MetricProgressBar = ({
  value,
  label,
  sublabel,
}: {
  value: number;
  label: string;
  sublabel?: string;
}) => {
  const color = value < 70 ? 'bg-emerald-500' : value < 90 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  );
};

export const SystemHealth = () => {
  const [metricsView, setMetricsView] = useState<'overview' | 'cpu' | 'memory' | 'network'>(
    'overview'
  );
  const [liveMetrics, setLiveMetrics] = useState<DropletMetrics | null>(null);
  const [_connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const eventSourceRef = useRef<EventSource | null>(null);

  // Setup EventSource for live metrics
  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');
    
    // Construct URL with token in query param (EventSource doesn't support headers)
    const url = `${apiUrl}/api/admin/metrics/live?token=${encodeURIComponent(token || '')}`;
    
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnectionState('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLiveMetrics(data);
      } catch (error) {
        console.error('Failed to parse live metrics:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Live metrics connection error:', error);
      setConnectionState('error');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Fetch basic system health (initial load only)
  const {
    data: health,
    isLoading: healthLoading,
    refetch: refetchHealth,
    isFetching: healthFetching,
  } = useQuery<SystemHealth>({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const res = await api.get('/admin/system-health');
      return res.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch DigitalOcean droplet info (static, less frequent)
  const {
    data: dropletHealth,
    isLoading: dropletLoading,
    refetch: refetchDroplet,
  } = useQuery<DropletHealth>({
    queryKey: ['admin-droplet-health'],
    queryFn: async () => {
      const res = await api.get('/admin/system/droplet');
      return res.data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Fetch app log statistics
  const { data: appLogStats } = useQuery<AppLogStats>({
    queryKey: ['admin-app-log-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/app-logs/stats');
      return res.data;
    },
    refetchInterval: 60000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-500';
      case 'degraded':
      case 'warning':
        return 'text-amber-500';
      case 'unhealthy':
      case 'critical':
      case 'slow':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
      case 'degraded':
      case 'warning':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
      case 'unhealthy':
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className={`w-6 h-6 ${getStatusColor(status)}`} />;
      case 'degraded':
      case 'warning':
        return <AlertTriangle className={`w-6 h-6 ${getStatusColor(status)}`} />;
      case 'unhealthy':
      case 'critical':
        return <XCircle className={`w-6 h-6 ${getStatusColor(status)}`} />;
      default:
        return <CircleDot className={`w-6 h-6 ${getStatusColor(status)}`} />;
    }
  };

  const handleRefresh = () => {
    refetchHealth();
    refetchDroplet();
    // Reconnect EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      setConnectionState('connecting');
    }
  };

  if (healthLoading && dropletLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading system health...
        </div>
      </div>
    );
  }

  const metrics = liveMetrics || dropletHealth?.metrics;
  const droplet = dropletHealth?.droplet;
  const memoryPercent = health
    ? Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100)
    : 0;
  const overallStatus = dropletHealth?.status || health?.status || 'unknown';

  // Format chart data
  const cpuChartData =
    metrics?.cpu.history.map((h) => ({
      time: format(new Date(h.timestamp), 'HH:mm'),
      cpu: h.value,
    })) || [];

  const memoryChartData =
    metrics?.memory.history.map((h) => ({
      time: format(new Date(h.timestamp), 'HH:mm'),
      memory: h.value,
    })) || [];

  const networkChartData =
    metrics?.bandwidth.inboundHistory.map((h, i) => ({
      time: format(new Date(h.timestamp), 'HH:mm'),
      inbound: h.value,
      outbound: metrics?.bandwidth.outboundHistory[i]?.value || 0,
    })) || [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header with Overall Status */}
      <div className={`rounded-2xl border p-4 sm:p-6 ${getStatusBgColor(overallStatus)}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {getStatusIcon(overallStatus)}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                System Health Overview
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {droplet
                  ? `${droplet.name} • ${droplet.region} • ${droplet.ipAddress}`
                  : 'Application Metrics'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Last checked:{' '}
                {health ? format(new Date(health.timestamp), 'MMM d, HH:mm:ss') : 'N/A'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="admin-segment grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-lg w-full sm:w-auto">
              {(['overview', 'cpu', 'memory', 'network'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setMetricsView(view)}
                  className={`px-2.5 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                    metricsView === view
                      ? 'admin-segment-btn-active'
                      : 'admin-segment-btn'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={healthFetching}
              className="admin-soft-chip flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow-sm hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 ${healthFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Droplet Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-3 sm:gap-4">
        {/* CPU Usage */}
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${(metrics?.cpu.usage || 0) < 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : (metrics?.cpu.usage || 0) < 90 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
              >
                <Cpu
                  className={`w-4 h-4 ${(metrics?.cpu.usage || 0) < 70 ? 'text-emerald-600 dark:text-emerald-400' : (metrics?.cpu.usage || 0) < 90 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}
                />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">CPU</span>
            </div>
            <StatusIndicator value={metrics?.cpu.usage || 0} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {(metrics?.cpu.usage || 0).toFixed(1)}%
          </p>
          {droplet && <p className="text-xs text-gray-500 mt-1">{droplet.vcpus} vCPUs</p>}
        </div>

        {/* Memory Usage */}
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${(metrics?.memory.percentage || 0) < 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : (metrics?.memory.percentage || 0) < 90 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
              >
                <Activity
                  className={`w-4 h-4 ${(metrics?.memory.percentage || 0) < 70 ? 'text-emerald-600 dark:text-emerald-400' : (metrics?.memory.percentage || 0) < 90 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}
                />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Memory</span>
            </div>
            <StatusIndicator value={metrics?.memory.percentage || 0} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {(metrics?.memory.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics?.memory.used || 0} / {metrics?.memory.total || 0} MB
          </p>
        </div>

        {/* Disk Usage */}
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${(metrics?.disk.percentage || 0) < 70 ? 'bg-emerald-100 dark:bg-emerald-900/30' : (metrics?.disk.percentage || 0) < 90 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
              >
                <HardDrive
                  className={`w-4 h-4 ${(metrics?.disk.percentage || 0) < 70 ? 'text-emerald-600 dark:text-emerald-400' : (metrics?.disk.percentage || 0) < 90 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}
                />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Disk</span>
            </div>
            <StatusIndicator value={metrics?.disk.percentage || 0} />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {(metrics?.disk.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics?.disk.used || 0} / {metrics?.disk.total || 0} GB
          </p>
        </div>

        {/* Bandwidth */}
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Wifi className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Network</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <ArrowDownRight className="w-3 h-3 text-emerald-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {(metrics?.bandwidth.inbound || 0).toFixed(1)} MB
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <ArrowUpRight className="w-3 h-3 text-blue-500" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {(metrics?.bandwidth.outbound || 0).toFixed(1)} MB
            </span>
          </div>
        </div>

        {/* Uptime */}
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {metrics?.uptime.formatted || health?.uptime.formatted || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(metrics?.uptime.seconds || health?.uptime.seconds || 0).toLocaleString()}s
          </p>
        </div>
      </div>

      {/* Charts Section */}
      {metricsView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* CPU Chart */}
          <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              CPU Usage (24h)
            </h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    name="CPU %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Memory Chart */}
          <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Memory Usage (24h)
            </h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={memoryChartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMemory)"
                    name="Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {metricsView === 'cpu' && (
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            CPU Usage Details (24h)
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cpuChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="CPU %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {metricsView === 'memory' && (
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Memory Usage Details (24h)
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  name="Memory %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {metricsView === 'network' && (
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Network Bandwidth (24h)
          </h3>
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={networkChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(v: number) => `${v} KB`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorInbound)"
                  name="Inbound (KB)"
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOutbound)"
                  name="Outbound (KB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Application & Database Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Database Health */}
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-2.5 rounded-xl ${health?.database.status === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}
            >
              <Database
                className={`w-5 h-5 ${health?.database.status === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Database</h3>
              <p
                className={`text-sm capitalize ${getStatusColor(health?.database.status || 'unknown')}`}
              >
                {health?.database.status || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Latency</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.database.latency || 0}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Users</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.database.stats.users?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Courses</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.database.stats.courses?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Files</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.database.stats.files?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* API Health */}
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`p-2.5 rounded-xl ${health?.api.status === 'healthy' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}
            >
              <Zap
                className={`w-5 h-5 ${health?.api.status === 'healthy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">API Performance</h3>
              <p
                className={`text-sm capitalize ${getStatusColor(health?.api.status || 'unknown')}`}
              >
                {health?.api.status || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Response Time</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {health?.api.latency || 0}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Avg Response</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {appLogStats?.avgResponseTime || 0}ms
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Error Rate</span>
              <span
                className={`font-medium ${(appLogStats?.errorRate || 0) > 5 ? 'text-red-500' : 'text-emerald-500'}`}
              >
                {appLogStats?.errorRate || 0}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Requests (24h)</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {appLogStats?.total?.toLocaleString() || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity (Last Hour)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {health?.activity.lastHour.logins || 0}
              </p>
              <p className="text-xs text-gray-500">Logins</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <FileDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {health?.activity.lastHour.uploads || 0}
              </p>
              <p className="text-xs text-gray-500">Uploads</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {health?.activity.lastHour.errors || 0}
              </p>
              <p className="text-xs text-gray-500">Errors</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Node.js Memory
            </h4>
            <MetricProgressBar
              value={memoryPercent}
              label="Heap Usage"
              sublabel={`${health?.memory.heapUsed || 0} / ${health?.memory.heapTotal || 0} MB`}
            />
          </div>
        </div>
      </div>

      {/* Droplet Info & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Droplet Information */}
        {droplet && (
          <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Droplet Information</h3>
                <p className="text-sm text-gray-500">{droplet.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Status</p>
                <p className="font-medium text-gray-900 dark:text-white capitalize">
                  {droplet.status}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Region</p>
                <p className="font-medium text-gray-900 dark:text-white">{droplet.region}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Size</p>
                <p className="font-medium text-gray-900 dark:text-white">{droplet.size}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">IP Address</p>
                <p className="font-medium text-gray-900 dark:text-white font-mono text-sm">
                  {droplet.ipAddress}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">vCPUs</p>
                <p className="font-medium text-gray-900 dark:text-white">{droplet.vcpus}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Memory</p>
                <p className="font-medium text-gray-900 dark:text-white">{droplet.memory} MB</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Disk</p>
                <p className="font-medium text-gray-900 dark:text-white">{droplet.disk} GB</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {format(new Date(droplet.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white/95 dark:bg-slate-900/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Admin Activity
          </h3>
          <div className="space-y-3">
            {health?.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : log.status === 'ERROR' ? 'bg-red-500' : 'bg-amber-500'}`}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-[160px]">
                    {log.userEmail || 'Unknown user'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                </span>
              </div>
            ))}
            {(!health?.recentLogs || health.recentLogs.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
