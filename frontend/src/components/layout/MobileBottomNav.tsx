import { Link, NavLink, useLocation } from 'react-router-dom';
import { Home, GraduationCap, BookOpen, FolderOpen, Menu as MenuIcon, Settings, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, memo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MobileBottomNav = memo(() => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/study' },
    { icon: GraduationCap, label: 'Study', path: '/immersive-study' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: MenuIcon, label: 'Menu', path: '#menu', action: () => setIsMenuOpen(!isMenuOpen) },
  ];

  const isActive = (path: string) => {
    if (path === '#menu') return false;
    if (path === '/courses') {
      return location.pathname === '/courses' || location.pathname.startsWith('/courses/');
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl rounded-t-3xl border-t border-slate-200/50 dark:border-white/10 shadow-2xl pb-safe"
            >
              <div className="px-6 py-6 space-y-2">
                {/* Drag Handle */}
                <div className="flex justify-center pb-2">
                  <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>

                {/* User Profile Section */}
                {user && (
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-white/10">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{user.username}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{user.email}</div>
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <Link
                  to="/account"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">My Profile</span>
                </Link>
                <Link
                  to="/settings"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-indigo-50/50 dark:hover:bg-white/5 transition-all duration-300"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Settings</span>
                </Link>
                
                <div className="my-2 border-t border-slate-200/50 dark:border-white/10" />
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-all duration-300 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/10 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)]"
      >
        <div className="flex items-center justify-around px-2 py-3 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.action) {
              return (
                <button
                  key={item.path}
                  onClick={item.action}
                  className="relative flex flex-col items-center justify-center group min-w-[60px]"
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="relative"
                  >
                    <div
                      className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                        isMenuOpen
                          ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'bg-transparent text-slate-600 dark:text-slate-400 group-active:bg-slate-100 dark:group-active:bg-white/5'
                      }`}
                    >
                      <Icon className="w-6 h-6" strokeWidth={2} />
                    </div>
                  </motion.div>

                  <span
                    className={`mt-1 text-[10px] font-medium transition-colors text-center ${
                      isMenuOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className="relative flex flex-col items-center justify-center group min-w-[60px]"
              >
                {/* Active indicator line at top */}
                {active && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                    style={{
                      boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="relative"
                >
                  {/* Active gradient glow behind icon */}
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl blur-md opacity-30" />
                  )}

                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                      active
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                        : 'bg-transparent text-slate-600 dark:text-slate-400 group-active:bg-slate-100 dark:group-active:bg-white/5'
                    }`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                </motion.div>

                <span
                  className={`mt-1 text-[10px] font-medium transition-colors text-center ${
                    active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
