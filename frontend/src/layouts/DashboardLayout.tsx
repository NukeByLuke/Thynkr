import { Outlet, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/Logo';
import {
  BookOpen,
  FolderOpen,
  MessageCircle,
  Settings,
  LogOut,
  Clock,
  LibraryBig,
  TrendingUp,
  Menu,
  X,
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navigationItems = [
    { path: '/study', icon: BookOpen, label: 'Study' },
    { path: '/courses', icon: LibraryBig, label: 'Courses' },
    { path: '/files', icon: FolderOpen, label: 'Files' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    ...(user?.role === 'PREMIUM' || user?.role === 'ADMIN'
      ? [{ path: '/tutor', icon: MessageCircle, label: 'AI Tutor' }]
      : []),
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="hidden lg:flex flex-col h-screen bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 sticky top-0 shadow-glass"
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          {isCollapsed ? (
            <Logo variant="icon" animated={false} />
          ) : (
            <Logo variant="full" animated={false} />
          )}
        </div>

        {/* Clock & Toggle */}
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3 text-slate-600 dark:text-slate-300">
                <div className="p-2 bg-gradient-to-br from-brand-500/10 to-accent-500/10 rounded-xl">
                  <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out group ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 bg-gradient-to-r from-brand-500/10 to-accent-500/10 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand-500 to-accent-500 rounded-r-full"
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <Icon
                      className={`w-5 h-5 transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'group-hover:drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]'}`}
                    />
                    {!isCollapsed && <span className="font-semibold">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Settings & Logout */}
        <div className="p-3 border-t border-slate-200/50 dark:border-white/10 space-y-1">
          <NavLink
            to="/account"
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out group ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 bg-gradient-to-r from-brand-500/10 to-accent-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            {!isCollapsed && <span className="font-semibold">Settings</span>}
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ease-out text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-950/30"
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="font-semibold">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-soft border border-white/20 dark:border-white/10 transition-all duration-300 hover:shadow-glow-brand"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        ) : (
          <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-white/20 dark:border-white/10 z-50 flex flex-col shadow-glass-lg"
            >
              {/* Logo */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => setIsMobileMenuOpen(false)} className="inline-flex">
                  <Logo variant="full" animated={false} />
                </button>
              </div>

              {/* Clock */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                  <Clock className="w-5 h-5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {currentTime.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {currentTime.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `relative flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-brand-500 to-accent-400 rounded-r-full" />
                          )}
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>

              {/* Settings & Logout */}
              <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <NavLink
                  to="/account"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    }`
                  }
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
