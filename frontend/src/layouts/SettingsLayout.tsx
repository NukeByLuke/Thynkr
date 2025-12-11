import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings as SettingsIcon, CreditCard, Bell } from 'lucide-react';

export type SettingsTab = 'general' | 'profile' | 'billing' | 'notifications';

interface SettingsLayoutProps {
  children: (activeTab: SettingsTab) => ReactNode;
}

const tabs = [
  { id: 'general' as SettingsTab, label: 'General', icon: SettingsIcon },
  { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
  { id: 'billing' as SettingsTab, label: 'Billing', icon: CreditCard },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white mb-2">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Manage your account preferences and study defaults.
        </p>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar Navigation */}
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Panel Area */}
        <div className="min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children(activeTab)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
