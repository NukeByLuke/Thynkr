import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderOpen,
  TrendingUp,
  MessageCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  BarChart3,
  GraduationCap,
  Home,
  DollarSign,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import { useState, useEffect } from 'react';
import Logo from './Logo';

export default function DesktopSidebar() {
  const { user, logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useNavigation();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, [currentTime]);

  const formatTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(currentTime);
  };

  const formatDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(currentTime);
  };

  const navItems = [
    ...(user?.role === 'ADMIN' ? [{ icon: BarChart3, label: 'Dashboard', path: '/admin' }] : []),
    { icon: Home, label: 'Home', path: '/' },
    { icon: GraduationCap, label: 'Study', path: '/study' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: TrendingUp, label: 'Progress', path: '/progress' },
    ...(user?.role === 'PREMIUM' || user?.role === 'ADMIN'
      ? [{ icon: MessageCircle, label: 'AI Tutor', path: '/tutor' }]
      : []),
    { icon: DollarSign, label: 'Pricing', path: '/pricing' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      // Home button is never active in the sidebar (it redirects externally)
      return false;
    }
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
      className="hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-[#0f172a] bg-opacity-90 backdrop-blur-lg border-r border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)] z-40 overflow-hidden"
    >
      {/* Top Section - Logo & Collapse Button */}
      <div className="px-4 py-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className={`${!isSidebarOpen && 'mx-auto'}`}>
            <Logo variant={isSidebarOpen ? 'full' : 'icon'} animated={true} />
          </div>
          {isSidebarOpen && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 transition-all duration-300"
            >
              <X className="w-5 h-5 text-gray-400" />
            </motion.button>
          )}
        </div>

        {!isSidebarOpen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSidebar}
            className="mx-auto mt-4 p-2 rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-400" />
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden mt-4"
            >
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span className="font-medium">{formatTime()}</span>
                </div>
                <div className="text-xs text-gray-500">{formatDate()}</div>
                <div className="text-sm font-medium text-white pt-2">
                  {greeting}, {user?.username || 'User'}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isSidebarOpen && (
          <div className="flex flex-col items-center gap-1 text-xs text-gray-400 mt-4">
            <Clock className="w-4 h-4" />
            <span className="font-medium text-[10px]">{formatTime().split(' ')[0]}</span>
          </div>
        )}
      </div>

      {/* Middle Section - Navigation Links */}
      <nav
        className={`flex-1 px-4 py-6 space-y-2 ${isSidebarOpen ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isHome = item.path === '/';

          // Home button redirects to external domain
          if (isHome) {
            return (
              <motion.div key={item.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  onClick={() => (window.location.href = 'https://thynkr.ca')}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative w-full ${
                    active
                      ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 hover:shadow-[0_0_10px_rgba(124,58,237,0.15)]'
                  } ${!isSidebarOpen && 'justify-center'}`}
                >
                  {active && (
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-gradient-to-b from-[#7c3aed] to-[#3b82f6] rounded-full"
                      style={{
                        boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                      }}
                    />
                  )}
                  <div
                    className={`flex items-center justify-center w-6 h-6 ${active ? 'drop-shadow-[0_0_6px_rgba(124,58,237,0.6)]' : ''}`}
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
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              </motion.div>
            );
          }

          return (
            <motion.div key={item.path} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative ${
                  active
                    ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 hover:shadow-[0_0_10px_rgba(124,58,237,0.15)]'
                } ${!isSidebarOpen && 'justify-center'}`}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[3px] bg-gradient-to-b from-[#7c3aed] to-[#3b82f6] rounded-full"
                    style={{
                      boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                    }}
                  />
                )}
                <div
                  className={`flex items-center justify-center w-6 h-6 ${active ? 'drop-shadow-[0_0_6px_rgba(124,58,237,0.6)]' : ''}`}
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
      <div className="px-4 py-6 border-t border-white/10 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 w-full text-left group relative ${
            location.pathname === '/settings'
              ? 'bg-white/5 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 w-full text-left group relative text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
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
