import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Sun,
  Sunset,
  Globe,
  Bell,
  HelpCircle,
  LogOut,
  Trophy,
} from 'lucide-react';

// Helper to build absolute URLs for avatar images
const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';
const ASSET_BASE = API_BASE.replace(/\/_?api$/, '');
const toAbsoluteUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (import.meta.env.DEV && url.startsWith('/')) return url;
  return `${ASSET_BASE}${url}`;
};

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { resolvedThemeMode, setThemeMode } = useTheme();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getUserInitial = () => {
    return user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || user?.username || user?.email?.split('@')[0] || 'User';
  };

  const getUserRole = () => {
    const role = user?.role || 'BASIC';
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  const themeOrder = ['sunrise', 'sunset'] as const;
  // If somehow midnight slipped through, map it to sunset for indexing
  const currentThemeMode = resolvedThemeMode === 'midnight' ? 'sunset' : resolvedThemeMode;
  const currentThemeIndex = themeOrder.indexOf(currentThemeMode as any);
  const nextThemeMode = themeOrder[(currentThemeIndex + 1) % themeOrder.length];

  const cycleThemeMode = () => {
    setThemeMode(nextThemeMode);
  };

  const currentThemeLabel =
    resolvedThemeMode === 'sunrise'
      ? 'Sunrise'
      : 'Sunset';

  const nextThemeLabel =
    nextThemeMode === 'sunrise' ? 'Sunrise' : 'Sunset';

  const CurrentThemeIcon =
    resolvedThemeMode === 'sunrise' ? Sun : Sunset;

  const handleNavigation = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
  };

  return (
    <div className="relative z-[100]" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full hover:ring-2 hover:ring-slate-200 dark:hover:ring-slate-700 transition-all"
      >
        {/* Avatar */}
        {user?.avatarUrl ? (
          <img
            src={toAbsoluteUrl(user.avatarUrl)}
            alt={getUserDisplayName()}
            className="w-9 h-9 rounded-full object-cover shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {getUserInitial()}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-[100]">
          {/* User Info Header */}
          <div className="p-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              {user?.avatarUrl ? (
                <img
                  src={toAbsoluteUrl(user.avatarUrl)}
                  alt={getUserDisplayName()}
                  className="w-10 h-10 rounded-full object-cover shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                  {getUserInitial()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {getUserDisplayName()}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {getUserRole()}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {/* My Profile */}
            <button
              onClick={() => handleNavigation('/settings?tab=profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium">My profile</span>
            </button>

            {/* Achievements */}
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/achievements';
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <Trophy className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium">Achievements</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={cycleThemeMode}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <CurrentThemeIcon
                  className={`w-4 h-4 ${
                    resolvedThemeMode === 'sunrise'
                      ? 'text-amber-500'
                      : resolvedThemeMode === 'sunset'
                      ? 'text-violet-500'
                      : 'text-cyan-500'
                  }`}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Appearance</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentThemeLabel} theme
                  </span>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                Next: {nextThemeLabel}
              </span>
            </button>

            {/* Change Language */}
            <button
              onClick={() => handleNavigation('/settings?tab=general')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium">Change language</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => handleNavigation('/settings?tab=notifications')}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
            </button>

            {/* Help Center */}
            <button
              onClick={() => handleNavigation('/help')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium">Help center</span>
            </button>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-slate-200 dark:border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors text-left"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
