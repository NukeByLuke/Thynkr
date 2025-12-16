import { useState } from 'react';
import {
  Info,
  TrendingUp,
  TrendingDown,
  Shield,
  Crown,
  Zap,
  User as UserIcon,
  XCircle,
  Calendar,
  ChevronDown,
  CreditCard as CardIcon,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

// Type imports
type UserRole = 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
type UserSubscription = {
  status: string;
  plan: string;
} | null;

type DateFilter = 'today' | '7days' | '30days' | '90days' | 'all';

// Tooltip Component
export const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => {
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
export const StatCard = ({
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
    <div
      className={`relative overflow-hidden rounded-2xl p-6 ${gradient} text-white hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.15)] transition-all`}
    >
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
export const RoleBadge = ({ role }: { role: UserRole }) => {
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
export const SubscriptionBadge = ({ subscription }: { subscription: UserSubscription }) => {
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
export const TabButton = ({
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
export const DateFilterDropdown = ({
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
export const FilterDropdown = ({
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
export const RowsPerPageDropdown = ({
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
export const Modal = ({
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-2xl ${sizeClasses[size]} w-full overflow-hidden`}
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
export const SidePanel = ({
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto transition-transform">
          {children}
        </div>
      </>
    )}
  </>
);

// User View Panel Component
export const UserViewPanel = ({
  user,
  onClose,
  onEditRole,
  onDelete,
}: {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: UserRole;
    emailVerified: boolean;
    createdAt: string;
    lastActiveAt?: string;
    subscription: UserSubscription;
  };
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
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close user details"
          >
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

        {/* Subscription Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Subscription
          </h3>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <SubscriptionBadge subscription={user.subscription} />
          </div>
        </div>

        {/* Account Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Account Information
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.lastActiveAt && (
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Active</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(user.lastActiveAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
        <button
          onClick={onEditRole}
          className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
        >
          Change Role
        </button>
        <button
          onClick={onDelete}
          className="w-full px-4 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
        >
          Delete User
        </button>
      </div>
    </div>
  );
};
