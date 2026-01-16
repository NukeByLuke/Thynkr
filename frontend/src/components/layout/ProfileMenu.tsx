import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Moon,
  Sun,
  Globe,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
} from 'lucide-react';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { theme, setThemeMode } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

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

  const toggleDarkMode = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

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
        className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
      >
        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
          {getUserInitial()}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden z-[100]">
          {/* User Info Header */}
          <div className="p-4 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm">
                {getUserInitial()}
              </div>
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
              onClick={() => handleNavigation('/settings')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium">My profile</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="w-4 h-4 text-blue-500" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-500" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Appearance</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {isDark ? 'Dark' : 'Light'} mode
                  </span>
                </div>
              </div>
              {/* Toggle Switch */}
              <div
                className={`w-11 h-6 rounded-full transition-all duration-200 ${
                  isDark ? 'bg-blue-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    isDark ? 'translate-x-5' : 'translate-x-0.5'
                  } mt-0.5`}
                />
              </div>
            </button>

            {/* Change Language */}
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm font-medium">Change language</span>
            </button>

            {/* Notifications */}
            <button
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              {/* Notification badge */}
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded-full">
                1
              </span>
            </button>

            {/* Help Center */}
            <button
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
