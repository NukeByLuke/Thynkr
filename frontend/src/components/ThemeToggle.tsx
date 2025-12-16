import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function ThemeToggle({ showLabel = false, size = 'md' }: ThemeToggleProps) {
  const { theme, setThemeMode } = useTheme();
  const isDark = theme === 'dark';
  
  const toggleTheme = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonPadding = size === 'sm' ? 'p-1.5' : 'p-2';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`flex items-center justify-center gap-2 ${buttonPadding} rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white/90 dark:hover:bg-slate-700/90 border border-slate-200/50 dark:border-white/10 backdrop-blur-xl transition-all duration-200 shadow-lg`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -10, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 10, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {isDark ? (
            <Sun className={`${iconSize} text-amber-400`} />
          ) : (
            <Moon className={`${iconSize} text-slate-700`} />
          )}
        </motion.div>
      </AnimatePresence>
      {showLabel && (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </motion.button>
  );
}
