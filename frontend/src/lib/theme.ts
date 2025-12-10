/**
 * Thynkr Design System
 * 
 * Centralized theme values modeled after Thea.study for consistent styling.
 * All components should reference these tokens for visual consistency.
 */

/**
 * Core theme object with Thea-inspired design tokens
 */
export const theme = {
  colors: {
    // Primary palette
    primary: '#1E1B4B',          // Deep indigo - main brand color
    accentBlue: '#3B82F6',       // Blue-500 - interactive elements
    accentPurple: '#A78BFA',     // Purple-400 - highlights, gradients
    
    // Surfaces
    surface: '#FFFFFF',          // Card backgrounds
    background: '#F9FAFB',       // Page backgrounds (gray-50)
    
    // Borders
    border: '#E5E7EB',           // Default border (gray-200)
    borderLight: '#F3F4F6',      // Subtle border (gray-100)
    borderFocus: '#3B82F6',      // Focus state border
    
    // Text
    textPrimary: '#111827',      // Headings (gray-900)
    textSecondary: '#6B7280',    // Body text (gray-500)
    textMuted: '#9CA3AF',        // Placeholder text (gray-400)
    
    // State colors
    success: '#10B981',          // Green-500
    warning: '#F59E0B',          // Amber-500
    error: '#EF4444',            // Red-500
    info: '#3B82F6',             // Blue-500
  },
  
  // Border radius scale (in rem)
  radius: {
    sm: '0.375rem',    // 6px - small elements
    md: '0.5rem',      // 8px - inputs, small cards
    lg: '0.75rem',     // 12px - buttons
    xl: '1rem',        // 16px - cards
    '2xl': '1.5rem',   // 24px - large cards, modals
    full: '9999px',    // Pill shapes
  },
  
  // Shadow scale
  shadows: {
    none: 'none',
    soft: '0 4px 20px rgba(0, 0, 0, 0.05)',
    medium: '0 6px 24px rgba(0, 0, 0, 0.08)',
    lg: '0 10px 40px rgba(0, 0, 0, 0.12)',
    focus: '0 0 0 3px rgba(59, 130, 246, 0.3)',
  },
  
  // Transition presets
  transition: {
    fast: 'all 0.15s ease-in-out',
    default: 'all 0.2s ease-in-out',
    slow: 'all 0.3s ease-in-out',
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Menlo, monospace',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
  },
  
  // Spacing scale (in rem, based on 4px increments)
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// Legacy exports for backwards compatibility
export const colors = {
  primary: {
    50: '#EEF2FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#1E1B4B',
  },
  
  dark: {
    background: '#1E293B',
    surface: '#334155',
    border: '#475569',
    muted: '#64748b',
  },
  
  light: {
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    muted: '#9CA3AF',
  },
} as const;

export const spacing = theme.spacing;
export const borderRadius = theme.radius;
export const shadows = theme.shadows;
export const transitions = theme.transition;
export const breakpoints = theme.breakpoints;

export type Theme = 'light' | 'dark' | 'system';
export const defaultTheme: Theme = 'system';

