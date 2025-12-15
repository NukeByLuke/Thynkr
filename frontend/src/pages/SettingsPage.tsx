import { lazy, Suspense, memo } from 'react';
import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import SettingsLayout from '@/layouts/SettingsLayout';
import { Loader2 } from 'lucide-react';

// Lazy load settings components for better code splitting
const GeneralSettings = lazy(() => import('@/components/settings/GeneralSettings'));
const ProfileSettings = lazy(() => import('@/components/settings/ProfileSettings'));
const BillingSettings = lazy(() => import('@/components/settings/BillingSettings'));
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings'));

// Loading fallback component
const SettingsLoading = memo(function SettingsLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );
});

const SettingsPage = memo(function SettingsPage() {
  return (
    <>
      <Helmet>
        <title>Settings - Thynkr</title>
        <meta name="description" content="Manage your Thynkr account settings and preferences" />
      </Helmet>

      <PageContainer>
        <SettingsLayout>
          {(activeTab) => (
            <Suspense fallback={<SettingsLoading />}>
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'billing' && <BillingSettings />}
              {activeTab === 'notifications' && <NotificationSettings />}
            </Suspense>
          )}
        </SettingsLayout>
      </PageContainer>
    </>
  );
});

export default SettingsPage;
