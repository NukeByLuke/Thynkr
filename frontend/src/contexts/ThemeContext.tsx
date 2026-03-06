/**
 * Theme Context
 * Supports sunrise (light), sunset (dark), midnight (deep dark), and system preference.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

type Theme = 'light' | 'dark';
type AppliedThemeMode = 'sunrise' | 'sunset' | 'midnight';
type NormalizedThemeMode = AppliedThemeMode | 'system';
type ThemeMode = NormalizedThemeMode | 'light' | 'dark' | 'black';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  resolvedThemeMode: AppliedThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function normalizeThemeMode(mode: string | null | undefined): NormalizedThemeMode {
  if (!mode) return 'system';

  if (mode === 'light' || mode === 'sunrise') return 'sunrise';
  if (mode === 'dark' || mode === 'sunset') return 'sunset';
  if (mode === 'black' || mode === 'midnight') return 'midnight';
  return 'system';
}

function getSystemThemeMode(): AppliedThemeMode {
  if (typeof window === 'undefined') return 'sunrise';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'sunset' : 'sunrise';
}

function resolveThemeMode(mode: NormalizedThemeMode): AppliedThemeMode {
  return mode === 'system' ? getSystemThemeMode() : mode;
}

function getThemeFromMode(mode: AppliedThemeMode): Theme {
  return mode === 'sunrise' ? 'light' : 'dark';
}

function applyThemeToDom(mode: AppliedThemeMode) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const body = document.body;
  const theme = getThemeFromMode(mode);

  root.classList.remove('light', 'dark');
  body?.classList.remove('light', 'dark');

  root.setAttribute('data-theme', mode);
  body?.setAttribute('data-theme', mode);

  if (theme === 'dark') {
    root.classList.add('dark');
    body?.classList.add('dark');
  } else {
    root.classList.add('light');
    body?.classList.add('light');
  }
}

function applyThemeImmediately() {
  const savedMode = normalizeThemeMode(localStorage.getItem('themeMode'));
  applyThemeToDom(resolveThemeMode(savedMode));
}

if (typeof window !== 'undefined') {
  applyThemeImmediately();
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  const [themeMode, setThemeModeState] = useState<NormalizedThemeMode>(() =>
    normalizeThemeMode(localStorage.getItem('themeMode'))
  );

  const [resolvedThemeMode, setResolvedThemeMode] = useState<AppliedThemeMode>(() =>
    resolveThemeMode(normalizeThemeMode(localStorage.getItem('themeMode')))
  );

  const theme = getThemeFromMode(resolvedThemeMode);

  useEffect(() => {
    applyThemeToDom(resolvedThemeMode);
  }, [resolvedThemeMode]);

  useEffect(() => {
    if (themeMode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setResolvedThemeMode(getSystemThemeMode());
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  useEffect(() => {
    if (isAuthenticated && user?.theme) {
      const savedMode = localStorage.getItem('themeMode');
      if (!savedMode) {
        const normalizedUserMode = normalizeThemeMode(String(user.theme));
        setThemeModeState(normalizedUserMode);
        setResolvedThemeMode(resolveThemeMode(normalizedUserMode));
        localStorage.setItem('themeMode', normalizedUserMode);
      }
    }
  }, [isAuthenticated, user?.theme]);

  const setThemeMode = (mode: ThemeMode) => {
    const normalizedMode = normalizeThemeMode(mode);
    const nextResolvedMode = resolveThemeMode(normalizedMode);

    setThemeModeState(normalizedMode);
    setResolvedThemeMode(nextResolvedMode);
    localStorage.setItem('themeMode', normalizedMode);

    if (isAuthenticated && normalizedMode !== 'system') {
      api.patch('/auth/profile', { theme: normalizedMode }).catch(console.error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, resolvedThemeMode, setThemeMode }}>
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
