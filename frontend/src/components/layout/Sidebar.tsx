import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  Shield,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Settings,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Admin, Courses, Study, Files } from '@/routes';

interface NavLink {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  component?: { preload: () => Promise<any> };
}

const navLinks: NavLink[] = [
  { to: '/courses', icon: BookOpen, label: 'Courses', component: Courses },
  { to: '/study', icon: GraduationCap, label: 'Study', component: Study },
  { to: '/files', icon: FolderOpen, label: 'Files', component: Files },
  { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true, component: Admin },
];

const bottomLinks: NavLink[] = [
  { to: '/subscription', icon: CreditCard, label: 'Subscription' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filter links based on user role
  const visibleLinks = navLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN');
  const isPremium = user?.role === 'PREMIUM' || user?.role === 'ADMIN';

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 280 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-screen bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-white/10 flex flex-col"
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
        <Link to="/study" className="flex items-center gap-3 overflow-hidden">
          <Logo variant="icon" animated={false} className="w-8 h-8 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-base font-semibold text-slate-900 dark:text-white leading-tight whitespace-nowrap">
                  Thynkr
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight whitespace-nowrap">
                  AI Study Platform
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Premium Badge */}
      {isPremium && (
        <div className={`mx-4 mt-4 ${isExpanded ? 'px-3 py-2' : 'px-2 py-2'} rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0" />
            {isExpanded && (
              <span className="text-xs font-medium text-violet-600 dark:text-violet-300">Premium</span>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-hide">
        {visibleLinks.map((link) => {
          const isLinkActive = isActive(link.to);
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              onMouseEnter={() => link.component?.preload()}
              className={`
                relative flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 group
                ${isLinkActive
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }
              `}
            >
              {/* Active Indicator */}
              {isLinkActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-violet-500 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <Icon className="w-5 h-5 flex-shrink-0" />

              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {link.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-1 border-t border-slate-200 dark:border-white/10 pt-4">
        {bottomLinks.map((link) => {
          const isLinkActive = isActive(link.to);
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-200 group
                ${isLinkActive
                  ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {link.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">Log out</span>
          )}

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 dark:bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Log out
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors z-50 shadow-md"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isExpanded ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
    </motion.aside>
  );
};

export default Sidebar;
