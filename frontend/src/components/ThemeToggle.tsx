import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '@/store/theme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center p-2 rounded-lg hover:bg-slate-200/20 dark:hover:bg-slate-700/20 transition-all duration-200"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      ) : (
        <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      )}
    </button>
  );
}
