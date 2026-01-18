/**
 * Notification Context
 * macOS-style notification system for achievements, level ups, and other events
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Zap, Award, Star } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
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
  const [queue, setQueue] = useState<Notification[]>([]);
  const [localEnabled, setLocalEnabled] = useState(true);
  const [localPersist, setLocalPersist] = useState(false);

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

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { notificationsEnabled?: boolean; notificationsPersist?: boolean }) => {
      const response = await api.patch('/users/me/notifications', newSettings);
      return response.data;
    },
  });

  const notificationsEnabled = settings?.notificationsEnabled ?? localEnabled;
  const notificationsPersist = settings?.notificationsPersist ?? localPersist;

  const updateSettings = useCallback((newSettings: { notificationsEnabled?: boolean; notificationsPersist?: boolean }) => {
    if (newSettings.notificationsEnabled !== undefined) {
      setLocalEnabled(newSettings.notificationsEnabled);
    }
    if (newSettings.notificationsPersist !== undefined) {
      setLocalPersist(newSettings.notificationsPersist);
    }
    if (isAuthenticated) {
      updateSettingsMutation.mutate(newSettings);
    }
  }, [isAuthenticated, updateSettingsMutation]);

  // Listen for API notifications
  useEffect(() => {
    const handleApiNotification = (event: CustomEvent<{ notifications: any[] }>) => {
      const { notifications: apiNotifications } = event.detail;
      
      apiNotifications.forEach((apiNotif) => {
        if (apiNotif.type === 'achievement') {
          const tierColors: Record<string, string> = {
            BRONZE: 'bg-gradient-to-br from-amber-600 to-orange-700',
            SILVER: 'bg-gradient-to-br from-slate-300 to-slate-500',
            GOLD: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
            RUBY: 'bg-gradient-to-br from-red-500 to-rose-700',
            DIAMOND: 'bg-gradient-to-br from-cyan-400 to-blue-600',
          };

          showNotification({
            type: 'achievement',
            title: `Achievement Unlocked!`,
            message: `${apiNotif.achievementName} - ${apiNotif.newTier} tier (+${apiNotif.xpAwarded} XP)`,
            tierColor: tierColors[apiNotif.newTier as string] || tierColors.BRONZE,
          });

          // If also leveled up, show that too
          if (apiNotif.leveledUp) {
            showNotification({
              type: 'levelup',
              title: 'Level Up!',
              message: `You've reached level ${apiNotif.newLevel}!`,
            });
          }
        }
      });
    };

    window.addEventListener('api-notification' as any, handleApiNotification);
    return () => window.removeEventListener('api-notification' as any, handleApiNotification);
  }, []);

  // Clear queue when notifications are disabled
  useEffect(() => {
    if (!notificationsEnabled) {
      setQueue([]);
      setNotifications([]);
    }
  }, [notificationsEnabled]);

  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    if (!notificationsEnabled) return;

    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      duration: notificationsPersist ? 0 : (notification.duration ?? 5000),
    };

    setQueue((prev) => [...prev, newNotification]);
  }, [notificationsEnabled, notificationsPersist]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setQueue([]);
  }, []);

  // Process queue - show one notification at a time
  useEffect(() => {
    if (queue.length > 0 && notifications.length === 0) {
      const [nextNotification, ...remainingQueue] = queue;
      setNotifications([nextNotification]);
      setQueue(remainingQueue);

      // Auto-dismiss if duration is set
      if (nextNotification.duration && nextNotification.duration > 0) {
        const timeout = setTimeout(() => {
          dismissNotification(nextNotification.id);
        }, nextNotification.duration);
        return () => clearTimeout(timeout);
      }
    }
  }, [queue, notifications, dismissNotification]);

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
      <NotificationDisplay notifications={notifications} onDismiss={dismissNotification} />
    </NotificationContext.Provider>
  );
};

// macOS-style notification display component
const NotificationDisplay: React.FC<{
  notifications: Notification[];
  onDismiss: (id: string) => void;
}> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <AnimatePresence mode="sync">
        {notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
};

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

  const getColors = () => {
    if (notification.tierColor) {
      return {
        iconBg: notification.tierColor,
        border: notification.tierColor.replace('from-', 'from-').replace('to-', 'to-'),
      };
    }

    switch (notification.type) {
      case 'achievement':
        return {
          iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-600',
          border: 'border-yellow-500/30',
        };
      case 'levelup':
        return {
          iconBg: 'bg-gradient-to-br from-violet-400 to-purple-600',
          border: 'border-violet-500/30',
        };
      case 'success':
        return {
          iconBg: 'bg-gradient-to-br from-green-400 to-emerald-600',
          border: 'border-green-500/30',
        };
      default:
        return {
          iconBg: 'bg-gradient-to-br from-blue-400 to-indigo-600',
          border: 'border-blue-500/30',
        };
    }
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className="pointer-events-auto mb-3"
    >
      <div
        className={`
          relative w-[380px] rounded-2xl
          bg-white/95 dark:bg-slate-800/95
          backdrop-blur-xl
          border ${colors.border}
          shadow-2xl shadow-black/20
          overflow-hidden
        `}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 pointer-events-none" />
        
        {/* Content */}
        <div className="relative p-4 flex items-start gap-3">
          {/* Icon */}
          <div
            className={`
              flex-shrink-0 w-12 h-12 rounded-xl
              ${colors.iconBg}
              flex items-center justify-center
              text-white shadow-lg
            `}
          >
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {notification.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {notification.message}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={() => onDismiss(notification.id)}
            className="
              flex-shrink-0 w-7 h-7 rounded-lg
              flex items-center justify-center
              text-slate-400 hover:text-slate-600
              dark:text-slate-500 dark:hover:text-slate-300
              hover:bg-slate-100 dark:hover:bg-slate-700/50
              transition-colors
            "
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress bar for auto-dismiss */}
        {notification.duration && notification.duration > 0 && (
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: notification.duration / 1000, ease: 'linear' }}
            className={`h-1 ${colors.iconBg} origin-left`}
          />
        )}
      </div>
    </motion.div>
  );
};
