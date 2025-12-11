import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Users,
  BookOpen,
  CreditCard,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Crown,
  Shield,
  User as UserIcon,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Server,
  FileText,
  DollarSign,
  Clock,
  Zap,
  BarChart3,
  Filter,
  Mail,
  CreditCard as CardIcon,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Minus,
  Globe,
  Lock,
  Image,
  Download,
  Database,
  HardDrive,
  AlertCircle,
  CircleDot,
  FileDown,
  Cpu,
  Wifi,
  Activity,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// Types
interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
  emailVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
  subscription: {
    status: string;
    plan: string;
  } | null;
}

interface Stats {
  users: {
    total: number;
    basic: number;
    standard: number;
    premium: number;
  };
  content: {
    total: number;
  };
  subscriptions: {
    active: number;
  };
}

// Tab types
type TabType = 'users' | 'courses' | 'payments' | 'logs' | 'system';

// Date filter types
type DateFilter = 'today' | '7days' | '30days' | '90days' | 'all';

// Filter types
type RoleFilter = '' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
type VerificationFilter = '' | 'verified' | 'unverified';
type SubscriptionFilter = '' | 'none' | 'basic' | 'standard' | 'premium';

// Payment types
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

// Course Insights Types
type CourseCategory =
  | 'MATHEMATICS'
  | 'SCIENCE'
  | 'TECHNOLOGY'
  | 'ENGINEERING'
  | 'LANGUAGES'
  | 'HUMANITIES'
  | 'BUSINESS'
  | 'ARTS'
  | 'HEALTH'
  | 'LAW'
  | 'OTHER';
type CourseVisibility = 'PUBLIC' | 'PRIVATE';

interface CourseStats {
  summary: {
    totalCourses: number;
    publicCourses: number;
    privateCourses: number;
    publishedCourses: number;
    unpublishedCourses: number;
    totalFiles: number;
    avgFilesPerCourse: number;
    coursesThisMonth: number;
    coursesLast7Days: number;
    growthRate: number;
  };
  categoryDistribution: { category: CourseCategory; count: number }[];
}

interface CourseCreator {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  totalCourses: number;
  publicCourses: number;
  privateCourses: number;
  totalFiles: number;
  avgFilesPerCourse: number;
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  bannerImage: string | null;
  coverImage: string | null;
  category: CourseCategory;
  visibility: CourseVisibility;
  published: boolean;
  creator: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  fileCount: number;
  createdAt: string;
}

interface CourseTrends {
  monthly: { month: string; courses: number }[];
  daily: { date: string; courses: number }[];
}

// Activity Logs Types
interface AdminLog {
  id: string;
  action: string;
  details: string | null;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  ipAddress: string | null;
  status: string;
  createdAt: string;
}

interface LogsResponse {
  logs: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    actionTypes: { action: string; count: number }[];
    statusCounts: { status: string; count: number }[];
  };
}

interface LogStats {
  summary: {
    totalLogs: number;
    logsToday: number;
    logsThisWeek: number;
    logsThisMonth: number;
    errorLogs: number;
    warningLogs: number;
    successLogs: number;
  };
  charts: {
    hourly: { hour: string; count: number }[];
    daily: { date: string; count: number }[];
  };
}

// System Health Types
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

// DigitalOcean Droplet Metrics Types
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

// Tooltip Component
const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-flex">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      {show && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg whitespace-nowrap z-50">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
          </div>
        )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  tooltip,
  gradient,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltip: string;
  gradient: string;
}) => {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 ${gradient} text-white hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] transition-all`}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/20 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/20 translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
          <Tooltip content={tooltip}>
            <Info className="w-4 h-4 opacity-70 cursor-help hover:opacity-100 transition-opacity" />
          </Tooltip>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>

        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-3 text-sm">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span className="font-medium">{trendValue}</span>
            <span className="opacity-70">vs last period</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Role Badge Component
const RoleBadge = ({ role }: { role: User['role'] }) => {
  const styles = {
    ADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 ring-red-600/20',
    PREMIUM:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 ring-amber-600/20',
    STANDARD: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-600/20',
    BASIC: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 ring-gray-600/20',
  };

  const icons = {
    ADMIN: Shield,
    PREMIUM: Crown,
    STANDARD: Zap,
    BASIC: UserIcon,
  };

  const Icon = icons[role];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ring-inset ${styles[role]}`}
    >
      <Icon className="w-3 h-3" />
      {role}
    </span>
  );
};

// Subscription Badge Component
const SubscriptionBadge = ({ subscription }: { subscription: User['subscription'] }) => {
  if (!subscription) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
        <XCircle className="w-3 h-3" />
        None
      </span>
    );
  }

  const planStyles: Record<string, string> = {
    basic: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    standard: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    premium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };

  const plan = subscription.plan?.toLowerCase() || 'basic';
  const style = planStyles[plan] || planStyles.basic;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style}`}
    >
      <CardIcon className="w-3 h-3" />
      {subscription.plan}
      {subscription.status === 'active' && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      )}
    </span>
  );
};

// Tab Button Component
const TabButton = ({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
      active
        ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-md'
        : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
    }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

// Date Filter Component
const DateFilterDropdown = ({
  value,
  onChange,
}: {
  value: DateFilter;
  onChange: (value: DateFilter) => void;
}) => {
  const [open, setOpen] = useState(false);

  const options: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const currentLabel = options.find((o) => o.value === value)?.label || 'Select';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        {currentLabel}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 overflow-hidden">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    value === option.value
                      ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
    </div>
  );
};

// Filter Dropdown Component
const FilterDropdown = ({
  label,
  value,
  options,
  onChange,
  icon: Icon,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: React.ElementType;
}) => {
  const [open, setOpen] = useState(false);
  const currentLabel = options.find((o) => o.value === value)?.label || label;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          value
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {currentLabel}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute left-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 overflow-hidden">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    value === option.value
                      ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
    </div>
  );
};

// Rows Per Page Dropdown
const RowsPerPageDropdown = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) => {
  const [open, setOpen] = useState(false);
  const options = [10, 25, 50, 100];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {value} rows
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 bottom-full mb-2 w-24 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl z-20 overflow-hidden">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    value === option
                      ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
    </div>
  );
};

// Modal Component
const Modal = ({
  open,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full overflow-hidden`}
            >
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Side Panel Component
const SidePanel = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => (
  <>
    {open && (
      <>
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <div
          className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto transition-transform"
        >
          {children}
        </div>
      </>
    )}
  </>
);

// User View Panel Content
const UserViewPanel = ({
  user,
  onClose,
  onEditRole,
  onDelete,
}: {
  user: User;
  onClose: () => void;
  onEditRole: () => void;
  onDelete: () => void;
}) => {
  const fullName =
    user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'No name set';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">User Details</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" aria-label="Close user details">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold text-white">{fullName}</p>
            <p className="text-blue-100">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Role
            </p>
            <RoleBadge role={user.role} />
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Status
            </p>
            {user.emailVerified ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-4 h-4" />
                Unverified
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Account Information
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Joined</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Last Active</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.lastActiveAt
                    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-xl">
              <CardIcon className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Subscription</p>
                <div className="mt-1">
                  <SubscriptionBadge subscription={user.subscription} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Activity
          </h3>
          <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-xl text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Activity chart coming soon</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex gap-3">
          <button
            onClick={onEditRole}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            Change Role
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
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
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${colorStyles[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trendColors[trend]}`}>
            <TrendIcon className="w-4 h-4" />
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  );
};

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

// Chart colors
const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
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
      const res = await api.get('/admin/payments/recent');
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
    <div className="p-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <p className="text-blue-100 text-sm font-medium">Revenue This Month</p>
          <p className="text-3xl font-bold mt-1">
            {formatCurrency(summary?.totalRevenueThisMonth || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <p className="text-emerald-100 text-sm font-medium">Last 7 Days</p>
          <p className="text-3xl font-bold mt-1">
            {formatCurrency(summary?.totalRevenue7Days || 0)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white">
          <p className="text-purple-100 text-sm font-medium">All Time Revenue</p>
          <p className="text-3xl font-bold mt-1">
            {formatCurrency(summary?.totalRevenueAllTime || 0)}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Overview
            </h3>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setChartType('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartType('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'daily'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="h-72">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Plan Distribution
          </h3>
          <div className="h-48">
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
          <div className="flex justify-center gap-6 mt-4">
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
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
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
                recentPayments.payments.slice(0, 10).map((payment) => (
                  <tr
                    key={payment.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
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

// Category colors and labels for display
const CATEGORY_CONFIG: Record<CourseCategory, { label: string; color: string; bgColor: string }> = {
  MATHEMATICS: {
    label: 'Mathematics',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  SCIENCE: {
    label: 'Science',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  TECHNOLOGY: {
    label: 'Technology',
    color: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  ENGINEERING: {
    label: 'Engineering',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  LANGUAGES: {
    label: 'Languages',
    color: 'text-pink-700 dark:text-pink-400',
    bgColor: 'bg-pink-100 dark:bg-pink-900/30',
  },
  HUMANITIES: {
    label: 'Humanities',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  BUSINESS: {
    label: 'Business',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  ARTS: {
    label: 'Arts',
    color: 'text-rose-700 dark:text-rose-400',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  HEALTH: {
    label: 'Health',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  LAW: {
    label: 'Law',
    color: 'text-slate-700 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
  },
  OTHER: {
    label: 'Other',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
  },
};

const CATEGORY_PIE_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#a855f7',
  '#f97316',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#ef4444',
  '#64748b',
  '#6b7280',
];

// Course Insights Tab Component
const CourseInsightsTab = () => {
  const queryClient = useQueryClient();
  const [chartType, setChartType] = useState<'monthly' | 'daily'>('monthly');
  const [categoryFilter, setCategoryFilter] = useState<CourseCategory | ''>('');
  const [visibilityFilter, setVisibilityFilter] = useState<CourseVisibility | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [coursesPage, setCoursesPage] = useState(1);
  const [creatorsPage, setCreatorsPage] = useState(1);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [courseToToggle, setCourseToToggle] = useState<Course | null>(null);

  // Fetch course stats
  const { data: stats, isLoading: statsLoading } = useQuery<CourseStats>({
    queryKey: ['admin-course-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/course-stats');
      return res.data;
    },
  });

  // Fetch course trends
  const { data: trends, isLoading: trendsLoading } = useQuery<CourseTrends>({
    queryKey: ['admin-course-trends'],
    queryFn: async () => {
      const res = await api.get('/admin/course-trends');
      return res.data;
    },
  });

  // Fetch top creators
  const { data: creatorsData, isLoading: creatorsLoading } = useQuery<{
    creators: CourseCreator[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>({
    queryKey: ['admin-course-creators', creatorsPage],
    queryFn: async () => {
      const res = await api.get(`/admin/course-creators?page=${creatorsPage}&limit=10`);
      return res.data;
    },
  });

  // Fetch recent courses
  const { data: coursesData, isLoading: coursesLoading } = useQuery<{
    courses: Course[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>({
    queryKey: ['admin-recent-courses', coursesPage, categoryFilter, visibilityFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(coursesPage));
      params.append('limit', '12');
      if (categoryFilter) params.append('category', categoryFilter);
      if (visibilityFilter) params.append('visibility', visibilityFilter);
      if (searchQuery) params.append('search', searchQuery);
      const res = await api.get(`/admin/courses/recent?${params.toString()}`);
      return res.data;
    },
  });

  // Fetch selected user's courses
  const { data: userCoursesData, isLoading: userCoursesLoading } = useQuery<{
    user: { id: string; email: string; firstName: string | null; lastName: string | null };
    courses: Course[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>({
    queryKey: ['admin-user-courses', selectedCreatorId],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${selectedCreatorId}/courses?limit=50`);
      return res.data;
    },
    enabled: !!selectedCreatorId,
  });

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, visibility }: { id: string; visibility: CourseVisibility }) => {
      const res = await api.patch(`/admin/courses/${id}/visibility`, { visibility });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-creators'] });
      if (selectedCreatorId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-courses', selectedCreatorId] });
      }
      setVisibilityModalOpen(false);
      setCourseToToggle(null);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/admin/courses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recent-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-creators'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course-trends'] });
      if (selectedCreatorId) {
        queryClient.invalidateQueries({ queryKey: ['admin-user-courses', selectedCreatorId] });
      }
      setDeleteModalOpen(false);
      setCourseToDelete(null);
    },
  });

  const handleToggleVisibility = (course: Course) => {
    setCourseToToggle(course);
    setVisibilityModalOpen(true);
  };

  const confirmToggleVisibility = () => {
    if (courseToToggle) {
      const newVisibility = courseToToggle.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
      toggleVisibilityMutation.mutate({ id: courseToToggle.id, visibility: newVisibility });
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setCourseToDelete(course);
    setDeleteModalOpen(true);
  };

  const confirmDeleteCourse = () => {
    if (courseToDelete) {
      deleteCourseMutation.mutate(courseToDelete.id);
    }
  };

  // Pie chart data for categories
  const categoryPieData = useMemo(() => {
    if (!stats?.categoryDistribution) return [];
    return stats.categoryDistribution.map((c, i) => ({
      name: CATEGORY_CONFIG[c.category]?.label || c.category,
      value: c.count,
      fill: CATEGORY_PIE_COLORS[i % CATEGORY_PIE_COLORS.length],
    }));
  }, [stats?.categoryDistribution]);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          Loading course insights...
        </div>
      </div>
    );
  }

  const summary = stats?.summary;

  return (
    <div className="p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PaymentMetricCard
          title="Total Courses"
          value={String(summary?.totalCourses || 0)}
          subtitle={`${summary?.coursesThisMonth || 0} this month`}
          icon={BookOpen}
          trend={
            summary?.growthRate && summary.growthRate > 0
              ? 'up'
              : summary?.growthRate && summary.growthRate < 0
                ? 'down'
                : 'neutral'
          }
          trendValue={`${summary?.growthRate || 0}%`}
          color="blue"
        />
        <PaymentMetricCard
          title="Public Courses"
          value={String(summary?.publicCourses || 0)}
          subtitle={`${summary?.privateCourses || 0} private`}
          icon={Globe}
          color="green"
        />
        <PaymentMetricCard
          title="Avg Files per Course"
          value={String(summary?.avgFilesPerCourse || 0)}
          subtitle={`${summary?.totalFiles || 0} total files`}
          icon={FileText}
          color="purple"
        />
        <PaymentMetricCard
          title="New This Week"
          value={String(summary?.coursesLast7Days || 0)}
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Visibility Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 text-emerald-100">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Public Courses</span>
          </div>
          <p className="text-3xl font-bold mt-1">{summary?.publicCourses || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 text-amber-100">
            <Lock className="w-4 h-4" />
            <span className="text-sm font-medium">Private Courses</span>
          </div>
          <p className="text-3xl font-bold mt-1">{summary?.privateCourses || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 text-blue-100">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Published</span>
          </div>
          <p className="text-3xl font-bold mt-1">{summary?.publishedCourses || 0}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Creation Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Course Creation Trend
            </h3>
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setChartType('monthly')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'monthly'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setChartType('daily')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  chartType === 'daily'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Daily
              </button>
            </div>
          </div>

          <div className="h-72">
            {trendsLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'monthly' ? (
                  <BarChart
                    data={trends?.monthly || []}
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
                    />
                    <RechartsTooltip
                      content={({
                        active,
                        payload,
                        label,
                      }: {
                        active?: boolean;
                        payload?: { value?: number }[];
                        label?: string;
                      }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                              <p className="font-medium">{label}</p>
                              <p className="text-blue-400">{payload[0].value} courses</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="courses" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : (
                  <AreaChart
                    data={trends?.daily || []}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCourses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                    />
                    <RechartsTooltip
                      content={({
                        active,
                        payload,
                        label,
                      }: {
                        active?: boolean;
                        payload?: { value?: number }[];
                        label?: string;
                      }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                              <p className="font-medium">{label}</p>
                              <p className="text-blue-400">{payload[0].value} courses</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="courses"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCourses)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Category Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <RechartsTooltip
                  content={({
                    active,
                    payload,
                  }: {
                    active?: boolean;
                    payload?: { name?: string; value?: number }[];
                  }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
                          <p className="font-medium">{payload[0].name}</p>
                          <p className="text-blue-400">{payload[0].value} courses</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categoryPieData.slice(0, 6).map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.fill }} />
                <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {cat.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Creators Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Top Course Creators
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Click on a creator to view their courses
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Creator
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Courses
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Visibility Mix
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Files
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Avg Files/Course
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {creatorsLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading creators...
                    </div>
                  </td>
                </tr>
              ) : !creatorsData?.creators?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                    <p className="text-gray-500 dark:text-gray-400">No course creators yet</p>
                  </td>
                </tr>
              ) : (
                creatorsData.creators.map((creator, index) => (
                  <tr
                    key={creator.userId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedCreatorId(creator.userId)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                            index === 0
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                              : index === 1
                                ? 'bg-gradient-to-br from-gray-400 to-gray-500'
                                : index === 2
                                  ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
                          }`}
                        >
                          {index < 3 ? index + 1 : creator.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {creator.firstName && creator.lastName
                              ? `${creator.firstName} ${creator.lastName}`
                              : creator.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {creator.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {creator.totalCourses}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {creator.publicCourses}
                          </span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600">/</span>
                        <div className="flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {creator.privateCourses}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">{creator.totalFiles}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 dark:text-gray-400">
                        {creator.avgFilesPerCourse}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCreatorId(creator.userId);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {creatorsData && creatorsData.pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {creatorsData.pagination.page} of {creatorsData.pagination.pages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCreatorsPage((p) => Math.max(1, p - 1))}
                disabled={creatorsPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  setCreatorsPage((p) => Math.min(creatorsData.pagination.pages, p + 1))
                }
                disabled={creatorsPage >= creatorsData.pagination.pages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recent Courses Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Courses
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Browse and manage courses
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCoursesPage(1);
                  }}
                  className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value as CourseCategory | '');
                  setCoursesPage(1);
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label}
                  </option>
                ))}
              </select>

              {/* Visibility Filter */}
              <select
                value={visibilityFilter}
                onChange={(e) => {
                  setVisibilityFilter(e.target.value as CourseVisibility | '');
                  setCoursesPage(1);
                }}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Visibility</option>
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-6">
          {coursesLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
              Loading courses...
            </div>
          ) : !coursesData?.courses?.length ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">No courses found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchQuery || categoryFilter || visibilityFilter
                  ? 'Try adjusting your filters'
                  : 'Courses will appear here once created'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {coursesData.courses.map((course) => (
                <div
                  key={course.id}
                  className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:-translate-y-1 transition-transform"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 relative overflow-hidden">
                    {course.coverImage || course.bannerImage ? (
                      <img
                        src={course.coverImage || course.bannerImage || ''}
                        alt={course.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Image className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                      </div>
                    )}
                    {/* Visibility Badge */}
                    <div
                      className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        course.visibility === 'PUBLIC'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {course.visibility === 'PUBLIC' ? (
                        <Globe className="w-3 h-3" />
                      ) : (
                        <Lock className="w-3 h-3" />
                      )}
                      {course.visibility}
                    </div>
                  </div>

                  <div className="p-4">
                    <h4
                      className="font-semibold text-gray-900 dark:text-white truncate"
                      title={course.title}
                    >
                      {course.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {course.description || 'No description'}
                    </p>

                    <div className="flex items-center gap-2 mt-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_CONFIG[course.category]?.bgColor} ${CATEGORY_CONFIG[course.category]?.color}`}
                      >
                        {CATEGORY_CONFIG[course.category]?.label || course.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {course.fileCount}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(course.createdAt), 'MMM d, yyyy')}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleVisibility(course)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
                          title={`Make ${course.visibility === 'PUBLIC' ? 'Private' : 'Public'}`}
                        >
                          {course.visibility === 'PUBLIC' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Globe className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete course"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {coursesData && coursesData.pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(coursesPage - 1) * 12 + 1} to{' '}
                {Math.min(coursesPage * 12, coursesData.pagination.total)} of{' '}
                {coursesData.pagination.total} courses
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCoursesPage((p) => Math.max(1, p - 1))}
                  disabled={coursesPage === 1}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setCoursesPage((p) => Math.min(coursesData.pagination.pages, p + 1))
                  }
                  disabled={coursesPage >= coursesData.pagination.pages}
                  className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Courses Side Panel */}
      <SidePanel open={!!selectedCreatorId} onClose={() => setSelectedCreatorId(null)}>
        {selectedCreatorId && userCoursesData && (
          <div>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedCreatorId(null)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white pr-10">
                Courses by{' '}
                {userCoursesData.user.firstName || userCoursesData.user.email.split('@')[0]}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {userCoursesData.user.email} • {userCoursesData.pagination.total} courses
              </p>
            </div>
            <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {userCoursesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : !userCoursesData?.courses?.length ? (
                <div className="text-center py-12 text-gray-500">No courses found</div>
              ) : (
                userCoursesData.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"
                  >
                    <div className="w-16 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                      {course.coverImage || course.bannerImage ? (
                        <img
                          src={course.coverImage || course.bannerImage || ''}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Image className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white truncate">
                        {course.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            course.visibility === 'PUBLIC'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {course.visibility}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {course.fileCount} files
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleVisibility(course)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        {course.visibility === 'PUBLIC' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </SidePanel>

      {/* Toggle Visibility Modal */}
      <Modal open={visibilityModalOpen} onClose={() => setVisibilityModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
              {courseToToggle?.visibility === 'PUBLIC' ? (
                <Lock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              ) : (
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Change Visibility
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Make this course {courseToToggle?.visibility === 'PUBLIC' ? 'private' : 'public'}?
              </p>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-6">
            <p className="font-medium text-gray-900 dark:text-white">{courseToToggle?.title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Current: {courseToToggle?.visibility} → New:{' '}
              {courseToToggle?.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setVisibilityModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmToggleVisibility}
              disabled={toggleVisibilityMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {toggleVisibilityMutation.isPending ? 'Updating...' : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete Course</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 mb-6 border border-red-100 dark:border-red-900/30">
            <p className="font-medium text-red-800 dark:text-red-400">{courseToDelete?.title}</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              This will permanently delete the course and all {courseToDelete?.fileCount || 0}{' '}
              associated files.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmDeleteCourse}
              disabled={deleteCourseMutation.isPending}
              className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deleteCourseMutation.isPending ? 'Deleting...' : 'Delete Course'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ============ ACTIVITY LOGS TAB ============
const ActivityLogsTab = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [chartType, setChartType] = useState<'hourly' | 'daily'>('daily');

  // Fetch logs
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch,
  } = useQuery<LogsResponse>({
    queryKey: ['admin-logs', page, searchQuery, actionFilter, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/logs', {
        params: {
          page,
          limit: 20,
          ...(searchQuery && { search: searchQuery }),
          ...(actionFilter && { action: actionFilter }),
          ...(statusFilter && { status: statusFilter }),
        },
      });
      return res.data;
    },
  });

  // Fetch log stats
  const { data: logStats } = useQuery<LogStats>({
    queryKey: ['admin-log-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/logs/stats');
      return res.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'WARNING':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'ERROR':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'ERROR':
        return <XCircle className="w-3.5 h-3.5" />;
      default:
        return <CircleDot className="w-3.5 h-3.5" />;
    }
  };

  const handleExport = async (exportFormat: 'json' | 'csv') => {
    try {
      const res = await api.get('/admin/logs/export', {
        params: { format: exportFormat },
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: exportFormat === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const summary = logStats?.summary;
  const charts = logStats?.charts;

  return (
    <div className="p-6 space-y-6">
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
                          {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
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

// ============ SYSTEM HEALTH TAB ============
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

const SystemHealthTab = () => {
  const [metricsView, setMetricsView] = useState<'overview' | 'cpu' | 'memory' | 'network'>(
    'overview'
  );

  // Fetch basic system health
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
    refetchInterval: 30000,
  });

  // Fetch DigitalOcean droplet metrics
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
    refetchInterval: 30000,
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

  const metrics = dropletHealth?.metrics;
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
    <div className="p-6 space-y-6">
      {/* Header with Overall Status */}
      <div className={`rounded-2xl border p-6 ${getStatusBgColor(overallStatus)}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {getStatusIcon(overallStatus)}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
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
          <div className="flex items-center gap-3">
            <div className="flex gap-1 p-1 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              {(['overview', 'cpu', 'memory', 'network'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setMetricsView(view)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                    metricsView === view
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              disabled={healthFetching}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${healthFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Droplet Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* CPU Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(metrics?.cpu.usage || 0).toFixed(1)}%
          </p>
          {droplet && <p className="text-xs text-gray-500 mt-1">{droplet.vcpus} vCPUs</p>}
        </div>

        {/* Memory Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(metrics?.memory.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics?.memory.used || 0} / {metrics?.memory.total || 0} MB
          </p>
        </div>

        {/* Disk Usage */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
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
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(metrics?.disk.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {metrics?.disk.used || 0} / {metrics?.disk.total || 0} GB
          </p>
        </div>

        {/* Bandwidth */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Uptime</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics?.uptime.formatted || health?.uptime.formatted || 'N/A'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {(metrics?.uptime.seconds || health?.uptime.seconds || 0).toLocaleString()}s
          </p>
        </div>
      </div>

      {/* Charts Section */}
      {metricsView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              CPU Usage (24h)
            </h3>
            <div className="h-64">
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Memory Usage (24h)
            </h3>
            <div className="h-64">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            CPU Usage Details (24h)
          </h3>
          <div className="h-80">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Memory Usage Details (24h)
          </h3>
          <div className="h-80">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Network Bandwidth (24h)
          </h3>
          <div className="h-80">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Database Health */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity (Last Hour)</h3>
          <div className="grid grid-cols-3 gap-3">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Droplet Information */}
        {droplet && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Server className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Droplet Information</h3>
                <p className="text-sm text-gray-500">{droplet.name}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Admin Activity
          </h3>
          <div className="space-y-3">
            {health?.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full ${log.status === 'SUCCESS' ? 'bg-emerald-500' : log.status === 'ERROR' ? 'bg-red-500' : 'bg-amber-500'}`}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-500 truncate max-w-[120px]">
                    {log.userEmail}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
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

// Main Admin Component
export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [dateFilter, setDateFilter] = useState<DateFilter>('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [newRole, setNewRole] = useState<User['role']>('BASIC');

  // Filters
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('');
  const [verificationFilter, setVerificationFilter] = useState<VerificationFilter>('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionFilter>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Queries
  const { data: stats } = useQuery<Stats>({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data;
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: User[] }>({
    queryKey: ['admin-users', searchQuery],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: searchQuery ? { search: searchQuery } : {},
      });
      return res.data;
    },
  });

  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    let users = usersData?.users || [];

    // Apply role filter
    if (roleFilter) {
      users = users.filter((u) => u.role === roleFilter);
    }

    // Apply verification filter
    if (verificationFilter === 'verified') {
      users = users.filter((u) => u.emailVerified);
    } else if (verificationFilter === 'unverified') {
      users = users.filter((u) => !u.emailVerified);
    }

    // Apply subscription filter
    if (subscriptionFilter) {
      if (subscriptionFilter === 'none') {
        users = users.filter((u) => !u.subscription);
      } else {
        users = users.filter((u) => u.subscription?.plan?.toLowerCase() === subscriptionFilter);
      }
    }

    return users;
  }, [usersData?.users, roleFilter, verificationFilter, subscriptionFilter]);

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  // Mutations
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await api.patch(`/admin/users/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setRoleModalOpen(false);
      setSelectedUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.delete(`/admin/users/${userId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setDeleteModalOpen(false);
      setViewPanelOpen(false);
      setSelectedUser(null);
    },
  });

  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewPanelOpen(true);
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setViewPanelOpen(false);
    setRoleModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setViewPanelOpen(false);
    setDeleteModalOpen(true);
  };

  const clearFilters = () => {
    setRoleFilter('');
    setVerificationFilter('');
    setSubscriptionFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = roleFilter || verificationFilter || subscriptionFilter;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Manage your platform and monitor activity</p>
            </div>
            <DateFilterDropdown value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 lg:px-16 -mt-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.users.total ?? '-'}
            icon={Users}
            trend="up"
            trendValue="+12%"
            tooltip="Total registered users on the platform"
            gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard
            title="Premium Users"
            value={stats?.users.premium ?? '-'}
            icon={Crown}
            trend="up"
            trendValue="+8%"
            tooltip="Users with premium subscriptions"
            gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          <StatCard
            title="Standard Users"
            value={stats?.users.standard ?? '-'}
            icon={Zap}
            trend="neutral"
            trendValue="0%"
            tooltip="Users with standard tier access"
            gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          <StatCard
            title="Basic Users"
            value={stats?.users.basic ?? '-'}
            icon={UserIcon}
            trend="down"
            trendValue="-3%"
            tooltip="Free tier users"
            gradient="bg-gradient-to-br from-gray-500 to-gray-600"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-1.5 mb-6 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            <TabButton
              active={activeTab === 'users'}
              icon={Users}
              label="User Management"
              onClick={() => setActiveTab('users')}
            />
            <TabButton
              active={activeTab === 'courses'}
              icon={BookOpen}
              label="Course Insights"
              onClick={() => setActiveTab('courses')}
            />
            <TabButton
              active={activeTab === 'payments'}
              icon={CreditCard}
              label="Payments"
              onClick={() => setActiveTab('payments')}
            />
            <TabButton
              active={activeTab === 'logs'}
              icon={FileText}
              label="Logs"
              onClick={() => setActiveTab('logs')}
            />
            <TabButton
              active={activeTab === 'system'}
              icon={Server}
              label="System Health"
              onClick={() => setActiveTab('system')}
            />
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {activeTab === 'users' && (
              <div>
                {/* Search and Filters */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <FilterDropdown
                        label="Role"
                        value={roleFilter}
                        onChange={(v) =>
                          handleFilterChange(setRoleFilter as (v: string) => void, v)
                        }
                        icon={Shield}
                        options={[
                          { value: '', label: 'All Roles' },
                          { value: 'ADMIN', label: 'Admin' },
                          { value: 'PREMIUM', label: 'Premium' },
                          { value: 'STANDARD', label: 'Standard' },
                          { value: 'BASIC', label: 'Basic' },
                        ]}
                      />
                      <FilterDropdown
                        label="Status"
                        value={verificationFilter}
                        onChange={(v) =>
                          handleFilterChange(setVerificationFilter as (v: string) => void, v)
                        }
                        icon={CheckCircle2}
                        options={[
                          { value: '', label: 'All Status' },
                          { value: 'verified', label: 'Verified' },
                          { value: 'unverified', label: 'Unverified' },
                        ]}
                      />
                      <FilterDropdown
                        label="Subscription"
                        value={subscriptionFilter}
                        onChange={(v) =>
                          handleFilterChange(setSubscriptionFilter as (v: string) => void, v)
                        }
                        icon={CardIcon}
                        options={[
                          { value: '', label: 'All Plans' },
                          { value: 'none', label: 'No Plan' },
                          { value: 'basic', label: 'Basic' },
                          { value: 'standard', label: 'Standard' },
                          { value: 'premium', label: 'Premium' },
                        ]}
                      />
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {paginatedUsers.length} of {filteredUsers.length} users
                    {hasActiveFilters && ` (filtered from ${usersData?.users.length || 0} total)`}
                  </div>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-900/50">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Subscription
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Active
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {usersLoading ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                              Loading users...
                            </div>
                          </td>
                        </tr>
                      ) : paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : '-'}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user.email}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <RoleBadge role={user.role} />
                            </td>
                            <td className="px-6 py-4">
                              <SubscriptionBadge subscription={user.subscription} />
                            </td>
                            <td className="px-6 py-4">
                              {user.emailVerified ? (
                                <span className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
                                  <AlertTriangle className="w-4 h-4" />
                                  Unverified
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {format(new Date(user.createdAt), 'MMM d, yyyy')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {user.lastActiveAt
                                  ? formatDistanceToNow(new Date(user.lastActiveAt), {
                                      addSuffix: true,
                                    })
                                  : '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-1">
                                <Tooltip content="View Details">
                                  <button
                                    onClick={() => handleView(user)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Change Role">
                                  <button
                                    onClick={() => handleEditRole(user)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-amber-600 dark:hover:text-amber-400"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete User">
                                  <button
                                    onClick={() => handleDelete(user)}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-red-600 dark:hover:text-red-400"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <RowsPerPageDropdown
                        value={rowsPerPage}
                        onChange={(v) => {
                          setRowsPerPage(v);
                          setCurrentPage(1);
                        }}
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'courses' && (
              <div>
                <CourseInsightsTab />
              </div>
            )}

            {activeTab === 'payments' && (
              <div>
                <PaymentAnalyticsTab />
              </div>
            )}

            {activeTab === 'logs' && (
              <div>
                <ActivityLogsTab />
              </div>
            )}

            {activeTab === 'system' && (
              <div>
                <SystemHealthTab />
              </div>
            )}
        </div>
      </div>

      {/* User View Side Panel */}
      <SidePanel open={viewPanelOpen} onClose={() => setViewPanelOpen(false)}>
        {selectedUser && (
          <UserViewPanel
            user={selectedUser}
            onClose={() => setViewPanelOpen(false)}
            onEditRole={() => handleEditRole(selectedUser)}
            onDelete={() => handleDelete(selectedUser)}
          />
        )}
      </SidePanel>

      {/* Change Role Modal */}
      <Modal open={roleModalOpen} onClose={() => setRoleModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change User Role
            </h3>
            <button
              onClick={() => setRoleModalOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                <p className="text-sm text-gray-500 dark:text-gray-400">User</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedUser.email}</p>
                <div className="mt-2">
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as User['role'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BASIC">Basic</option>
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setRoleModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    selectedUser &&
                    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole })
                  }
                  disabled={updateRoleMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
            Delete User
          </h3>

          {selectedUser && (
            <>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-2">
                Are you sure you want to delete this user?
              </p>
              <p className="text-center font-medium text-gray-900 dark:text-white mb-6 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
                {selectedUser.email}
              </p>
              <p className="text-center text-sm text-red-600 dark:text-red-400 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
                  disabled={deleteUserMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
