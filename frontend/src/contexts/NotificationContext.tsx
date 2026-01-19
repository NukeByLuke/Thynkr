/**
 * Notification Context
 * macOS-style notification system for achievements, level ups, and other events
 * 
 * Notification Modes:
 * - OFF: notificationsEnabled = false
 * - BUBBLES (Mac Style): notificationsEnabled = true, notificationsPersist = false (Auto-dismiss after 5s)
 * - BANNERS (Persistent): notificationsEnabled = true, notificationsPersist = true (Manual dismiss only)
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Zap, Award, Star } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

export type NotificationType = 'achievement' | 'levelup' | 'info' | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number; // ms, 0 for persistent
  tierColor?: string; // For achievement notifications
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
  notificationsEnabled: boolean;
  notificationsPersist: boolean;
  updateSettings: (settings: { notificationsEnabled?: boolean; notificationsPersist?: boolean }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch notification settings from backend
  const { data: settings } = useQuery({
    queryKey: ['notification-settings'],
    queryFn: async () => {
      const response = await api.get('/users/me/notifications');
      return response.data as { notificationsEnabled: boolean; notificationsPersist: boolean };
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { notificationsEnabled?: boolean; notificationsPersist?: boolean }) => {
      const response = await api.patch('/users/me/notifications', newSettings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
    },
  });

  const notificationsEnabled = settings?.notificationsEnabled ?? true;
  const notificationsPersist = settings?.notificationsPersist ?? false;

  const updateSettings = useCallback((newSettings: { notificationsEnabled?: boolean; notificationsPersist?: boolean }) => {
    if (isAuthenticated) {
      updateSettingsMutation.mutate(newSettings);
    }
  }, [isAuthenticated, updateSettingsMutation]);

  // Show notification helper
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    if (!notificationsEnabled) return;

    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notificationsPersist ? 0 : (notification.duration ?? 5000), // 0 = persistent, else 5s default
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto-dismiss if not persistent (Bubbles mode)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, newNotification.duration);
    }
  }, [notificationsEnabled, notificationsPersist]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Listen for API notifications (achievements, level ups)
  useEffect(() => {
    const handleApiNotification = (event: CustomEvent<{ notifications: any[] }>) => {
      if (!notificationsEnabled) return;

      const { notifications: apiNotifications } = event.detail;

      apiNotifications.forEach((apiNotif) => {
        if (apiNotif.type === 'achievement') {
          const tierColors: Record<string, string> = {
            BRONZE: 'from-orange-500 to-amber-600',
            SILVER: 'from-slate-400 to-zinc-500',
            GOLD: 'from-yellow-400 to-amber-500',
            RUBY: 'from-red-500 to-pink-600',
            DIAMOND: 'from-cyan-400 to-blue-500',
          };

          showNotification({
            type: 'achievement',
            title: `Achievement Unlocked: ${apiNotif.achievementName}`,
            message: `${apiNotif.tier} Tier • +${apiNotif.xpAwarded} XP`,
            icon: <Trophy className="w-5 h-5" />,
            tierColor: tierColors[apiNotif.tier] || 'from-blue-500 to-violet-600',
          });
        } else if (apiNotif.type === 'levelup') {
          showNotification({
            type: 'levelup',
            title: 'Level Up!',
            message: `You've reached Level ${apiNotif.newLevel}`,
            icon: <Zap className="w-5 h-5" />,
          });
        }
      });
    };

    window.addEventListener('api-notification', handleApiNotification as EventListener);
    return () => {
      window.removeEventListener('api-notification', handleApiNotification as EventListener);
    };
  }, [notificationsEnabled, showNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification,
        clearAll,
        notificationsEnabled,
        notificationsPersist,
        updateSettings,
      }}
    >
      {children}
      <NotificationStack
        notifications={notifications}
        onDismiss={dismissNotification}
        persist={notificationsPersist}
      />
    </NotificationContext.Provider>
  );
};

// macOS-style notification stack in top-right corner
const NotificationStack: React.FC<{
  notifications: Notification[];
  onDismiss: (id: string) => void;
  persist: boolean;
}> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 pointer-events-none" style={{ maxWidth: '400px' }}>
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Individual notification card
const NotificationCard: React.FC<{
  notification: Notification;
  onDismiss: (id: string) => void;
}> = ({ notification, onDismiss }) => {
  const getIcon = () => {
    if (notification.icon) return notification.icon;
    switch (notification.type) {
      case 'achievement':
        return <Trophy className="w-5 h-5" />;
      case 'levelup':
        return <Zap className="w-5 h-5" />;
      case 'success':
        return <Award className="w-5 h-5" />;
      default:
        return <Star className="w-5 h-5" />;
    }
  };

  const getGradient = () => {
    if (notification.tierColor) return notification.tierColor;
    switch (notification.type) {
      case 'achievement':
        return 'from-blue-500 to-violet-600';
      case 'levelup':
        return 'from-yellow-400 to-orange-500';
      case 'success':
        return 'from-green-500 to-emerald-600';
      default:
        return 'from-slate-500 to-zinc-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="pointer-events-auto"
    >
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden backdrop-blur-lg">
        {/* Gradient accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${getGradient()}`} />

        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center text-white shadow-lg`}>
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
              {notification.title}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {notification.message}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={() => onDismiss(notification.id)}
            className="flex-shrink-0 w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationContext;
