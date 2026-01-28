/**
 * Thynkr Sunrise & Midnight Design System
 * ═══════════════════════════════════════════════════════════════════════════
 * Centralized theme configuration for the new dual-theme aesthetic.
 * 
 * Usage: Import tokens from this file for consistent design across components
 * 
 * Color Philosophy:
 * - Sunrise (Light): Warm Fuchsia/Pink/Orange gradient on cream backgrounds
 * - Midnight (Dark): Cool Violet/Blue/Cyan gradient on deep blue-black backgrounds
 * 
 * Typography Philosophy:
 * - Font: Inter / Plus Jakarta Sans - modern, highly readable
 * - Weights: 400-600 (avoiding heavy weights for softer feel)
 * - Line height: 1.6-1.7 for comfortable reading
 */

// =============================================================================
// COLOR TOKENS
// =============================================================================

export const colors = {
  // Background colors
  background: {
    light: '#FDFBF7', // Warm cream/paper
    dark: '#020617', // Deep midnight
  },

  // Text colors
  text: {
    light: {
      primary: '#1C1917', // Warm dark gray
      secondary: '#78716C',
    },
    dark: {
      primary: '#FAFAF9', // Crisp off-white
      secondary: '#D6D3D1',
    },
  },

  // Border colors
  border: {
    light: '#E7E5E4', // Warm border
    dark: '#1E3A8A', // Cool blue border
  },

  // Sunrise gradient colors (Light Mode)
  sunrise: {
    fuchsia: '#C026D3',
    pink: '#EC4899',
    orange: '#F59E0B',
    gold: '#EAB308',
  },

  // Midnight gradient colors (Dark Mode)
  midnight: {
    violet: '#5B21B6',
    blue: '#1D4ED8',
    royal: '#2563EB',
    teal: '#0891B2',
    cyan: '#06B6D4',
  },

  // Legacy compatibility - maps to Sunrise/Midnight
  primary: {
    DEFAULT: '#C026D3', // Sunrise fuchsia
    50: '#FDF4FF',
    100: '#FAE8FF',
    200: '#F5D0FE',
    300: '#F0ABFC',
    400: '#E879F9',
    500: '#D946EF',
    600: '#C026D3',
    700: '#A21CAF',
    800: '#86198F',
    900: '#701A75',
  },

  // Secondary - Sunrise pink / Midnight blue
  secondary: {
    DEFAULT: '#EC4899',
    50: '#FFF1F2',
    100: '#FFE4E6',
    200: '#FECDD3',
    300: '#FDA4AF',
    400: '#FB7185',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
    800: '#9F1239',
    900: '#881337',
  },

  // Accent - Midnight cyan
  accent: {
    DEFAULT: '#06B6D4',
    50: '#ECFEFF',
    100: '#CFFAFE',
    200: '#A5F3FC',
    300: '#67E8F9',
    400: '#22D3EE',
    500: '#06B6D4',
    600: '#0891B2',
    700: '#0E7490',
    800: '#155E75',
    900: '#164E63',
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
// SPACING TOKENS
// =============================================================================

export const spacing = {
  // Named spacing scale
  sm: '4px',     // 0.25rem
  md: '8px',     // 0.5rem
  lg: '16px',    // 1rem
  xl: '24px',    // 1.5rem
  '2xl': '32px', // 2rem
  '3xl': '48px', // 3rem

  // Semantic spacing
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
  xl: '1rem',           // 16px - standard element radius
  '2xl': '1.5rem',      // 24px - standard card/panel radius (rounded-2xl)
  '3xl': '2rem',        // 32px
  full: '9999px',
} as const;

// =============================================================================
// SHADOW TOKENS
// =============================================================================

export const shadows = {
  // Light shadows (Thea.study inspired - ultra-soft)
  sm: '0 4px 12px rgba(0, 0, 0, 0.05)',
  md: '0 8px 24px rgba(0, 0, 0, 0.08)',

  // Ambient shadows
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
// MOTION / TRANSITION TOKENS
// =============================================================================

export const motion = {
  // Duration presets
  duration: {
    fast: '100ms',
    base: '200ms',
    slow: '300ms',
    theme: '300ms',
  },

  // Timing functions
  easing: {
    default: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    premium: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Animation presets
  presets: {
    // Fade in: 0 → opacity 1 over 300ms ease-out
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: '300ms',
      easing: 'ease-out',
    },

    // Slide up: translateY 10px → 0 over 300ms
    slideUp: {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
      duration: '300ms',
      easing: 'ease-out',
    },

    // Hover transition: background/color/box-shadow over 200ms ease-in-out
    hoverTransition: {
      properties: ['background-color', 'color', 'box-shadow', 'border-color', 'transform'],
      duration: '100ms',
      easing: 'ease-out',
    },
  },
} as const;

// =============================================================================
// GRADIENT TOKENS
// =============================================================================

export const gradients = {
  // Primary gradient (purple to blue to cyan - aurora)
  primary: 'linear-gradient(135deg, #7C3AED 0%, #3B82F6 50%, #06B6D4 100%)',
  
  // Accent gradient (purple to cyan - brand)
  accent: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
  
  // Soft background gradients
  bgSoft: {
    light: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(6, 182, 212, 0.05) 100%)',
    dark: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.1) 50%, rgba(6, 182, 212, 0.1) 100%)',
  },
  
  // Mesh gradient (subtle radial patterns)
  mesh: {
    light: `
      radial-gradient(ellipse at 20% 20%, rgba(124, 58, 237, 0.04), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.04), transparent 50%)
    `,
    dark: `
      radial-gradient(ellipse at 20% 20%, rgba(124, 58, 237, 0.08), transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(6, 182, 212, 0.08), transparent 50%)
    `,
  },
} as const;

// =============================================================================
// CSS HELPER CLASSES
// =============================================================================

export const cssHelpers = {
  // Standard border radius class
  cardRadius: 'rounded-2xl',
  buttonRadius: 'rounded-xl',
  inputRadius: 'rounded-lg',

  // Standard shadows
  cardShadow: 'shadow-sm hover:shadow-md',
  
  // Transition helpers
  hoverTransition: 'transition-all duration-200 ease-in-out',
  themeTransition: 'transition-colors duration-300 ease-out',
} as const;

// =============================================================================
// THEME PRESET (Combined export)
// =============================================================================

export const themeConfig = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  motion,
  gradients,
  cssHelpers,
} as const;

// Type exports for TypeScript support
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof typography;
export type ThemeSpacing = typeof spacing;
export type ThemeBorderRadius = typeof borderRadius;
export type ThemeShadows = typeof shadows;
export type ThemeMotion = typeof motion;
export type ThemeGradients = typeof gradients;
export type ThemeConfig = typeof themeConfig;

export default themeConfig;
