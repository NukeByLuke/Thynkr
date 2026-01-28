import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  GraduationCap,
  FolderOpen,
  CreditCard,
  Sparkles,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import { Courses, Study, Files, Pricing, Admin, Settings as SettingsPage } from '@/routes';

interface NavLink {
  to: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
  component?: { preload: () => Promise<any> };
}

const navLinks: NavLink[] = [
  { to: '/study', icon: GraduationCap, label: 'Study', component: Study },
  { to: '/courses', icon: BookOpen, label: 'Courses', component: Courses },
  { to: '/files', icon: FolderOpen, label: 'Files', component: Files },
  { to: '/pricing', icon: CreditCard, label: 'Pricing', component: Pricing },
  { to: '/admin', icon: Shield, label: 'Admin', component: Admin, adminOnly: true },
];

const bottomLinks: NavLink[] = [
  { to: '/settings', icon: Settings, label: 'Settings', component: SettingsPage },
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
      className="relative h-screen bg-stone-50/80 dark:bg-midnight-violet/80 backdrop-blur-xl border-r border-stone-200/50 dark:border-midnight-blue/30 flex flex-col shadow-xl shadow-stone-200/20 dark:shadow-midnight-violet/20"
    >
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-stone-200/50 dark:border-midnight-blue/30">
        <Link to="/study" className="flex items-center gap-2 overflow-hidden">
          <Logo variant="icon" size="xl" animated={false} className="flex-shrink-0" />
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden items-start"
              >
                <img
                  src="/brand/wordmark-light.png"
                  alt="THYNKR"
                  className="h-8 object-contain dark:hidden"
                />
                <img
                  src="/brand/wordmark-dark.png"
                  alt="THYNKR"
                  className="h-8 object-contain hidden dark:block"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Premium Badge */}
      {isPremium && (
        <div className={`mx-4 mt-4 ${isExpanded ? 'px-3 py-2' : 'px-2 py-2'} rounded-xl bg-gradient-to-r from-sunrise-fuchsia/10 to-sunrise-orange/10 dark:from-midnight-violet/10 dark:to-midnight-cyan/10 border border-sunrise-pink/20 dark:border-midnight-blue/20`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sunrise-fuchsia dark:text-midnight-cyan flex-shrink-0" />
            {isExpanded && (
              <span className="text-xs font-medium text-sunrise-pink dark:text-midnight-blue">Premium</span>
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
                transition-all duration-150 group
                ${isLinkActive
                  ? 'text-indigo-700 dark:text-white bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-500 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/25 font-semibold'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 hover:scale-[1.02]'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${
                isLinkActive ? 'text-sunrise-pink dark:text-white dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''
              }`} />

              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {link.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade CTA */}
      {!isPremium && isExpanded && (
        <div className="mx-3 mb-2 p-4 rounded-xl bg-gradient-to-br from-sunrise-pink/20 to-sunrise-orange/30 dark:from-midnight-violet dark:to-midnight-cyan shadow-lg relative overflow-hidden group flex-shrink-0">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles className="w-16 h-16 transform rotate-12" />
          </div>
          <h3 className="font-semibold text-sm mb-1 relative z-10 text-sunrise-fuchsia dark:text-white">Upgrade to Pro</h3>
          <p className="text-[10px] text-sunrise-pink dark:text-midnight-blue mb-3 relative z-10 leading-tight">
            Unlock unlimited AI tutoring and advanced analytics.
          </p>
          <Link
            to="/pricing"
            className="block w-full py-1.5 bg-gradient-to-r from-sunrise-pink to-sunrise-orange dark:from-white dark:to-white text-white dark:text-midnight-violet text-xs font-bold text-center rounded-lg hover:from-sunrise-fuchsia hover:to-sunrise-pink dark:hover:bg-stone-100 transition-all relative z-10"
          >
            Get Pro Access
          </Link>
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-3 pb-4 space-y-1 border-t border-stone-200/50 dark:border-midnight-blue/30 pt-4">
        {bottomLinks.map((link) => {
          const isLinkActive = isActive(link.to);
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                transition-all duration-150 group
                ${isLinkActive
                  ? 'text-indigo-700 dark:text-white bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-500 dark:to-purple-500 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-500/25 font-semibold'
                  : 'text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-white/5 hover:scale-[1.02]'
                }
              `}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${
                isLinkActive ? 'text-sunrise-pink dark:text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''
              }`} />
              {isExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {link.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {!isExpanded && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {link.label}
                </div>
              )}
            </Link>
          );
        })}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-700 dark:text-stone-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {isExpanded && (
            <span className="text-sm font-medium whitespace-nowrap">Log out</span>
          )}

          {/* Tooltip for collapsed state */}
          {!isExpanded && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-stone-900 dark:bg-stone-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
              Log out
            </div>
          )}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-20 w-6 h-6 bg-stone-50 dark:bg-midnight-violet border border-stone-200 dark:border-midnight-blue/30 rounded-full flex items-center justify-center text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-midnight-blue/50 transition-colors z-50 shadow-md"
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
