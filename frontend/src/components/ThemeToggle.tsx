import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md';
  includeMidnight?: boolean;
}

export default function ThemeToggle({ showLabel = false, size = 'md', includeMidnight = true }: ThemeToggleProps) {
  const { theme, resolvedThemeMode, setThemeMode } = useTheme();
  const isDark = theme === 'dark';

  const themeOrder = includeMidnight ? (['sunrise', 'sunset', 'midnight'] as const) : (['sunrise', 'sunset'] as const);
  const currentIndex = themeOrder.indexOf(resolvedThemeMode as any);
  const nextMode = themeOrder[(currentIndex + 1) % themeOrder.length];

  const modeLabel =
    resolvedThemeMode === 'sunrise'
      ? 'Sunrise'
      : resolvedThemeMode === 'sunset'
      ? 'Sunset'
      : 'Midnight';

  const nextModeLabel =
    nextMode === 'sunrise' ? 'Sunrise' : nextMode === 'sunset' ? 'Sunset' : 'Midnight';

  const toggleTheme = () => {
    setThemeMode(nextMode);
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const buttonPadding = size === 'sm' ? 'p-2' : 'p-2.5';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex items-center justify-center gap-2 ${buttonPadding} rounded-full overflow-hidden transition-all duration-150 shadow-lg ${
        resolvedThemeMode === 'midnight'
          ? 'bg-zinc-950 hover:bg-zinc-900'
          : resolvedThemeMode === 'sunset'
          ? 'bg-slate-800 hover:bg-slate-700'
          : 'bg-white hover:bg-slate-50'
      } border ${
        isDark ? 'border-slate-700' : 'border-slate-200'
      }`}
      title={`Switch to ${nextModeLabel} theme`}
      aria-label={`Switch to ${nextModeLabel} theme`}
    >
      {/* Animated background */}
      <motion.div
        className={`absolute inset-0 ${
          resolvedThemeMode === 'midnight'
            ? 'bg-gradient-to-r from-zinc-900 to-black'
            : resolvedThemeMode === 'sunset'
            ? 'bg-gradient-to-r from-slate-700 to-violet-800'
            : 'bg-gradient-to-r from-amber-100 to-orange-100'
        }`}
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Icon */}
      <div className="relative z-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={resolvedThemeMode}
            initial={{ y: -20, opacity: 0, rotate: -180 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 20, opacity: 0, rotate: 180 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            {resolvedThemeMode === 'sunrise' ? (
              <Sun className={`${iconSize} text-amber-500`} />
            ) : resolvedThemeMode === 'sunset' ? (
              <Moon className={`${iconSize} text-violet-200`} />
            ) : (
              <Moon className={`${iconSize} text-cyan-200`} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className={`relative z-10 text-sm font-medium ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {modeLabel}
        </span>
      )}
    </motion.button>
  );
}
