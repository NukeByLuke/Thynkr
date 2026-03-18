import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useLayout } from '@/contexts/LayoutContext';
import PageContainer from '@/components/layout/PageContainer';
import {
  User,
  Mail,
  Shield,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  subscription?: {
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

function isValidStripePortalUrl(url: string | undefined): boolean {
  if (!url) return false;

  const isStripeBillingUrl = /^https:\/\/billing\.stripe\.com\//i.test(url);
  const isDeprecatedTestLoginUrl = /\/p\/login\/test/i.test(url);

  return isStripeBillingUrl && !isDeprecatedTestLoginUrl;
}

export default function Account() {
  const { user, refetchUser } = useAuth();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // CRITICAL: Reset layout on mount
  useEffect(() => {
    setHideSidebar(false);
    setCustomHeaderContent(null);
  }, [setHideSidebar, setCustomHeaderContent]);

  // Fetch user profile with subscription
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      const data = response.data as UserProfile;
      setName(`${data.firstName || ''} ${data.lastName || ''}`.trim());
      return data;
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: { firstName?: string; lastName?: string }) => {
      const response = await api.patch('/users/me', updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      refetchUser();
      setIsEditingName(false);
    },
  });

  // Create Stripe portal session
  const createPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/stripe/create-portal-session');
      return response.data;
    },
    onSuccess: (data) => {
      if (isValidStripePortalUrl(data?.url)) {
        window.location.href = data.url;
      } else {
        toast.error('Billing portal is unavailable right now. Please try again shortly.');
      }
    },
    onError: () => {
      toast.error('Failed to open billing portal. Please try again.');
    },
  });

  const handleUpdateName = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const names = name.trim().split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ');
      updateProfileMutation.mutate({ firstName, lastName: lastName || undefined });
    }
  };

  const handleManageSubscription = () => {
    createPortalMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 dark:text-gray-400">Please try refreshing the page</p>
        </div>
      </PageContainer>
    );
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'FREE':
      case 'BASIC':
        return 'bg-gray-100 text-gray-700';
      case 'PRO':
      case 'STANDARD':
        return 'bg-blue-100 text-blue-700';
      case 'PREMIUM':
        return 'bg-brand-100 text-brand-700';
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'canceled':
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 text-red-600">
            <XCircle className="w-4 h-4" />
            Canceled
          </span>
        );
      case 'past_due':
        return (
          <span className="flex items-center gap-1 text-yellow-600">
            <AlertCircle className="w-4 h-4" />
            Past Due
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-gray-600">
            <AlertCircle className="w-4 h-4" />
            {status}
          </span>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Account - Thynkr</title>
        <meta name="description" content="Manage your Thynkr account and subscription" />
      </Helmet>

      <PageContainer>
        <PageContainer.Header
          subtitle="Manage your profile and subscription"
          actions={
            <div className="p-2 bg-gradient-to-br from-brand-600 to-accent-600 rounded-xl">
              <User className="h-6 w-6 text-white" />
            </div>
          }
        >
          Account Settings
        </PageContainer.Header>

        <div className="space-y-5 sm:space-y-6">
            {/* Profile Information */}
            <Card>
              <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:items-center">
                <User className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Profile Information
                </h2>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  {isEditingName ? (
                    <form onSubmit={handleUpdateName} className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        isLoading={updateProfileMutation.isPending}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          setIsEditingName(false);
                          setName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
                        }}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                      <p className="text-gray-900 dark:text-white break-words">
                        {`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Not set'}
                      </p>
                      <Button variant="ghost" size="sm" onClick={() => setIsEditingName(true)}>
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                    <p className="text-gray-900 dark:text-white break-all sm:break-normal">{profile.email}</p>
                    {profile.emailVerified ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                        <AlertCircle className="w-3 h-3" />
                        Not Verified
                      </span>
                    )}
                  </div>
                </div>

                {/* Member Since */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(profile.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </Card>

            {/* Membership & Subscription */}
            <Card>
              <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:items-center">
                <Shield className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Membership & Subscription
                </h2>
              </div>

              <div className="space-y-4">
                {/* Current Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Plan
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-md font-semibold ${getRoleBadgeClass(profile.role)}`}
                    >
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* Subscription Status */}
                {profile.subscription && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Subscription Status
                      </label>
                      {getSubscriptionStatusBadge(profile.subscription.status)}
                    </div>

                    {profile.subscription.currentPeriodEnd && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {profile.subscription.cancelAtPeriodEnd
                            ? 'Active Until'
                            : 'Next Billing Date'}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(profile.subscription.currentPeriodEnd).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </p>
                        {profile.subscription.cancelAtPeriodEnd && (
                          <p className="text-sm text-yellow-600 mt-1">
                            Your subscription will not renew
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Manage Subscription Button */}
                {user?.role !== 'BASIC' && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={handleManageSubscription}
                      isLoading={createPortalMutation.isPending}
                      variant="outline"
                      className="w-full sm:w-auto flex items-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      Manage Subscription
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Update payment method, view invoices, or cancel subscription
                    </p>
                  </div>
                )}

                {/* Upgrade CTA for Basic Users */}
                {user?.role === 'BASIC' && (
                  <div className="pt-4 border-t">
                    <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-lg p-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upgrade Your Plan</h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Unlock premium content and exclusive features with Pro or Premium membership
                      </p>
                      <Button
                        onClick={() => (window.location.href = '/pricing')}
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        View Plans
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800">
              <div className="mb-5 flex items-start gap-3 sm:mb-6 sm:items-center">
                <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="danger"
                    className="w-full sm:w-auto"
                    onClick={() => alert('Account deletion feature coming soon')}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </PageContainer>
      </>
    );
  }
