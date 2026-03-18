import { Bell, BellOff, MessageSquare, Clock } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { motion } from 'framer-motion';

/**
 * Notification Settings Component
 * Allows users to choose between three notification styles:
 * 1. OFF - No notifications
 * 2. BUBBLES (Mac Style) - Auto-dismiss after 5 seconds
 * 3. BANNERS - Persistent until manually dismissed
 */
export default function NotificationSettings() {
  const { notificationsEnabled, notificationsPersist, updateSettings } = useNotifications();

  // Determine current mode
  const currentMode = !notificationsEnabled 
    ? 'off' 
    : notificationsPersist 
      ? 'banners' 
      : 'bubbles';

  const handleModeChange = (mode: 'off' | 'bubbles' | 'banners') => {
    switch (mode) {
      case 'off':
        updateSettings({ notificationsEnabled: false, notificationsPersist: false });
        break;
      case 'bubbles':
        updateSettings({ notificationsEnabled: true, notificationsPersist: false });
        break;
      case 'banners':
        updateSettings({ notificationsEnabled: true, notificationsPersist: true });
        break;
    }
  };

  const modes = [
    {
      id: 'off',
      name: 'Off',
      description: 'No in-app notifications',
      icon: BellOff,
      color: 'slate',
    },
    {
      id: 'bubbles',
      name: 'Bubbles',
      description: 'macOS style • Auto-dismiss after 5s',
      icon: MessageSquare,
      color: 'blue',
    },
    {
      id: 'banners',
      name: 'Banners',
      description: 'Persistent until dismissed',
      icon: Clock,
      color: 'violet',
    },
  ] as const;

  return (
    <div className="space-y-8 sm:space-y-10">
      <section>
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white mb-1">Notification Style</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Choose how you want to see in-app notifications for achievements and level ups.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 max-w-4xl">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = currentMode === mode.id;
            
            return (
              <motion.button
                key={mode.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleModeChange(mode.id)}
                className={`
                  relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 text-left
                  ${isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                  }
                `}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="selected-mode"
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                )}

                {/* Icon */}
                <div className={`
                  w-12 h-12 rounded-lg flex items-center justify-center mb-4
                  ${isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-violet-600'
                    : 'bg-slate-100 dark:bg-slate-700'
                  }
                `}>
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'}`} />
                </div>

                {/* Content */}
                <h3 className={`mb-1 font-bold text-base sm:text-lg ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                  {mode.name}
                </h3>
                <p className={`text-sm ${isSelected ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                  {mode.description}
                </p>
              </motion.button>
            );
          })}
        </div>

        {/* Preview hint */}
        <div className="mt-6 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900 max-w-4xl">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">Preview your notification style</p>
              <p className="text-blue-700 dark:text-blue-300">
                {currentMode === 'off' && 'Notifications are disabled. You won\'t see any in-app notifications.'}
                {currentMode === 'bubbles' && 'Bubbles will appear in the top-right corner and automatically fade away after 5 seconds.'}
                {currentMode === 'banners' && 'Banners will stay visible until you manually dismiss them using the × button.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
