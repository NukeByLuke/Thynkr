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

  const activityChartData =
    chartType === 'hourly'
      ? (charts?.hourly ?? []).map((item) => ({
          label: item.hour,
          count: item.count,
        }))
      : (charts?.daily ?? []).map((item) => ({
          label: formatDate(new Date(item.date), 'MMM d'),
          count: item.count,
        }));

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Logs</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.totalLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.successLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.warningLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="admin-surface rounded-2xl p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-xl">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {summary?.errorLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="admin-surface rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Overview</h3>
          <div className="admin-segment grid grid-cols-2 gap-1 p-1 rounded-lg w-full sm:w-auto">
            <button
              onClick={() => setChartType('hourly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'hourly'
                  ? 'admin-segment-btn-active'
                  : 'admin-segment-btn'
              }`}
            >
              24 Hours
            </button>
            <button
              onClick={() => setChartType('daily')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                chartType === 'daily'
                  ? 'admin-segment-btn-active'
                  : 'admin-segment-btn'
              }`}
            >
              14 Days
            </button>
          </div>
        </div>
        <div className="h-56 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activityChartData}
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
                dataKey="label"
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
      <div className="admin-surface rounded-2xl overflow-hidden">
        {/* Table Header with Filters */}
        <div className="p-4 sm:p-5 border-b border-rose-200/60 dark:border-cyan-400/20 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Logs</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => refetch()}
                className="admin-soft-chip p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>
              <button
                onClick={() => handleExport('json')}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-600 to-orange-500 dark:from-cyan-500 dark:to-blue-500 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="admin-soft-chip inline-flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_180px] gap-2 sm:gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="admin-input w-full pl-9 pr-4 py-2 rounded-lg text-sm"
              />
            </div>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="admin-select w-full px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Actions</option>
              {logsData?.filters.actionTypes.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.action.replace(/_/g, ' ')} ({a.count})
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="admin-select w-full px-3 py-2 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {logsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="md:hidden divide-y divide-rose-100 dark:divide-slate-700">
              {!logsData?.logs.length ? (
                <div className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                  No activity logs found
                </div>
              ) : (
                logsData.logs.map((log) => (
                  <div key={log.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {log.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(new Date(log.createdAt), 'MMM d, HH:mm:ss')} ·{' '}
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}
                      >
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      <p>
                        <span className="text-gray-500 dark:text-gray-400">User:</span>{' '}
                        {log.userEmail || '—'}
                      </p>
                      <p>
                        <span className="text-gray-500 dark:text-gray-400">Role:</span>{' '}
                        {log.userRole || '—'}
                      </p>
                      <p className="font-mono">
                        <span className="text-gray-500 dark:text-gray-400 font-sans">IP:</span>{' '}
                        {log.ipAddress || '—'}
                      </p>
                    </div>
                    {log.details && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{log.details}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="admin-table-head">
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
                <tbody className="divide-y divide-rose-100 dark:divide-slate-700">
                  {!logsData?.logs.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    logsData.logs.map((log) => (
                      <tr key={log.id} className="hover:bg-rose-50/50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2.5 py-1 bg-rose-100/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium">
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logsData && logsData.pagination.pages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, logsData.pagination.total)}{' '}
                  of {logsData.pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg admin-soft-chip disabled:opacity-50 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">
                    Page {page} of {logsData.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(logsData.pagination.pages, page + 1))}
                    disabled={page === logsData.pagination.pages}
                    className="p-2 rounded-lg admin-soft-chip disabled:opacity-50 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
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
