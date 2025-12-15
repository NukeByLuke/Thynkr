/**
 * MobileBottomNav Component - Mobile-First Navigation Strategy
 * Sticky bottom tab bar for mobile devices with glassmorphism design
 * Uses Strategy Pattern for responsive navigation
 */

import { NavLink } from 'react-router-dom';
import { LucideIcon, Home, BookOpen, Gamepad2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BottomNavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  requiresPremium?: boolean;
}

interface MobileBottomNavProps {
  items?: BottomNavItem[];
}

// ============================================================================
// BottomNavButton Component
// ============================================================================

interface BottomNavButtonProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

function BottomNavButton({ to, icon: Icon, label, end = false }: BottomNavButtonProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-0 flex-1 transition-all duration-200 relative active:scale-95 ${
          isActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-500 dark:text-slate-400 active:text-slate-700 dark:active:text-slate-300'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Indicator - Top Border */}
          {isActive && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
          )}

          {/* Icon Container */}
          <div
            className={`relative transition-transform duration-200 ${
              isActive ? '-translate-y-0.5' : ''
            }`}
          >
            <Icon
              className={`w-6 h-6 transition-all duration-200 ${
                isActive
                  ? 'stroke-[2.5]'
                  : 'stroke-[2]'
              }`}
            />
            
            {/* Active Glow Effect */}
            {isActive && (
              <div className="absolute inset-0 blur-lg opacity-40 bg-blue-500 dark:bg-blue-400 rounded-full -z-10" />
            )}
          </div>

          {/* Label */}
          <span
            className={`text-[10px] font-medium leading-none transition-all duration-200 ${
              isActive
                ? 'opacity-100 font-semibold'
                : 'opacity-70'
            }`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

// ============================================================================
// MobileBottomNav Component
// ============================================================================

export default function MobileBottomNav({ items }: MobileBottomNavProps) {
  const { user } = useAuth();

  // Default navigation items if none provided
  const defaultItems: BottomNavItem[] = [
    { path: '/', icon: Home, label: 'Home', end: true },
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/arcade', icon: Gamepad2, label: 'Arcade' },
    { path: '/settings', icon: User, label: 'Profile' },
  ];

  const navItems = items || defaultItems;

  // Filter items based on user permissions
  const visibleItems = navItems.filter((item) => {
    if (item.requiresPremium && user?.role !== 'PREMIUM' && user?.role !== 'ADMIN') {
      return false;
    }
    return true;
  });

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />

      {/* Fixed Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Glassmorphism Container */}
        <div className="relative">
          {/* Gradient Border Top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

          {/* Glass Panel */}
          <div className="backdrop-blur-lg bg-white/90 dark:bg-slate-900/90 border-t border-slate-200/50 dark:border-slate-800/50 shadow-lg">
            {/* Navigation Items */}
            <div className="flex items-stretch justify-around max-w-screen-sm mx-auto">
              {visibleItems.map((item) => (
                <BottomNavButton
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  end={item.end}
                />
              ))}
            </div>

            {/* iOS Home Indicator Safe Area - pb-safe class for iOS devices */}
            <div className="h-safe pb-safe bg-transparent" />
          </div>

          {/* Subtle Shadow Gradient */}
          <div className="absolute bottom-full left-0 right-0 h-4 bg-gradient-to-t from-black/5 to-transparent dark:from-black/20 pointer-events-none" />
        </div>
      </nav>
    </>
  );
}
