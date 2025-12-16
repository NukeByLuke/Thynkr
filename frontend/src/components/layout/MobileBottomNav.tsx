import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FolderOpen, MessageCircle, Award, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 50) {
        // Always show at top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide
        setIsVisible(false);
      } else {
        // Scrolling up - show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    ...(user?.role === 'ADMIN' ? [{ icon: BarChart3, label: 'Admin', path: '/admin' }] : []),
    { icon: BookOpen, label: 'Study', path: '/study' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: Award, label: 'Achievements', path: '/achievements' },
    { icon: FolderOpen, label: 'Files', path: '/files' },
    { icon: MessageCircle, label: 'Tutor', path: '/tutor' },
  ];

  const isActive = (path: string) => {
    if (path === '/courses') {
      return location.pathname === '/courses' || location.pathname.startsWith('/courses/');
    }
    return location.pathname.startsWith(path);
  };

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0f172a]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-2px_10px_rgba(0,0,0,0.2)]"
    >
      <div className="flex items-center justify-around px-2 py-3 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-center group min-w-[60px]"
            >
              {/* Active indicator line at top */}
              {active && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] rounded-full transition-all duration-300 ease-in-out"
                  style={{
                    boxShadow: '0 0 8px rgba(124, 58, 237, 0.6)',
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <motion.div
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
                className="relative"
              >
                {/* Active gradient glow behind icon */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#3b82f6] rounded-2xl blur-md opacity-30" />
                )}

                <div
                  className={`relative flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${
                    active
                      ? 'bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#3b82f6] text-white shadow-[0_0_15px_rgba(124,58,237,0.4)]'
                      : 'bg-transparent text-gray-400 group-active:bg-white/5 group-hover:text-white'
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
              </motion.div>

              <span
                className={`mt-1 text-[10px] font-medium transition-colors text-center ${
                  active ? 'text-white' : 'text-gray-400 group-hover:text-white'
                }`}
              >
                {item.label}
              </span>

              {/* Touch feedback ripple */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                whileTap={{ scale: 1.5, opacity: [0, 0.3, 0] }}
                className="absolute inset-0 bg-[#7c3aed] rounded-full pointer-events-none"
              />
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
