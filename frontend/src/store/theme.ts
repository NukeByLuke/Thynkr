import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Get initial theme from localStorage or default to light
const getInitialTheme = (): Theme => {
  const saved = localStorage.getItem('theme') as Theme | null;
  if (saved) {
    // Apply theme immediately on page load
    document.documentElement.classList.toggle('dark', saved === 'dark');
    return saved;
  }
  return 'light';
};

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      return { theme: newTheme };
    }),

  setTheme: (theme: Theme) =>
    set(() => {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
      return { theme };
    }),
}));
