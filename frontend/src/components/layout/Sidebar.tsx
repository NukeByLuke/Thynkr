import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Award,
  FolderOpen,
  Shield,
  Crown,
  ChevronRight,
  User,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';

interface NavLink {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

const navLinks: NavLink[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/courses', icon: BookOpen, label: 'Courses' },
  { to: '/study', icon: GraduationCap, label: 'Study' },
  { to: '/tutor', icon: MessageSquare, label: 'AI Tutor' },
  { to: '/achievements', icon: Award, label: 'Achievements' },
  { to: '/library', icon: FolderOpen, label: 'Files' },
  { to: '/admin', icon: Shield, label: 'Admin', adminOnly: true },
];

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Filter links based on user role
  const visibleLinks = navLinks.filter((link) => !link.adminOnly || user?.role === 'ADMIN');

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 256 : 80 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="h-screen flex flex-col m-4 rounded-2xl glass-panel relative"
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-3 h-3 text-slate-400" />
        </motion.div>
      </button>

      {/* Logo Section */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-2 overflow-hidden">
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

      {/* Premium Badge (if user has premium) */}
      <AnimatePresence mode="wait">
        {isExpanded && (user?.role === 'PREMIUM' || user?.role === 'ADMIN') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-3 mt-3 overflow-hidden"
          >
            <div className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span className="text-xs font-medium text-blue-900 dark:text-blue-100 whitespace-nowrap">
                  Premium Member
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-1">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.to);

            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 relative group
                    ${
                      active
                        ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-l-2 border-primary-500'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-white/5 border-l-2 border-transparent'
                    }
                  `}
                  title={!isExpanded ? link.label : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      active ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'
                    }`}
                  />
                  <AnimatePresence mode="wait">
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm whitespace-nowrap overflow-hidden"
                      >
                        {link.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* Tooltip for collapsed state */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-slate-100 text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {link.label}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Pill */}
      <div className="p-3 border-t border-white/5">
        <div
          className={`
            flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 transition-all cursor-pointer
            ${!isExpanded && 'justify-center'}
          `}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden min-w-0"
              >
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.username || 'User'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email || ''}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
