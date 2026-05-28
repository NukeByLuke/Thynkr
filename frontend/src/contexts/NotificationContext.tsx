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
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

export type NotificationType = 'achievement' | 'levelup' | 'info' | 'success';
export type AchievementTier = 'BRONZE' | 'COPPER' | 'GOLD' | 'RUBY' | 'DIAMOND' | 'AMETHYST' | 'MASTERY';

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
const NOTIFICATION_AUTO_HIDE_MS = 5000;
const NOTIFICATION_SNOOZE_MS = 5 * 60 * 1000;

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
  const snoozeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Track shown notification IDs to prevent duplicates (e.g., from query refetches)
  const shownNotificationIds = useRef<Set<string>>(new Set());

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
      }, NOTIFICATION_AUTO_HIDE_MS);
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [activeNotification, notificationsPersist]);

  useEffect(() => {
    if (!notificationsEnabled) {
      setQueue([]);
      setActiveNotification(null);
      snoozeTimers.current.forEach((timer) => clearTimeout(timer));
      snoozeTimers.current.clear();
    }
  }, [notificationsEnabled]);

  useEffect(() => {
    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
      snoozeTimers.current.forEach((timer) => clearTimeout(timer));
      snoozeTimers.current.clear();
    };
  }, []);

  // Add notification to queue - ONLY for achievements and level ups
  const showNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    if (!notificationsEnabled) return;
    
    // Only queue achievement and levelup notifications
    // Ignore info/success to prevent spam
    if (notification.type !== 'achievement' && notification.type !== 'levelup') {
      return;
    }

    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
    };

    setQueue((prev) => [...prev, newNotification]);
  }, [notificationsEnabled]);

  const dismissNotification = useCallback((id: string) => {
    if (activeNotification && id !== activeNotification.id) {
      return;
    }

    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    setActiveNotification(null);
  }, [activeNotification]);

  const snoozeNotification = useCallback((id: string) => {
    if (!activeNotification || id !== activeNotification.id) {
      return;
    }

    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }

    const baseNotification = activeNotification;
    const snoozeKey = baseNotification.id;
    const existingSnoozeTimer = snoozeTimers.current.get(snoozeKey);
    if (existingSnoozeTimer) {
      clearTimeout(existingSnoozeTimer);
    }

    const snoozedNotification: Notification = {
      ...baseNotification,
      id: `${Date.now()}-${Math.random()}`,
    };

    const timer = setTimeout(() => {
      setQueue((prev) => [...prev, snoozedNotification]);
      snoozeTimers.current.delete(snoozeKey);
    }, NOTIFICATION_SNOOZE_MS);

    snoozeTimers.current.set(snoozeKey, timer);
    setActiveNotification(null);
  }, [activeNotification]);

  const clearAll = useCallback(() => {
    setQueue([]);
    setActiveNotification(null);
    snoozeTimers.current.forEach((timer) => clearTimeout(timer));
    snoozeTimers.current.clear();
  }, []);

  // Listen for API notifications (achievements, level ups)
  useEffect(() => {
    const handleApiNotification = (event: CustomEvent<{ notifications: any[] }>) => {
      if (!notificationsEnabled) return;

      const { notifications: apiNotifications } = event.detail;

      apiNotifications.forEach((apiNotif) => {
        // Create a unique key for deduplication based on achievement ID and tier
        const dedupeKey = apiNotif.type === 'achievement' 
          ? `achievement-${apiNotif.achievementId}-${apiNotif.newTier}`
          : `levelup-${apiNotif.newLevel}`;
        
        // Skip if we've already shown this notification
        if (shownNotificationIds.current.has(dedupeKey)) {
          return;
        }
        
        // Mark as shown
        shownNotificationIds.current.add(dedupeKey);
        
        // Clear old entries after 30 seconds to prevent memory buildup
        setTimeout(() => {
          shownNotificationIds.current.delete(dedupeKey);
        }, 30000);

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
        dismissNotification,
        snoozeNotification,
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
  GOLD: {
    gradient: 'from-yellow-400 to-amber-500',
    bg: 'bg-gradient-to-br from-yellow-400/10 to-amber-500/10',
    border: 'border-yellow-400/30',
    text: 'text-yellow-400',
    glow: 'shadow-yellow-400/20',
  },
  RUBY: {
    gradient: 'from-red-500 to-rose-600',
    bg: 'bg-gradient-to-br from-red-500/10 to-rose-600/10',
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
  AMETHYST: {
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-gradient-to-br from-purple-500/10 to-violet-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    glow: 'shadow-purple-500/20',
  },
  COPPER: {
    gradient: 'from-orange-400 to-amber-500',
    bg: 'bg-gradient-to-br from-orange-400/10 to-amber-500/10',
    border: 'border-orange-400/30',
    text: 'text-orange-400',
    glow: 'shadow-orange-400/20',
  },
  MASTERY: {
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    bg: 'bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-fuchsia-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    glow: 'shadow-pink-500/20',
  },
};

// macOS-style notification in top-right corner (only 1 at a time)
const NotificationStack: React.FC<{
  notification: Notification | null;
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  persist: boolean;
}> = ({ notification, onDismiss, onSnooze, persist }) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none" style={{ maxWidth: '400px', minWidth: '340px' }}>
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
  onDismiss: (id: string) => void;
  onSnooze: (id: string) => void;
  persist: boolean;
}> = ({ notification, onDismiss, onSnooze, persist }) => {
  const navigate = useNavigate();
  const tier = notification.tier || 'BRONZE';
  const theme = TIER_THEMES[tier] || TIER_THEMES.BRONZE;

  const getIcon = () => {
    switch (notification.type) {
      case 'achievement':
        return <Trophy className="w-5 h-5" />;
      case 'levelup':
        return <Zap className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const isAchievement = notification.type === 'achievement';

  const handleClick = () => {
    if (isAchievement) {
      navigate('/achievements');
      onDismiss(notification.id);
      // Refresh the page to show latest achievements
      window.location.reload();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 400, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto"
      onClick={handleClick}
      style={{ cursor: isAchievement ? 'pointer' : 'default' }}
    >
      {/* Outer glow effect for visibility */}
      <div className={`relative rounded-xl ${isAchievement ? 'shadow-[0_0_60px_-8px]' : 'shadow-2xl'} ${theme.glow} overflow-hidden ${isAchievement ? 'animate-pulse' : ''}`}>
        {/* Inner container with blur and border */}
        <div className={`relative rounded-xl backdrop-blur-xl border-2 ${theme.border} bg-white/95 dark:bg-zinc-900/95 ${theme.bg} overflow-hidden`}>
          {/* Gradient accent bar at top */}
          <div className={`h-[3px] bg-gradient-to-r ${theme.gradient}`} />

          <div className="p-4">
            {/* Header row: Icon + Title + Actions */}
            <div className="flex items-center gap-3">
              {/* Icon with gradient background */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg`}>
                {getIcon()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {isAchievement && (
                    <Sparkles className={`w-4 h-4 ${theme.text} flex-shrink-0`} />
                  )}
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {notification.title}
                  </h4>
                </div>
                {isAchievement ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md bg-gradient-to-r ${theme.gradient} text-white whitespace-nowrap`}>
                      {tier} Tier
                    </span>
                    {notification.xp !== undefined && notification.xp > 0 && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        +{notification.xp} XP
                      </span>
                    )}
                  </div>
                ) : (
                  notification.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {notification.message}
                    </p>
                  )
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Snooze button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSnooze(notification.id);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors group"
                  title="Snooze (show later)"
                >
                  <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
                </button>
                {/* Dismiss button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center transition-colors group"
                  title="Dismiss"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Progress bar for auto-dismiss (Bubbles mode) */}
            {!persist && (
              <div className="mt-3 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
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
      </div>
    </motion.div>
  );
};

export default NotificationContext;
