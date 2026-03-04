import { Link, NavLink, useLocation } from 'react-router-dom';
import { GraduationCap, BookOpen, FolderOpen, Menu as MenuIcon, Settings, User, LogOut, Trophy, CircleDollarSign, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, memo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MobileBottomNav = memo(() => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const menuOpenRef = useRef(false);

  const isEditableElement = (element: HTMLElement | null) => {
    if (!element) return false;
    return (
      element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.getAttribute('contenteditable') === 'true'
    );
  };

  useEffect(() => {
    menuOpenRef.current = isMenuOpen;
  }, [isMenuOpen]);

  useEffect(() => {
    const updateKeyboardState = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const activeElement = document.activeElement as HTMLElement | null;
      const isEditing = isEditableElement(activeElement);
      const viewportDifference = window.innerHeight - viewport.height;
      const keyboardLikelyOpen = isEditing && viewportDifference > 100;
      setIsKeyboardOpen(keyboardLikelyOpen);
      if (keyboardLikelyOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      const isTextInput = isEditableElement(target);
      if (isTextInput) {
        setIsKeyboardOpen(true);
        setIsMenuOpen(false);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        if (menuOpenRef.current) return;
        const active = document.activeElement as HTMLElement | null;
        const stillEditing = isEditableElement(active);
        if (!stillEditing) {
          updateKeyboardState();
        }
      }, 120);
    };

    window.visualViewport?.addEventListener('resize', updateKeyboardState);
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    updateKeyboardState();

    return () => {
      window.visualViewport?.removeEventListener('resize', updateKeyboardState);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const navItems = [
    { icon: GraduationCap, label: 'Study', path: '/study' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: MenuIcon, label: 'Menu', path: '#menu', action: () => setIsMenuOpen(!isMenuOpen) },
  ];

  const menuLinks = [
    { icon: User, label: 'My Profile', path: '/account', gradient: 'from-violet-500 to-fuchsia-500 dark:from-violet-500 dark:to-fuchsia-500' },
    { icon: CircleDollarSign, label: 'Pricing', path: '/pricing', gradient: 'from-emerald-400 to-cyan-500 dark:from-emerald-400 dark:to-cyan-500' },
    { icon: Trophy, label: 'Achievements', path: '/achievements', gradient: 'from-amber-400 to-orange-500 dark:from-amber-400 dark:to-orange-500' },
    { icon: Settings, label: 'Settings', path: '/settings', gradient: 'from-slate-400 to-slate-600 dark:from-slate-400 dark:to-slate-500' },
  ];

  const isActive = (path: string) => {
    if (path === '#menu') return false;
    if (path === '/courses') {
      return location.pathname === '/courses' || location.pathname.startsWith('/courses/');
    }
    return location.pathname === path;
  };

  const NavItem = ({ icon: Icon, label, active, onClick, to }: {
    icon: typeof GraduationCap;
    label: string;
    active: boolean;
    onClick?: () => void;
    to?: string;
  }) => {
    const content = (
      <motion.div
        whileTap={{ scale: 0.88 }}
        className="flex flex-col items-center gap-1 py-2 px-3 min-w-[60px]"
      >
        <div className="relative flex items-center justify-center">
          {active && (
            <motion.div
              layoutId="nav-active-bg"
              className="absolute inset-0 -m-1.5 rounded-2xl bg-gradient-to-br from-fuchsia-500/15 to-pink-500/15 dark:from-cyan-500/15 dark:to-blue-500/15"
              transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            />
          )}
          <Icon
            className={`w-[22px] h-[22px] transition-all duration-200 relative z-10 ${
              active
                ? 'text-fuchsia-600 dark:text-cyan-400'
                : 'text-slate-500 dark:text-slate-500'
            }`}
            strokeWidth={active ? 2.5 : 1.75}
          />
        </div>
        <span
          className={`text-[10px] font-semibold tracking-wide transition-colors duration-200 ${
            active
              ? 'text-fuchsia-600 dark:text-cyan-400'
              : 'text-slate-400 dark:text-slate-500'
          }`}
        >
          {label}
        </span>
        {active && (
          <motion.div
            layoutId="nav-active-dot"
            className="absolute bottom-1 w-1 h-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 dark:from-cyan-400 dark:to-blue-500"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
      </motion.div>
    );

    if (to) {
      return (
        <NavLink to={to} className="relative flex items-center justify-center">
          {content}
        </NavLink>
      );
    }

    return (
      <button onClick={onClick} className="relative flex items-center justify-center">
        {content}
      </button>
    );
  };

  return (
    <>
      {/* Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && !isKeyboardOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 32 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[70] rounded-t-[28px] overflow-hidden pb-safe"
              style={{ background: 'var(--drawer-bg, white)' }}
            >
              {/* Glass background */}
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl" />

              {/* Gradient top accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-400 dark:from-cyan-400 dark:via-blue-500 dark:to-violet-500" />

              <div className="relative px-5 pt-3 pb-5">
                {/* Drag Handle */}
                <div className="flex justify-center mb-4">
                  <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>

                {/* User Profile Card */}
                {user && (
                  <Link
                    to="/account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3.5 p-3.5 mb-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 dark:from-slate-800/60 dark:to-slate-900/60 border border-slate-200/60 dark:border-white/8 active:scale-[0.98] transition-transform"
                  >
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 dark:from-cyan-400 dark:via-blue-500 dark:to-violet-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-md">
                      {user.username?.charAt(0).toUpperCase() ?? user.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{user.username ?? user.email}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
                  </Link>
                )}

                {/* Menu Items Grid */}
                <div className="space-y-1">
                  {menuLinks.map(({ icon: Icon, label, path, gradient }) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-white/5 transition-colors group"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <Icon className="w-[18px] h-[18px] text-white" strokeWidth={2} />
                      </div>
                      <span className="font-medium text-[15px]">{label}</span>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto opacity-0 group-active:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>

                {/* Logout */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/8">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3.5 px-4 py-3 rounded-2xl text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-950/30 transition-colors w-full"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <LogOut className="w-4 h-4 text-white" strokeWidth={2} />
                    </div>
                    <span className="font-medium text-[15px]">Log Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar - Mobile only */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: !isKeyboardOpen ? 0 : 120 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pb-safe"
      >
        {/* Gradient border top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent dark:via-cyan-700/40" />

        <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-around px-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  active={item.action ? isMenuOpen : active}
                  onClick={item.action}
                  to={item.action ? undefined : item.path}
                />
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
