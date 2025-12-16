import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format as formatDate, formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../../../lib/api';

// Types
interface AdminLog {
  id: number;
  action: string;
  userId: number | null;
  userEmail: string | null;
  userRole: string | null;
  ipAddress: string | null;
  details: string | null;
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAt: string;
}

interface LogsResponse {
  logs: AdminLog[];
  pagination: {
    page: number;
    total: number;
    pages: number;
  };
  filters: {
    actionTypes: Array<{ action: string; count: number }>;
  };
}

interface LogStats {
  summary: {
    totalLogs: number;
    successLogs: number;
    warningLogs: number;
    errorLogs: number;
  };
  charts: {
    hourly: Array<{ hour: string; count: number }>;
    daily: Array<{ date: string; count: number }>;
  };
}

export const ActivityLogs = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [chartType, setChartType] = useState<'hourly' | 'daily'>('hourly');

  // Fetch logs
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch,
  } = useQuery<LogsResponse>({
    queryKey: ['admin-logs', page, searchQuery, actionFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(actionFilter && { action: actionFilter }),
        ...(statusFilter && { status: statusFilter }),
      });
      const response = await api.get(`/admin/logs?${params}`);
      return response.data;
    },
  });

  // Fetch log stats
  const { data: statsData } = useQuery<LogStats>({
    queryKey: ['admin-log-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/logs/stats');
      return response.data;
    },
  });

  const { summary, charts } = statsData || { summary: null, charts: null };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'WARNING':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'ERROR':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    const iconClass = 'w-3 h-3';
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className={iconClass} />;
      case 'WARNING':
        return <AlertTriangle className={iconClass} />;
      case 'ERROR':
        return <XCircle className={iconClass} />;
      default:
        return null;
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    if (!logsData) return;

    let content: string;
    let mimeType: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(logsData.logs, null, 2);
      mimeType = 'application/json';
      filename = `admin-logs-${new Date().toISOString()}.json`;
    } else {
      // CSV
      const headers = ['ID', 'Timestamp', 'Action', 'User', 'Role', 'IP', 'Status', 'Details'];
      const rows: string[][] = logsData.logs.map((log) => [
        `${log.id}`,
        formatDate(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        `${log.action}`,
        log.userEmail || '',
        log.userRole || '',
        log.ipAddress || '',
        `${log.status}`,
        log.details || '',
      ]);
      content = [headers, ...rows].map((row) => row.join(',')).join('\n');
      mimeType = 'text/csv';
      filename = `admin-logs-${new Date().toISOString()}.csv`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.totalLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.successLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.warningLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.errorLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Overview</h3>
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setChartType('hourly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'hourly'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setChartType('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'daily'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartType === 'hourly' ? charts?.hourly : charts?.daily}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey={chartType === 'hourly' ? 'hour' : 'date'}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
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
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActivity)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs</h3>
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 pr-4 py-2 w-48 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500"
                />
              </div>
              {/* Action Filter */}
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white"
              >
                <option value="">All Actions</option>
                {logsData?.filters.actionTypes.map((a) => (
                  <option key={a.action} value={a.action}>
                    {a.action.replace(/_/g, ' ')} ({a.count})
                  </option>
                ))}
              </select>
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white"
              >
                <option value="">All Status</option>
                <option value="SUCCESS">Success</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
              </select>
              {/* Refresh */}
              <button
                onClick={() => refetch()}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              {/* Export */}
              <div className="relative group">
                <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleExport('json')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {logsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logsData?.logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatDate(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {log.userEmail || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.userRole && (
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              log.userRole === 'ADMIN'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : log.userRole === 'PREMIUM'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {log.userRole}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {log.ipAddress || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
                        >
                          {getStatusIcon(log.status)}
                          {log.status}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3 max-w-xs truncate text-sm text-gray-500 dark:text-gray-400"
                        title={log.details || ''}
                      >
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsData && logsData.pagination.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, logsData.pagination.total)}{' '}
                  of {logsData.pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {logsData.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(logsData.pagination.pages, page + 1))}
                    disabled={page === logsData.pagination.pages}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
