import { useState } from 'react';
import { motion } from 'framer-motion';
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-700 rounded-lg shadow-lg whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
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
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  tooltip: string;
  gradient?: string;
}) => {
  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{value}</h3>
            {trend && trendValue && (
              <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                {trendValue}
              </span>
            )}
          </div>
        </div>
        <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300`}>
          <Icon className="w-5 h-5" />
        </div>
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
  shortLabel,
  onClick,
}: {
  active: boolean;
  icon: React.ElementType;
  label: string;
  shortLabel?: string;
  onClick: () => void;
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`relative inline-flex min-w-[8.5rem] sm:min-w-0 items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
      active
        ? 'admin-tab-active'
        : 'admin-tab-idle'
    }`}
  >
    <Icon
      className={`w-4 h-4 ${
        active ? 'drop-shadow-[0_0_6px_rgba(236,72,153,0.5)] dark:drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]' : ''
      }`}
    />
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden">{shortLabel || label}</span>
  </motion.button>
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
        className="admin-select flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:border-fuchsia-300 dark:hover:border-cyan-400/40 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        {currentLabel}
        <ChevronDown
          className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 admin-surface rounded-xl shadow-xl z-20 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50/80 dark:hover:bg-slate-800 transition-colors ${
                  value === option.value
                    ? 'text-pink-600 dark:text-cyan-300 font-medium bg-rose-100/60 dark:bg-cyan-500/10'
                    : 'text-slate-700 dark:text-slate-300'
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
        className={`inline-flex h-10 items-center gap-2 px-3 rounded-lg text-sm font-medium transition-colors ${
          value
            ? 'bg-rose-100 text-pink-600 dark:bg-cyan-500/15 dark:text-cyan-300'
            : 'admin-soft-chip text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
        }`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {currentLabel}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 sm:right-auto sm:left-0 mt-2 min-w-[10rem] max-w-[14rem] admin-surface rounded-xl shadow-xl z-20 overflow-hidden">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50/80 dark:hover:bg-slate-800 transition-colors ${
                  value === option.value
                    ? 'text-pink-600 dark:text-cyan-300 font-medium bg-rose-100/60 dark:bg-cyan-500/10'
                    : 'text-slate-700 dark:text-slate-300'
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
        className="admin-soft-chip inline-flex h-9 items-center gap-2 px-3 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
      >
        {value} rows
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 bottom-full mb-2 w-24 admin-surface rounded-xl shadow-xl z-20 overflow-hidden">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-rose-50/80 dark:hover:bg-slate-800 transition-colors ${
                  value === option
                    ? 'text-pink-600 dark:text-cyan-300 font-medium bg-rose-100/60 dark:bg-cyan-500/10'
                    : 'text-slate-700 dark:text-slate-300'
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`admin-surface-strong backdrop-blur-xl rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-auto`}
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
        <div className="fixed right-0 top-0 h-[100dvh] w-full sm:max-w-lg bg-white/95 dark:bg-slate-950/90 border-l border-rose-200/70 dark:border-cyan-400/20 shadow-2xl z-50 overflow-y-auto">
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
      <div className="p-4 sm:p-6 border-b border-cyan-400/20 bg-gradient-to-r from-pink-600 via-rose-500 to-orange-500 dark:from-cyan-500 dark:via-blue-500 dark:to-violet-500">
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
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
            {(user.firstName?.[0] || user.email[0]).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-lg sm:text-xl font-semibold text-white truncate">{fullName}</p>
            <p className="text-blue-100 text-sm truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="admin-soft-chip p-4 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Role
            </p>
            <RoleBadge role={user.role} />
          </div>
          <div className="admin-soft-chip p-4 rounded-xl">
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
          <div className="admin-soft-chip p-4 rounded-xl">
            <SubscriptionBadge subscription={user.subscription} />
          </div>
        </div>

        {/* Account Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
            Account Information
          </h3>
          <div className="space-y-2">
            <div className="admin-soft-chip flex justify-between items-center p-3 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            {user.lastActiveAt && (
              <div className="admin-soft-chip flex justify-between items-center p-3 rounded-lg">
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
      <div className="p-4 sm:p-6 border-t border-rose-200/60 dark:border-cyan-400/20 space-y-2.5 bg-white/80 dark:bg-slate-950/72 backdrop-blur-sm">
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
