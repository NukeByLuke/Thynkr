/**
 * Sidebar Component - Aurora Theme
 * A polished floating glass sidebar with clean navigation
 */

import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LucideIcon, LogOut, ChevronRight, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import ThynkrLogo from '@/components/brand/Logo';

// ============================================================================
// NavItem Component
// ============================================================================

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  onClick?: () => void;
}

export function NavItem({ to, icon: Icon, label, end = false, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
          isActive
            ? // Active State - Aurora Theme
              'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800/60 dark:to-slate-800/60 text-slate-900 dark:text-slate-300 font-medium'
            : // Inactive State
              'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Indicator - Vertical Pill */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-purple-500" />
          )}

          {/* Icon */}
          <div
            className={`p-2 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20'
                : 'bg-slate-100 dark:bg-slate-800/50 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/50'
            }`}
          >
            <Icon
              className={`w-4 h-4 ${
                isActive
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              }`}
            />
          </div>

          {/* Label */}
          <span className={`text-sm ${
            isActive 
              ? 'text-slate-900 dark:text-slate-300' 
              : 'text-slate-500 dark:text-slate-400'
          }`}>
            {label}
          </span>

          {/* Hover Arrow */}
          <ChevronRight
            className={`w-4 h-4 ml-auto opacity-0 -translate-x-2 transition-all duration-200 ${
              isActive ? 'opacity-100 translate-x-0' : 'group-hover:opacity-50 group-hover:translate-x-0'
            }`}
          />
        </>
      )}
    </NavLink>
  );
}

// ============================================================================
// SectionHeader Component
// ============================================================================

interface SectionHeaderProps {
  title: string;
}

export function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-2 px-4">
      {title}
    </h3>
  );
}

// ============================================================================
// CommandMenuTrigger Component
// ============================================================================

interface CommandMenuTriggerProps {
  onClick?: () => void;
}

export function CommandMenuTrigger({ onClick }: CommandMenuTriggerProps) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().indexOf('MAC') >= 0);
  }, []);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-500 hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors group"
    >
      <div className="flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
        <span className="text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors">
          Search...
        </span>
      </div>
      <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm">
        {isMac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  );
}

// ============================================================================
// Sidebar Component
// ============================================================================

export interface NavigationItem {
  path: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

interface SidebarProps {
  sections: NavigationSection[];
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  sections,
  onNavigate,
  showCloseButton = false,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getUserInitial = () => {
    return user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getUserDisplayName = () => {
    return user?.firstName || user?.username || user?.email?.split('@')[0] || 'User';
  };

  return (
    <div className="h-full w-full flex flex-col bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      {/* Header - Logo/Brand */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <ThynkrLogo variant="full" className="text-slate-900 dark:text-white" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              AI Study Platform
            </p>
          </div>
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-slate-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Command Menu Trigger */}
      <div className="px-3 pt-3">
        <CommandMenuTrigger />
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <SectionHeader title={section.title} />
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.path}
                  to={item.path}
                  icon={item.icon}
                  label={item.label}
                  end={item.end}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer - User Profile */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold text-sm">
            {getUserInitial()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {user?.email}
            </p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors opacity-0 group-hover:opacity-100"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
