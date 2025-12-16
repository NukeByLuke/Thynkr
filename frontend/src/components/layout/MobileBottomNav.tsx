/**
 * MobileBottomNav Component - Amazon/Spotify-style Mobile Navigation
 * Fixed bottom tab bar with framer-motion animations
 * Pattern: Configuration array with compound component structure
 */

import { memo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LucideIcon, Home, BookOpen, GraduationCap, TrendingUp, Menu } from 'lucide-react';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface NavTab {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  isPrimary?: boolean;
}

interface MobileBottomNavProps {
  onMenuClick?: () => void;
}

// ============================================================================
// Navigation Configuration
// ============================================================================

const NAV_TABS: NavTab[] = [
  {
    id: 'home',
    label: 'Home',
    path: '/',
    icon: Home,
  },
  {
    id: 'courses',
    label: 'Courses',
    path: '/courses',
    icon: BookOpen,
  },
  {
    id: 'study',
    label: 'Study',
    path: '/study',
    icon: GraduationCap,
    isPrimary: true, // Highlighted as primary action
  },
  {
    id: 'progress',
    label: 'Progress',
    path: '/progress',
    icon: TrendingUp,
  },
  {
    id: 'menu',
    label: 'Menu',
    path: '#menu',
    icon: Menu,
  },
];

// ============================================================================
// MobileBottomNav Component (Memoized for performance)
// ============================================================================

const MobileBottomNav = memo(({ onMenuClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleTabClick = (tab: NavTab) => {
    if (tab.id === 'menu') {
      onMenuClick?.();
    } else {
      navigate(tab.path);
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    if (path === '#menu') {
      return false; // Menu never shows as active
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16 pb-safe bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around h-full px-2">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          const isPrimary = tab.isPrimary && active;

          return (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              className="flex flex-col items-center justify-center flex-1 h-full min-w-0 touch-manipulation relative"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon Container with Animation */}
              <motion.div
                animate={{
                  scale: active ? 1.1 : 1,
                  y: active ? -2 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className={`relative mb-0.5 ${
                  isPrimary
                    ? 'text-brand-600 dark:text-brand-400'
                    : active
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    isPrimary ? 'stroke-[2.5]' : active ? 'stroke-[2.25]' : 'stroke-2'
                  }`}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Active Indicator Dot - Animated */}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                      isPrimary
                        ? 'bg-brand-600 dark:bg-brand-400'
                        : 'bg-brand-500 dark:bg-brand-400'
                    }`}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Primary Glow Effect */}
                {isPrimary && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute inset-0 blur-md bg-brand-500 rounded-full -z-10"
                  />
                )}
              </motion.div>

              {/* Label with Font Weight Animation */}
              <motion.span
                animate={{
                  fontWeight: isPrimary ? 700 : active ? 600 : 500,
                }}
                className={`text-[10px] leading-none transition-colors duration-200 ${
                  isPrimary
                    ? 'text-brand-600 dark:text-brand-400'
                    : active
                    ? 'text-brand-500 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
