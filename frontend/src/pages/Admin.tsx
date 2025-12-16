import { useState, lazy, Suspense } from 'react';
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-6xl mx-auto px-8 lg:px-16 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-blue-100 mt-1">Manage your platform and monitor activity</p>
            </div>
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
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-sm">
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
        <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20">
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
        <div className="p-6">
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
        <div className="p-6">
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
