import { Helmet } from 'react-helmet-async';
import PageContainer from '@/components/layout/PageContainer';
import SettingsLayout from '@/layouts/SettingsLayout';
import GeneralSettings from '@/components/settings/GeneralSettings';
import ProfileSettings from '@/components/settings/ProfileSettings';
import BillingSettings from '@/components/settings/BillingSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';

export default function SettingsPage() {
  return (
    <>
      <Helmet>
        <title>Settings - Thynkr</title>
        <meta name="description" content="Manage your Thynkr account settings and preferences" />
      </Helmet>

      <PageContainer>
        <SettingsLayout>
          {(activeTab) => {
            switch (activeTab) {
              case 'general':
                return <GeneralSettings />;
              case 'profile':
                return <ProfileSettings />;
              case 'billing':
                return <BillingSettings />;
              case 'notifications':
                return <NotificationSettings />;
              default:
                return <GeneralSettings />;
            }
          }}
        </SettingsLayout>
      </PageContainer>
    </>
  );
}
