import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  GraduationCap,
  MessageSquare,
  TrendingUp,
  Settings,
  Plus,
  Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(currentTime);
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: GraduationCap, label: 'Study', path: '/study' },
    { icon: MessageSquare, label: 'AI Tutor', path: '/tutor' },
    { icon: TrendingUp, label: 'Progress', path: '/progress' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/study';
    }
    return location.pathname.startsWith(path);
  };

  const handleCreateCourse = () => {
    navigate('/courses');
    // The CoursesUnified component will handle showing the create modal
    setTimeout(() => {
      const createButton = document.querySelector(
        '[aria-label="Create new course"]'
      ) as HTMLButtonElement;
      if (createButton) createButton.click();
    }, 100);
  };

  return (
    <>
      {/* Top-right Mini Clock */}
      <div className="lg:hidden fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
        <Clock className="w-3.5 h-3.5 text-brand-500" />
        <span className="text-xs font-semibold text-gray-900 dark:text-white">{formatTime()}</span>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="relative flex items-center justify-around h-20 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full relative group ${
                  index === 2 ? 'invisible' : '' // Hide middle item for FAB space
                }`}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className="flex flex-col items-center justify-center gap-1"
                >
                  <div
                    className={`p-2 rounded-xl transition-all ${
                      active
                        ? 'bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-500/30'
                        : 'bg-transparent'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-gray-500 dark:text-gray-400 group-active:text-gray-700 dark:group-active:text-gray-300'
                      }`}
                    />
                  </div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      active
                        ? 'text-brand-600 dark:text-brand-400'
                        : 'text-gray-500 dark:text-gray-400 group-active:text-gray-700 dark:group-active:text-gray-300'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}

          {/* Floating "+ Course" Button (Center) */}
          <motion.button
            onClick={handleCreateCourse}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center justify-center"
            aria-label="Create new course"
          >
            <div className="relative">
              {/* Outer glow ring */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-400 to-accent-400 rounded-full blur-md opacity-60 animate-pulse" />

              {/* Main button */}
              <div className="relative w-14 h-14 bg-gradient-to-br from-brand-500 to-accent-500 rounded-full shadow-2xl shadow-brand-500/50 flex items-center justify-center border-4 border-white dark:border-gray-900">
                <Plus className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
              Course
            </span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}
