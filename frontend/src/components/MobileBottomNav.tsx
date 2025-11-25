import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, GraduationCap, User, Menu } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const navItems = [
    { icon: Home, label: 'Home', path: '/', auth: false },
    { icon: FolderOpen, label: 'Files', path: '/files', auth: true },
    { icon: GraduationCap, label: 'Study', path: '/study', auth: true },
    { icon: User, label: 'Profile', path: '/settings', auth: true },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            if (item.auth && !isAuthenticated) return null;
            
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center justify-center flex-1 h-full relative group"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center justify-center"
                >
                  <Icon className={`w-6 h-6 ${
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`} />
                  <span className={`text-xs mt-1 font-medium ${
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                  }`}>{item.label}</span>
                </motion.div>
                
                {/* Active indicator - positioned relative to Link container */}
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 inset-x-0 mx-auto w-10 h-1 bg-primary-600 dark:bg-primary-400 rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 dark:text-gray-400"
          >
            <motion.div whileTap={{ scale: 0.9 }}>
              <Menu className="w-6 h-6" />
              <span className="text-xs mt-1 font-medium">Menu</span>
            </motion.div>
          </button>
        </div>
      </nav>

      {/* Sliding Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl z-50 max-h-[60vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Menu</h3>
                  <button
                    onClick={() => setShowMenu(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2">
                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/account"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Account & Billing
                      </Link>
                      <Link
                        to="/pricing"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Pricing
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors text-center font-medium"
                      >
                        Get Started
                      </Link>
                      <Link
                        to="/pricing"
                        onClick={() => setShowMenu(false)}
                        className="block px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Pricing
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
