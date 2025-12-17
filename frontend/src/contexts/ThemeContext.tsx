/**
 * Theme Context
 * Manages application theme (light/dark/system) with instant dark mode to prevent white flash
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

// Apply theme immediately to prevent flash - runs BEFORE React hydration
function applyThemeImmediately() {
  const saved = localStorage.getItem('themeMode') as ThemeMode | null;
  const mode = saved || 'system';
  const theme = mode === 'system' ? getSystemTheme() : (mode as Theme);
  
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

// Run immediately on module load
if (typeof window !== 'undefined') {
  applyThemeImmediately();
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

  // Apply theme to document immediately on mount and changes
  useEffect(() => {
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light', 'dark');

    // Apply current theme
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
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

    // Apply immediately to DOM
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
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
