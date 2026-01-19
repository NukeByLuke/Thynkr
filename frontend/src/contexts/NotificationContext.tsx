/**
 * Notification Context
 * macOS-style notification system for achievements, level ups, and other events
 * 
 * Notification Modes:
 * - OFF: notificationsEnabled = false
 * - BUBBLES (Mac Style): notificationsEnabled = true, notificationsPersist = false (Auto-dismiss after 5s)
 * - BANNERS (Persistent): notificationsEnabled = true, notificationsPersist = true (Manual dismiss only)
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Zap, Clock, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

export type NotificationType = 'achievement' | 'levelup' | 'info' | 'success';
export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'RUBY' | 'DIAMOND';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  tier?: AchievementTier;
  xp?: number;
  duration?: number; // ms, 0 for persistent
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  snoozeNotification: (id: string) => void;
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
  // Queue holds all pending notifications; activeNotification is the one currently shown
  const [queue, setQueue] = useState<Notification[]>([]);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const autoHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Show next notification from queue
  useEffect(() => {
    if (!activeNotification && queue.length > 0) {
      const [next, ...rest] = queue;
      setActiveNotification(next);
      setQueue(rest);
    }
  }, [activeNotification, queue]);

  // Auto-dismiss timer for non-persistent notifications
  useEffect(() => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    if (activeNotification && !notificationsPersist) {
      autoHideTimer.current = setTimeout(() => {
        setActiveNotification(null);
      }, 5000);
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [activeNotification, notificationsPersist]);

  // Add notification to queue
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    if (!notificationsEnabled) return;

    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
    };

    setQueue((prev) => [...prev, newNotification]);
  }, [notificationsEnabled]);

  const dismissNotification = useCallback(() => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    setActiveNotification(null);
  }, []);

  const snoozeNotification = useCallback(() => {
    if (!activeNotification) return;
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
    // Move to end of queue
    setQueue((prev) => [...prev, activeNotification]);
    setActiveNotification(null);
  }, [activeNotification]);

  const clearAll = useCallback(() => {
    setQueue([]);
    setActiveNotification(null);
  }, []);

  // Listen for API notifications (achievements, level ups)
  useEffect(() => {
    const handleApiNotification = (event: CustomEvent<{ notifications: any[] }>) => {
      if (!notificationsEnabled) return;

      const { notifications: apiNotifications } = event.detail;

      apiNotifications.forEach((apiNotif) => {
        if (apiNotif.type === 'achievement') {
          showNotification({
            type: 'achievement',
            title: apiNotif.achievementName || 'Achievement Unlocked',
            tier: (apiNotif.newTier || 'BRONZE') as AchievementTier,
            xp: apiNotif.xpAwarded || 0,
          });
        } else if (apiNotif.type === 'levelup') {
          showNotification({
            type: 'levelup',
            title: 'Level Up!',
            message: `You've reached Level ${apiNotif.newLevel}`,
          });
        }
      });
    };

    window.addEventListener('api-notification', handleApiNotification as EventListener);
    return () => {
      window.removeEventListener('api-notification', handleApiNotification as EventListener);
    };
  }, [notificationsEnabled, showNotification]);

  // Expose queue as notifications for context consumers
  const notifications = activeNotification ? [activeNotification] : [];

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        dismissNotification: () => dismissNotification(),
        snoozeNotification: () => snoozeNotification(),
        clearAll,
        notificationsEnabled,
        notificationsPersist,
        updateSettings,
      }}
    >
      {children}
      <NotificationStack
        notification={activeNotification}
        onDismiss={dismissNotification}
        onSnooze={snoozeNotification}
        persist={notificationsPersist}
      />
    </NotificationContext.Provider>
  );
};

// Tier color configurations
const TIER_THEMES: Record<AchievementTier, {
  gradient: string;
  bg: string;
  border: string;
  text: string;
  glow: string;
}> = {
  BRONZE: {
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-gradient-to-br from-orange-500/10 to-amber-600/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-500/20',
  },
  SILVER: {
    gradient: 'from-slate-400 to-zinc-500',
    bg: 'bg-gradient-to-br from-slate-400/10 to-zinc-500/10',
    border: 'border-slate-400/30',
    text: 'text-slate-300',
    glow: 'shadow-slate-400/20',
  },
  GOLD: {
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-gradient-to-br from-yellow-400/10 to-amber-500/10',
    border: 'border-yellow-400/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-400/20',
  },
  RUBY: {
    gradient: 'from-red-500 to-pink-600',
    bg: 'bg-gradient-to-br from-red-500/10 to-pink-600/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    glow: 'shadow-red-500/20',
  },
  DIAMOND: {
    gradient: 'from-cyan-400 to-blue-500',
    bg: 'bg-gradient-to-br from-cyan-400/10 to-blue-500/10',
    border: 'border-cyan-400/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-400/20',
  },
};

// macOS-style notification in top-right corner (only 1 at a time)
const NotificationStack: React.FC<{
  notification: Notification | null;
  onDismiss: () => void;
  onSnooze: () => void;
  persist: boolean;
}> = ({ notification, onDismiss, onSnooze, persist }) => {
  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none" style={{ maxWidth: '380px', minWidth: '320px' }}>
      <AnimatePresence>
        {notification && (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onSnooze={onSnooze}
            persist={persist}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Individual notification card with tier-based styling
const NotificationCard: React.FC<{
  notification: Notification;
  onDismiss: () => void;
  onSnooze: () => void;
  persist: boolean;
}> = ({ notification, onDismiss, onSnooze, persist }) => {
  const tier = notification.tier || 'BRONZE';
  const theme = TIER_THEMES[tier];

  const getIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return <Trophy className="w-6 h-6" />;
      case 'levelup':
        return <Zap className="w-6 h-6" />;
      default:
        return <Sparkles className="w-6 h-6" />;
    }
  };

  const isAchievement = notification.type === 'achievement';

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto"
    >
      <div className={`relative rounded-2xl shadow-2xl ${theme.glow} overflow-hidden backdrop-blur-xl border ${theme.border} ${theme.bg}`}>
        {/* Gradient accent bar at top */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.gradient}`} />

        <div className="p-4">
          {/* Header row: Icon + Title + Actions */}
          <div className="flex items-start gap-3">
            {/* Icon with gradient background */}
            <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg`}>
              {getIcon()}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h4 className="text-base font-bold text-white truncate">
                {notification.title}
              </h4>
              {isAchievement ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-sm font-semibold ${theme.text}`}>
                    {tier} Tier
                  </span>
                  {notification.xp !== undefined && notification.xp > 0 && (
                    <>
                      <span className="text-slate-500">•</span>
                      <span className="text-sm font-bold text-emerald-400">
                        +{notification.xp} XP
                      </span>
                    </>
                  )}
                </div>
              ) : (
                notification.message && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    {notification.message}
                  </p>
                )
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Snooze button */}
              <button
                onClick={onSnooze}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors group"
                title="Snooze (show later)"
              >
                <Clock className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              {/* Dismiss button */}
              <button
                onClick={onDismiss}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors group"
                title="Dismiss"
              >
                <X className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Progress bar for auto-dismiss (Bubbles mode) */}
          {!persist && (
            <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={`h-full bg-gradient-to-r ${theme.gradient}`}
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationContext;
