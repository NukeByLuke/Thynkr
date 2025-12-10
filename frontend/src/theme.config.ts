/**
 * Thynkr Design Tokens
 * Centralized theme configuration matching Thea.study's calm, minimal aesthetic
 * 
 * Usage: Import this file to access consistent design tokens across components
 */

export const theme = {
  // ═══════════════════════════════════════════════════════════════════════════
  // COLORS
  // ═══════════════════════════════════════════════════════════════════════════
  colors: {
    // Primary brand color - friendly blue
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // Main primary
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },

    // Secondary - soft purple/lavender
    secondary: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA', // Main secondary
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },

    // Accent - calm cyan/teal
    accent: {
      50: '#ECFEFF',
      100: '#CFFAFE',
      200: '#A5F3FC',
      300: '#67E8F9',
      400: '#22D3EE',
      500: '#06B6D4', // Main accent
      600: '#0891B2',
      700: '#0E7490',
      800: '#155E75',
      900: '#164E63',
    },

    // Backgrounds
    background: {
      light: '#F9FAFB',
      lightAlt: '#F3F4F6',
      dark: '#0F172A',
      darkAlt: '#1E293B',
    },

    // Text colors
    text: {
      light: {
        primary: '#111827',
        secondary: '#4B5563',
        tertiary: '#9CA3AF',
      },
      dark: {
        primary: '#F9FAFB',
        secondary: '#D1D5DB',
        tertiary: '#6B7280',
      },
    },

    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════════════════════
  typography: {
    // Font families
    fontFamily: {
      sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },

    // Font sizes with line heights
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.6' }],        // 16px
      lg: ['1.125rem', { lineHeight: '1.6' }],      // 18px
      xl: ['1.25rem', { lineHeight: '1.6' }],       // 20px
      '2xl': ['1.5rem', { lineHeight: '1.4' }],     // 24px
      '3xl': ['1.875rem', { lineHeight: '1.3' }],   // 30px
      '4xl': ['2.25rem', { lineHeight: '1.2' }],    // 36px
      '5xl': ['3rem', { lineHeight: '1.1' }],       // 48px
    },

    // Font weights
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
    },

    // Letter spacing
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SHADOWS
  // ═══════════════════════════════════════════════════════════════════════════
  shadows: {
    // Subtle ambient shadows for a soft, airy feel
    xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
    md: '0 4px 16px rgba(0, 0, 0, 0.05)',
    lg: '0 4px 24px rgba(0, 0, 0, 0.05)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.06)',
    
    // Card shadows
    card: '0 2px 12px rgba(0, 0, 0, 0.04)',
    cardHover: '0 4px 20px rgba(0, 0, 0, 0.06)',
    
    // Button shadows
    button: '0 2px 8px rgba(59, 130, 246, 0.15)',
    buttonHover: '0 4px 12px rgba(59, 130, 246, 0.2)',
    
    // Dark mode shadows
    dark: {
      sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
      md: '0 4px 16px rgba(0, 0, 0, 0.4)',
      lg: '0 4px 24px rgba(0, 0, 0, 0.5)',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPACING & BORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  spacing: {
    borderRadius: {
      sm: '0.375rem',   // 6px
      md: '0.5rem',     // 8px
      lg: '0.75rem',    // 12px
      xl: '1rem',       // 16px
      '2xl': '1.5rem',  // 24px
      full: '9999px',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TRANSITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
} as const;

// Type exports for TypeScript support
export type ThemeColors = typeof theme.colors;
export type ThemeTypography = typeof theme.typography;
export type ThemeShadows = typeof theme.shadows;
export type Theme = typeof theme;

export default theme;
