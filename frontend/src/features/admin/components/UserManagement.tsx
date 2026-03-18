import { useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Shield,
  CheckCircle2,
  CreditCard as CardIcon,
  X,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

type RoleFilter = '' | 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ADMIN';
type VerificationFilter = '' | 'verified' | 'unverified';
type SubscriptionFilter = '' | 'none' | 'basic' | 'standard' | 'premium';

interface UserManagementProps {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  roleFilter: RoleFilter;
  setRoleFilter: (value: RoleFilter) => void;
  verificationFilter: VerificationFilter;
  setVerificationFilter: (value: VerificationFilter) => void;
  subscriptionFilter: SubscriptionFilter;
  setSubscriptionFilter: (value: SubscriptionFilter) => void;
  currentPage: number;
  setCurrentPage: (value: number) => void;
  rowsPerPage: number;
  setRowsPerPage: (value: number) => void;
  onView: (user: User) => void;
  onEditRole: (user: User) => void;
  onDelete: (user: User) => void;
  RoleBadge: React.ComponentType<{ role: User['role'] }>;
  SubscriptionBadge: React.ComponentType<{ subscription: User['subscription'] }>;
  FilterDropdown: React.ComponentType<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    icon?: React.ElementType;
  }>;
  RowsPerPageDropdown: React.ComponentType<{
    value: number;
    onChange: (value: number) => void;
  }>;
  Tooltip: React.ComponentType<{ children: React.ReactNode; content: string }>;
}

export const UserManagement = ({
  users,
  isLoading,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  verificationFilter,
  setVerificationFilter,
  subscriptionFilter,
  setSubscriptionFilter,
  currentPage,
  setCurrentPage,
  rowsPerPage,
  setRowsPerPage,
  onView,
  onEditRole,
  onDelete,
  RoleBadge,
  SubscriptionBadge,
  FilterDropdown,
  RowsPerPageDropdown,
  Tooltip,
}: UserManagementProps) => {
  // Filtered and paginated users
  const filteredUsers = useMemo(() => {
    let filtered = users || [];

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    // Apply verification filter
    if (verificationFilter === 'verified') {
      filtered = filtered.filter((u) => u.emailVerified);
    } else if (verificationFilter === 'unverified') {
      filtered = filtered.filter((u) => !u.emailVerified);
    }

    // Apply subscription filter
    if (subscriptionFilter) {
      if (subscriptionFilter === 'none') {
        filtered = filtered.filter((u) => !u.subscription);
      } else {
        filtered = filtered.filter((u) => u.subscription?.plan?.toLowerCase() === subscriptionFilter);
      }
    }

    return filtered;
  }, [users, roleFilter, verificationFilter, subscriptionFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [filteredUsers, currentPage, rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages, setCurrentPage]);

  const handleFilterChange = (setter: (value: string) => void, value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setRoleFilter('');
    setVerificationFilter('');
    setSubscriptionFilter('');
    setCurrentPage(1);
  };

  const hasActiveFilters = roleFilter || verificationFilter || subscriptionFilter;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Search and filters */}
      <div className="admin-surface rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-input w-full pl-10 pr-4 py-2.5 rounded-xl transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <FilterDropdown
              label="Role"
              value={roleFilter}
              onChange={(v) => handleFilterChange(setRoleFilter as (v: string) => void, v)}
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
          </div>
        </div>

        <div className="admin-faint flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <p>
            Showing {paginatedUsers.length} of {filteredUsers.length} users
            {hasActiveFilters && ` (filtered from ${users.length} total)`}
          </p>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100/70 dark:hover:bg-red-900/25 transition-colors self-start sm:self-auto"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop / tablet table */}
      <div className="admin-surface hidden md:block rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead>
              <tr className="admin-table-head">
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
            <tbody className="divide-y divide-rose-100/80 dark:divide-slate-700">
              {isLoading ? (
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
                    className="hover:bg-rose-50/50 dark:hover:bg-slate-800/50 transition-colors"
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
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
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
                          ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Tooltip content="View Details">
                          <button
                            onClick={() => onView(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Change Role">
                          <button
                            onClick={() => onEditRole(user)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-amber-600 dark:hover:text-amber-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete User">
                          <button
                            onClick={() => onDelete(user)}
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
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Loading users...
            </div>
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="admin-surface rounded-2xl py-12 text-center text-gray-500 dark:text-gray-400">
            No users found
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <div
              key={user.id}
              className="admin-surface rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 dark:text-white truncate">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : 'No Name'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-rose-100 dark:border-slate-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Role</span>
                  <RoleBadge role={user.role} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subscription</span>
                  <SubscriptionBadge subscription={user.subscription} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      Unverified
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Joined</span>
                  <span className="text-gray-900 dark:text-white">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Last Active</span>
                  <span className="text-gray-900 dark:text-white">
                    {user.lastActiveAt
                      ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                      : '-'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-rose-100 dark:border-slate-700">
                <button
                  onClick={() => onView(user)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
                <button
                  onClick={() => onEditRole(user)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(user)}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="admin-surface rounded-2xl px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <RowsPerPageDropdown
              value={rowsPerPage}
              onChange={(v) => {
                setRowsPerPage(v);
                setCurrentPage(1);
              }}
            />
            <span className="text-sm admin-faint">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-rose-200/80 dark:border-cyan-400/20 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="hidden sm:flex items-center gap-1">
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
                        ? 'bg-gradient-to-r from-fuchsia-600 to-orange-500 dark:from-cyan-500 dark:to-blue-500 text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-rose-200/80 dark:border-cyan-400/20 text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
