/**
 * Theme Context
 * Manages application theme (light/dark/system) with persistence and system preference detection.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

type Theme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme; // The actual applied theme (light or dark)
  themeMode: ThemeMode; // User's preference (light, dark, or system)
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get system theme preference
function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // Initialize themeMode from localStorage or default to 'system'
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode | null;
    return saved || 'system';
  });

  // Calculate the actual theme to apply based on mode
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('themeMode') as ThemeMode | null;
    const mode = saved || 'system';

    if (mode === 'system') {
      return getSystemTheme();
    }
    return mode as Theme;
  });

  // Apply theme to document (html and body) so no stale 'dark' class lingers anywhere
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Normalize: remove both then re-apply only what we need
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.add('light');
      body.classList.add('light');
    }
  }, [theme]);

  // Listen for system theme changes (only when mode is 'system')
  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Sync with user's saved theme on login (only once, only if no local preference)
  useEffect(() => {
    if (isAuthenticated && user?.theme) {
      const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
      if (!savedMode) {
        // First login - use user's saved preference from DB
        const userTheme = user.theme as Theme;
        setThemeModeState(userTheme);
        setThemeState(userTheme);
        localStorage.setItem('themeMode', userTheme);
      }
    }
  }, [isAuthenticated, user?.theme]);

  const setThemeMode = (mode: ThemeMode) => {
    // Calculate actual theme to apply
    const newTheme = mode === 'system' ? getSystemTheme() : (mode as Theme);

    // IMMEDIATELY apply to DOM (both html and body) without waiting for state
    const root = document.documentElement;
    const body = document.body;

    // Force a reflow by removing and re-adding classes with a tiny delay
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');

    // Force browser repaint
    void root.offsetHeight;

    if (newTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
    } else {
      root.classList.add('light');
      body.classList.add('light');
    }

    // Update state
    setThemeModeState(mode);
    setThemeState(newTheme);
    localStorage.setItem('themeMode', mode);

    // Save to backend if authenticated
    if (isAuthenticated) {
      api.patch('/auth/profile', { theme: newTheme }).catch(console.error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
