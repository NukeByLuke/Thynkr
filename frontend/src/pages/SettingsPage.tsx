import { useState, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Bell, CreditCard, ChevronRight } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy load settings components
const GeneralSettings = lazy(() => import('@/components/settings/GeneralSettings'));
const ProfileSettings = lazy(() => import('@/components/settings/ProfileSettings'));
const BillingSettings = lazy(() => import('@/components/settings/BillingSettings'));
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings'));

type TabId = 'general' | 'profile' | 'billing' | 'notifications';

const tabs = [
  { id: 'general' as TabId, label: 'General', icon: Settings, description: 'Appearance & language' },
  { id: 'profile' as TabId, label: 'Profile', icon: User, description: 'Personal details & avatar' },
  { id: 'notifications' as TabId, label: 'Notifications', icon: Bell, description: 'Email & push alerts' },
  { id: 'billing' as TabId, label: 'Billing', icon: CreditCard, description: 'Plan & payment methods' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  return (
    <>
      <Helmet>
        <title>Settings - Thynkr</title>
      </Helmet>

      <PageContainer>
        <div className="max-w-6xl mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Manage your account preferences and study experience.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation */}
            <nav className="w-full lg:w-72 flex-shrink-0 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group text-left border ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div
                          className={`font-semibold text-sm ${
                            isActive
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {tab.label}
                        </div>
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Content Area */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden"
                >
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-24">
                        <LoadingSpinner size="lg" />
                      </div>
                    }
                  >
                    <div className="p-6 md:p-8">
                        {activeTab === 'general' && <GeneralSettings />}
                        {activeTab === 'profile' && <ProfileSettings />}
                        {activeTab === 'billing' && <BillingSettings />}
                        {activeTab === 'notifications' && <NotificationSettings />}
                    </div>
                  </Suspense>
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
