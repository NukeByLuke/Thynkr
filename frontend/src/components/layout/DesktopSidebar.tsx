import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Home,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import Logo from '@/components/Logo';
import SidebarHeader from './SidebarHeader';

export default function DesktopSidebar() {
  const { logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/study' },
    { icon: GraduationCap, label: 'Study', path: '/immersive-study' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: DollarSign, label: 'Pricing', path: '/pricing' },
  ];

  const isActive = (path: string) => {
    if (path === '/courses') {
      return location.pathname === '/courses' || location.pathname.startsWith('/courses/');
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isSidebarOpen ? 256 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 backdrop-blur-lg border-r border-slate-200 dark:border-slate-800/50 shadow-soft-lg z-40 overflow-hidden"
    >
      {/* Top Section - Logo & Collapse Button */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center justify-between">
          <div className={`${!isSidebarOpen && 'mx-auto'}`}>
            <Logo variant={isSidebarOpen ? 'full' : 'icon'} animated={true} />
          </div>
          {isSidebarOpen && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-gray-400" />
            </motion.button>
          )}
        </div>

        {!isSidebarOpen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="mx-auto mt-4 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-150 flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-slate-500 dark:text-gray-400" />
          </motion.button>
        )}

        {/* Unified Header Section - Clock & Greeting */}
        <AnimatePresence mode="wait">
          <SidebarHeader isExpanded={isSidebarOpen} />
        </AnimatePresence>
      </div>

      {/* Middle Section - Navigation Links */}
      <nav
        className={`flex-1 px-4 py-6 space-y-2 ${isSidebarOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <motion.div key={item.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group relative ${
                  active
                    ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                } ${!isSidebarOpen && 'justify-center'}`}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-gradient-to-b from-primary-400 to-primary-500 rounded-full"
                  />
                )}
                <div
                  className={`flex items-center justify-center w-6 h-6 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`}
                >
                  <Icon className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
                </div>
                <AnimatePresence mode="wait">
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium whitespace-nowrap overflow-hidden text-sm"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {item.label}
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Bottom Section - Settings & Logout */}
      <div className="px-4 py-6 border-t border-slate-200 dark:border-slate-800/60 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left group relative ${
            location.pathname === '/settings'
              ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          } ${!isSidebarOpen && 'justify-center'}`}
        >
          <div className="flex items-center justify-center w-6 h-6">
            <Settings className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
          </div>
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium whitespace-nowrap overflow-hidden text-sm"
              >
                Settings
              </motion.span>
            )}
          </AnimatePresence>
          {!isSidebarOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Settings
            </div>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 w-full text-left group relative text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 dark:text-red-400 dark:hover:text-red-300 ${
            !isSidebarOpen && 'justify-center'
          }`}
        >
          <div className="flex items-center justify-center w-6 h-6">
            <LogOut className="w-6 h-6 flex-shrink-0" strokeWidth={2} />
          </div>
          <AnimatePresence mode="wait">
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-medium whitespace-nowrap overflow-hidden text-sm"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
          {!isSidebarOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Logout
            </div>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
