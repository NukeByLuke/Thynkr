/**
 * Thynkr Design Tokens
 * Centralized theme configuration inspired by Thea.study's calm, minimal aesthetic
 * 
 * Color Philosophy:
 * - Primary: Accessible blue (#3B82F6) - trust, clarity, focus
 * - Secondary: Gentle lavender (#A78BFA) - creativity, calm
 * - Accent: Calming cyan (#06B6D4) - energy, freshness
 * 
 * Typography Philosophy:
 * - Font: Inter / Plus Jakarta Sans - modern, highly readable
 * - Weights: 400-600 (avoiding heavy weights)
 * - Line height: 1.6-1.7 for comfortable reading
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const colors = {
  // Primary - accessible blue
  primary: {
    DEFAULT: '#3B82F6',
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

  // Secondary - gentle lavender
  secondary: {
    DEFAULT: '#A78BFA',
    50: '#FAF5FF',
    100: '#F3E8FF',
    200: '#E9D5FF',
    300: '#D8B4FE',
    400: '#C4B5FD',
    500: '#A78BFA', // Main secondary
    600: '#8B5CF6',
    700: '#7C3AED',
    800: '#6D28D9',
    900: '#4C1D95',
  },

  // Accent - calming cyan
  accent: {
    DEFAULT: '#06B6D4',
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

  // Background colors
  background: {
    light: {
      primary: '#F9FAFB',   // Main background
      secondary: '#F3F4F6', // Cards, panels
      tertiary: '#FFFFFF',  // Elevated surfaces
    },
    dark: {
      primary: '#0F172A',   // Main background
      secondary: '#1E293B', // Cards, panels
      tertiary: '#1F2937',  // Elevated surfaces
    },
  },

  // Text colors
  text: {
    light: {
      primary: '#111827',   // Headings, important text
      secondary: '#4B5563', // Body text
      tertiary: '#6B7280',  // Muted text
      inverted: '#FFFFFF',  // Text on dark surfaces
    },
    dark: {
      primary: '#F9FAFB',   // Headings, important text
      secondary: '#D1D5DB', // Body text
      tertiary: '#9CA3AF',  // Muted text
      inverted: '#111827',  // Text on light surfaces
    },
  },

  // Border colors
  border: {
    light: {
      DEFAULT: '#E5E7EB',
      subtle: '#F3F4F6',
    },
    dark: {
      DEFAULT: '#374151',
      subtle: '#1F2937',
    },
  },

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

// =============================================================================
// TYPOGRAPHY TOKENS
// =============================================================================

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
    display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
  },

  // Font weights (avoiding heavy weights for a softer feel)
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },

  // Font sizes with optimal line heights
  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1.125rem' },      // 12px
    sm: { size: '0.875rem', lineHeight: '1.375rem' },     // 14px
    base: { size: '0.9375rem', lineHeight: '1.6' },       // 15px
    lg: { size: '1.0625rem', lineHeight: '1.6' },         // 17px
    xl: { size: '1.25rem', lineHeight: '1.6' },           // 20px
    '2xl': { size: '1.5rem', lineHeight: '1.5' },         // 24px
    '3xl': { size: '1.875rem', lineHeight: '1.4' },       // 30px
    '4xl': { size: '2.25rem', lineHeight: '1.3' },        // 36px
    '5xl': { size: '3rem', lineHeight: '1.2' },           // 48px
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',     // Headings
    normal: '-0.005em',   // Body text
    wide: '0.025em',      // Small caps, labels
  },
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadows = {
  // Ambient shadows - ultra-soft (Thea.study inspired)
  ambient: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.02)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.03)',
    md: '0 4px 16px rgba(0, 0, 0, 0.04)',
    lg: '0 4px 24px rgba(0, 0, 0, 0.05)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.06)',
  },

  // Card shadows
  card: {
    DEFAULT: '0 1px 8px rgba(0, 0, 0, 0.03)',
    hover: '0 4px 20px rgba(0, 0, 0, 0.06)',
  },

  // Button shadows (subtle primary glow)
  button: {
    DEFAULT: '0 2px 8px rgba(59, 130, 246, 0.15)',
    hover: '0 4px 16px rgba(59, 130, 246, 0.2)',
  },

  // Glass effect
  glass: '0 4px 24px rgba(0, 0, 0, 0.04)',

  // Focus ring
  focus: '0 0 0 3px rgba(59, 130, 246, 0.3)',
} as const;

// =============================================================================
// SPACING TOKENS
// =============================================================================

export const spacing = {
  section: '3rem',      // 48px - between major sections
  card: '1.5rem',       // 24px - card padding
  element: '1rem',      // 16px - between elements
  tight: '0.5rem',      // 8px - tight spacing
  xs: '0.25rem',        // 4px - minimal spacing
} as const;

// =============================================================================
// BORDER RADIUS TOKENS
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.375rem',       // 6px
  DEFAULT: '0.5rem',    // 8px
  md: '0.625rem',       // 10px
  lg: '0.75rem',        // 12px
  xl: '1rem',           // 16px
  '2xl': '1.25rem',     // 20px
  '3xl': '1.5rem',      // 24px
  full: '9999px',
} as const;

// =============================================================================
// TRANSITION TOKENS
// =============================================================================

export const transitions = {
  // Durations
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    theme: '300ms',
  },

  // Timing functions
  timing: {
    ease: 'ease-out',
    premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

// =============================================================================
// GRADIENT TOKENS
// =============================================================================

export const gradients = {
  // Primary gradient (blue to lavender)
  primary: 'linear-gradient(135deg, #3B82F6 0%, #A78BFA 100%)',
  
  // Accent gradient (purple to cyan - brand)
  accent: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
  
  // Soft background gradients
  bgSoft: {
    light: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(167, 139, 250, 0.05) 100%)',
    dark: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)',
  },
  
  // Mesh gradient (subtle radial patterns)
  mesh: {
    light: `
      radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.04), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(167, 139, 250, 0.04), transparent 50%)
    `,
    dark: `
      radial-gradient(ellipse at 20% 20%, rgba(59, 130, 246, 0.08), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(167, 139, 250, 0.08), transparent 50%)
    `,
  },
} as const;

// =============================================================================
// THEME PRESET (Combined export)
// =============================================================================

export const themeConfig = {
  colors,
  typography,
  shadows,
  spacing,
  borderRadius,
  transitions,
  gradients,
} as const;

export default themeConfig;
