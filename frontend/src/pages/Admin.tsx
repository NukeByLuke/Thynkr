import { useMemo, useState, lazy, Suspense } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

// Import types
import type {
  User,
  Stats,
  TabType,
  RoleFilter,
  VerificationFilter,
  SubscriptionFilter,
} from '../features/admin/types';

// Import utility components
import {
  Tooltip,
  RoleBadge,
  SubscriptionBadge,
  TabButton,
  FilterDropdown,
  RowsPerPageDropdown,
  Modal,
  SidePanel,
  UserViewPanel,
  StatCard,
} from '../features/admin/components/AdminUtilities';

// Lazy load admin tab components for better initial load performance
const PaymentAnalytics = lazy(() => import('../features/admin/components/PaymentAnalytics'));
const CourseInsights = lazy(() => import('../features/admin/components/CourseInsights'));
const ActivityLogs = lazy(() => import('../features/admin/components/ActivityLogs'));
const SystemHealth = lazy(() => import('../features/admin/components/SystemHealth'));
const UserManagement = lazy(() => import('../features/admin/components/UserManagement'));

import {
  Users,
  BookOpen,
  CreditCard,
  Server,
  FileText,
  AlertTriangle,
  X,
  Crown,
  Zap,
  User as UserIcon,
} from 'lucide-react';

// Main Admin Component
export default function Admin() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('users');
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

  const tabItems = useMemo(
    () => [
      {
        id: 'users' as const,
        icon: Users,
        label: 'User Management',
        shortLabel: 'Users',
        description: 'Search users, manage roles, and review verification states.',
      },
      {
        id: 'courses' as const,
        icon: BookOpen,
        label: 'Course Insights',
        shortLabel: 'Courses',
        description: 'Track creation trends, visibility mix, and creator performance.',
      },
      {
        id: 'payments' as const,
        icon: CreditCard,
        label: 'Payments',
        shortLabel: 'Payments',
        description: 'Monitor subscription revenue, plan distribution, and payment history.',
      },
      {
        id: 'logs' as const,
        icon: FileText,
        label: 'Logs',
        shortLabel: 'Logs',
        description: 'Review admin activity and export operational event history.',
      },
      {
        id: 'system' as const,
        icon: Server,
        label: 'System Health',
        shortLabel: 'System',
        description: 'Watch infrastructure health, service latency, and resource usage.',
      },
    ],
    []
  );

  const activeTabMeta = tabItems.find((tab) => tab.id === activeTab);

  const formatStorage = (bytes?: number) => {
    const value = Number(bytes || 0);
    if (value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let index = 0;

    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }

    const rounded = size >= 10 ? Math.round(size) : Number(size.toFixed(1));
    return `${rounded} ${units[index]}`;
  };

  return (
    <div className="admin-shell">
      <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-5 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Hero */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 text-transparent bg-clip-text">
              Platform Administration
            </h1>
            <p className="text-gray-500 mt-1 dark:text-gray-400">
              Manage users, payments, and system health
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Operational
          </div>
        </div>

        {/* Stat Cards */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total Users"
            value={stats?.users.total ?? '-'}
            icon={Users}
            trend="up"
            trendValue="+12%"
            tooltip="Total registered users on the platform"
            gradient="bg-gradient-to-br from-cyan-500 via-blue-500 to-blue-600"
          />
          <StatCard
            title="Premium Users"
            value={stats?.users.premium ?? '-'}
            icon={Crown}
            trend="up"
            trendValue="+8%"
            tooltip="Users with premium subscriptions"
            gradient="bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600"
          />
          <StatCard
            title="Standard Users"
            value={stats?.users.standard ?? '-'}
            icon={Zap}
            trend="neutral"
            trendValue="0%"
            tooltip="Users with standard tier access"
            gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
          />
          <StatCard
            title="Basic Users"
            value={stats?.users.basic ?? '-'}
            icon={UserIcon}
            trend="down"
            trendValue="-3%"
            tooltip="Free tier users"
            gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-600"
          />
          <StatCard
            title="Daily Active Users"
            value={stats?.activity?.dau ?? '-'}
            icon={Users}
            trend="neutral"
            trendValue="24h"
            tooltip="Users active in the last 24 hours"
            gradient="bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600"
          />
          <StatCard
            title="Weekly Active Users"
            value={stats?.activity?.wau ?? '-'}
            icon={Users}
            trend="neutral"
            trendValue="7d"
            tooltip="Users active in the last 7 days"
            gradient="bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-600"
          />
          <StatCard
            title="Study Sessions (7d)"
            value={stats?.activity?.sessions7d ?? '-'}
            icon={Server}
            trend="neutral"
            trendValue={`${stats?.activity?.avgSessionsPerWeeklyUser ?? 0}/user`}
            tooltip="Total study sessions in the last 7 days"
            gradient="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600"
          />
          <StatCard
            title="Files Uploaded (7d)"
            value={stats?.files?.uploaded7d ?? '-'}
            icon={FileText}
            trend="neutral"
            trendValue={formatStorage(stats?.files?.totalStorageBytes)}
            tooltip="Files uploaded in the last 7 days and total storage used"
            gradient="bg-gradient-to-br from-rose-500 via-fuchsia-500 to-purple-600"
          />
        </div>

        {/* Tabs Navigation */}
        <div className="admin-tab-track mt-5 rounded-2xl p-2 sm:p-2.5 overflow-x-auto">
          <div className="flex w-max sm:w-full gap-2">
            {tabItems.map((tab) => (
              <TabButton
                key={tab.id}
                active={activeTab === tab.id}
                icon={tab.icon}
                label={tab.label}
                shortLabel={tab.shortLabel}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="admin-surface-strong mt-4 rounded-3xl backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="admin-surface-header px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="admin-title text-base sm:text-lg font-semibold">
              {activeTabMeta?.label || 'Admin'}
            </h2>
            <p className="admin-faint mt-1 text-xs sm:text-sm">
              {activeTabMeta?.description}
            </p>
          </div>
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16 sm:py-20">
                <div className="flex items-center gap-2 admin-faint">
                  <div className="w-5 h-5 border-2 border-fuchsia-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              </div>
            }
          >
            {activeTab === 'users' && (
              <UserManagement
                users={usersData?.users || []}
                isLoading={usersLoading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                verificationFilter={verificationFilter}
                setVerificationFilter={setVerificationFilter}
                subscriptionFilter={subscriptionFilter}
                setSubscriptionFilter={setSubscriptionFilter}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                rowsPerPage={rowsPerPage}
                setRowsPerPage={setRowsPerPage}
                onView={handleView}
                onEditRole={handleEditRole}
                onDelete={handleDelete}
                RoleBadge={RoleBadge}
                SubscriptionBadge={SubscriptionBadge}
                FilterDropdown={FilterDropdown}
                RowsPerPageDropdown={RowsPerPageDropdown}
                Tooltip={Tooltip}
              />
            )}

            {activeTab === 'courses' && <CourseInsights />}

            {activeTab === 'payments' && <PaymentAnalytics />}

            {activeTab === 'logs' && <ActivityLogs />}

            {activeTab === 'system' && <SystemHealth />}
          </Suspense>
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
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Change User Role
            </h3>
            <button
              onClick={() => setRoleModalOpen(false)}
              className="p-2 hover:bg-white/50 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">User</p>
                <p className="font-medium text-slate-900 dark:text-white">{selectedUser.email}</p>
                <div className="mt-2">
                  <RoleBadge role={selectedUser.role} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as User['role'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300/50 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    selectedUser &&
                    updateRoleMutation.mutate({ userId: selectedUser.id, role: newRole })
                  }
                  disabled={updateRoleMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
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
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-center text-slate-900 dark:text-white mb-2">
            Delete User
          </h3>

          {selectedUser && (
            <>
              <p className="text-center text-slate-600 dark:text-slate-400 mb-2">
                Are you sure you want to delete this user?
              </p>
              <p className="text-center font-medium text-slate-900 dark:text-white mb-6 p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-white/10">
                {selectedUser.email}
              </p>
              <p className="text-center text-sm text-red-600 dark:text-red-400 mb-6">
                This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 font-medium hover:bg-white/50 dark:hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => selectedUser && deleteUserMutation.mutate(selectedUser.id)}
                  disabled={deleteUserMutation.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-medium hover:from-red-700 hover:to-red-600 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
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
