import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  DollarSign,
  Users,
  TrendingDown,
  User as UserIcon,
  Crown,
  Zap,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Types
interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'SUCCEEDED' | 'FAILED' | 'PENDING' | 'REFUNDED';
  planType: 'STANDARD' | 'PREMIUM';
  billingCycle: 'MONTHLY' | 'YEARLY';
  description: string;
  createdAt: string;
}

interface PaymentAnalytics {
  summary: {
    totalRevenueAllTime: number;
    totalRevenueThisMonth: number;
    totalRevenue7Days: number;
    mrr: number;
    churnRate: number;
    arpu: number;
    revenueGrowth: number;
    activeSubscriptions: number;
    canceledLast30Days: number;
    newSubscriptions7Days: number;
  };
  charts: {
    monthly: { month: string; revenue: number }[];
    daily: { date: string; revenue: number }[];
    planDistribution: { standard: number; premium: number };
  };
}

// Payment Status Badge
const PaymentStatusBadge = ({ status }: { status: Payment['status'] }) => {
  const styles = {
    SUCCEEDED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    REFUNDED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  const icons = {
    SUCCEEDED: CheckCircle2,
    FAILED: XCircle,
    PENDING: RefreshCw,
    REFUNDED: ArrowDownRight,
  };

  const Icon = icons[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status]}`}
    >
      <Icon className="w-3 h-3" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
};

// Payment Metric Card
const PaymentMetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) => {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  const trendColors = {
    up: 'text-emerald-600 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="admin-surface rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 sm:p-2.5 rounded-xl ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[trend]}`}>
            <TrendIcon className="w-4 h-4" />
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
};

// Chart colors
const CHART_COLORS = {
  primary: '#3b82f6',
};

const PIE_COLORS = ['#3b82f6', '#f59e0b'];

// Custom Chart Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
        <p className="font-medium">{label}</p>
        <p className="text-emerald-400">${payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

// Payment Analytics Tab Component
const PaymentAnalyticsTab = () => {
  const [chartType, setChartType] = useState<'monthly' | 'daily'>('monthly');

  const { data: analytics, isLoading: analyticsLoading } = useQuery<PaymentAnalytics>({
    queryKey: ['admin-payment-analytics'],
    queryFn: async () => {
      const res = await api.get('/admin/payments/analytics');
      return res.data;
    },
  });

  const { data: recentPayments, isLoading: paymentsLoading } = useQuery<{ payments: Payment[] }>({
    queryKey: ['admin-recent-payments'],
    queryFn: async () => {
      const res = await api.get('/admin/payments/recent', {
        params: { page: 1, limit: 200 },
      });
      return res.data;
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDecimal = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading payment analytics...
        </div>
      </div>
    );
  }

  const summary = analytics?.summary;
  const charts = analytics?.charts;

  const pieData = charts?.planDistribution
    ? [
        { name: 'Standard', value: charts.planDistribution.standard },
        { name: 'Premium', value: charts.planDistribution.premium },
      ]
    : [];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <PaymentMetricCard
          title="Monthly Recurring Revenue"
          value={formatCurrency(summary?.mrr || 0)}
          icon={DollarSign}
          trend={
            summary?.revenueGrowth && summary.revenueGrowth > 0
              ? 'up'
              : summary?.revenueGrowth && summary.revenueGrowth < 0
                ? 'down'
                : 'neutral'
          }
          trendValue={`${summary?.revenueGrowth || 0}%`}
          color="green"
        />
        <PaymentMetricCard
          title="Active Subscriptions"
          value={String(summary?.activeSubscriptions || 0)}
          subtitle={`+${summary?.newSubscriptions7Days || 0} this week`}
          icon={Users}
          trend="up"
          trendValue={`${summary?.newSubscriptions7Days || 0} new`}
          color="blue"
        />
        <PaymentMetricCard
          title="Churn Rate"
          value={`${summary?.churnRate || 0}%`}
          subtitle={`${summary?.canceledLast30Days || 0} canceled (30d)`}
          icon={TrendingDown}
          trend={summary?.churnRate && summary.churnRate > 5 ? 'down' : 'up'}
          trendValue={summary?.churnRate && summary.churnRate > 5 ? 'High' : 'Low'}
          color={summary?.churnRate && summary.churnRate > 5 ? 'red' : 'green'}
        />
        <PaymentMetricCard
          title="Avg Revenue Per User"
          value={formatCurrencyDecimal(summary?.arpu || 0)}
          icon={UserIcon}
          color="purple"
        />
      </div>

      {/* Revenue Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 sm:p-5 text-white">
          <p className="text-blue-100 text-sm font-medium">Revenue This Month</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">
            {formatCurrency(summary?.totalRevenueThisMonth || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 sm:p-5 text-white">
          <p className="text-emerald-100 text-sm font-medium">Last 7 Days</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">
            {formatCurrency(summary?.totalRevenue7Days || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 sm:p-5 text-white">
          <p className="text-purple-100 text-sm font-medium">All Time Revenue</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">
            {formatCurrency(summary?.totalRevenueAllTime || 0)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Revenue Chart */}
        <div className="admin-surface lg:col-span-2 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Overview
            </h3>
            <div className="admin-segment grid grid-cols-2 gap-1 p-1 rounded-lg w-full sm:w-auto">
              <button
                onClick={() => setChartType('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'monthly'
                    ? 'admin-segment-btn-active'
                    : 'admin-segment-btn'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartType('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'daily'
                    ? 'admin-segment-btn-active'
                    : 'admin-segment-btn'
                }`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'monthly' ? (
                <BarChart
                  data={charts?.monthly || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart
                  data={charts?.daily || []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="admin-surface rounded-2xl p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
            Plan Distribution
          </h3>
          <div className="h-44 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 sm:gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Premium</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="admin-surface rounded-2xl overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-rose-200/60 dark:border-cyan-400/20">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
        </div>

        <div className="sm:hidden divide-y divide-rose-100 dark:divide-slate-700">
          {paymentsLoading ? (
            <div className="px-4 py-8 text-center text-gray-500">
              <div className="inline-flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Loading...
              </div>
            </div>
          ) : !recentPayments?.payments?.length ? (
            <div className="px-4 py-10 text-center">
              <DollarSign className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No payments yet</p>
            </div>
          ) : (
            recentPayments.payments.map((payment) => (
              <div key={payment.id} className="px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {payment.userEmail}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrencyDecimal(payment.amount / 100)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      payment.planType === 'PREMIUM'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}
                  >
                    {payment.planType === 'PREMIUM' ? (
                      <Crown className="w-3 h-3" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    {payment.planType}
                    <span className="opacity-60">({payment.billingCycle?.toLowerCase() || 'monthly'})</span>
                  </span>
                  <PaymentStatusBadge status={payment.status} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="admin-table-head">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-100 dark:divide-slate-700">
              {paymentsLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : !recentPayments?.payments?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No payments yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Payments will appear here once users subscribe
                    </p>
                  </td>
                </tr>
              ) : (
                recentPayments.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-rose-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                          {payment.userEmail[0].toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {payment.userEmail}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          payment.planType === 'PREMIUM'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}
                      >
                        {payment.planType === 'PREMIUM' ? (
                          <Crown className="w-3 h-3" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}
                        {payment.planType}
                        <span className="opacity-60">({payment.billingCycle.toLowerCase()})</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrencyDecimal(payment.amount / 100)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { PaymentAnalyticsTab as PaymentAnalytics };
export default PaymentAnalyticsTab;
