/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // SUNRISE & MIDNIGHT DESIGN SYSTEM
        // ═══════════════════════════════════════════════════════════════════
        
        // ═══════════════════════════════════════════════════════════════════
        // BACKGROUND COLORS - Sunrise (Cream) & Midnight (Deep Blue/Black)
        // ═══════════════════════════════════════════════════════════════════
        'bg-light': '#FDFBF7',
        'bg-dark': '#000000',
        background: {
          light: '#FDFBF7', // Warm cream/paper
          'light-alt': '#F8F6F1',
          dark: '#000000', // True black
          'dark-alt': '#050505',
        },

        // ═══════════════════════════════════════════════════════════════════
        // TEXT COLORS - Warm for light, Crisp for dark
        // ═══════════════════════════════════════════════════════════════════
        'text-primary-light': '#1C1917', // Warm dark gray
        'text-primary-dark': '#FFFFFF', // Pure white
        'text-secondary-light': '#78716C',
        'text-secondary-dark': '#E5E7EB',

        // ═══════════════════════════════════════════════════════════════════
        // BORDER COLORS - Warm for light, Cool for dark
        // ═══════════════════════════════════════════════════════════════════
        'border-light': '#E7E5E4', // Warm border
        'border-dark': '#27272A', // Neutral dark border

        // ═══════════════════════════════════════════════════════════════════
        // SUNRISE GRADIENT - Fuchsia/Purple → Pink → Orange/Gold
        // ═══════════════════════════════════════════════════════════════════
        sunrise: {
          fuchsia: '#C026D3', // Fuchsia 600
          pink: '#EC4899', // Pink 500
          orange: '#F59E0B', // Amber 500
          gold: '#EAB308', // Yellow 500
        },

        // ═══════════════════════════════════════════════════════════════════
        // MIDNIGHT GRADIENT - Deep Violet → Royal Blue → Teal/Cyan
        // ═══════════════════════════════════════════════════════════════════
        midnight: {
          violet: '#5B21B6', // Violet 800
          blue: '#1D4ED8', // Blue 700
          royal: '#2563EB', // Blue 600
          teal: '#0891B2', // Cyan 600
          cyan: '#06B6D4', // Cyan 500
        },

        // ═══════════════════════════════════════════════════════════════════
        // LEGACY COMPATIBILITY - Map to new gradient colors
        // ═════════════════════════════════════════════════════════════════
        primary: {
          DEFAULT: '#C026D3', // Sunrise fuchsia for light mode
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

        secondary: {
          DEFAULT: '#EC4899', // Sunrise pink
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

        accent: {
          DEFAULT: '#06B6D4', // Midnight cyan
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

        // ═══════════════════════════════════════════════════════════════════
        // SURFACE TOKENS - Sunrise & Midnight
        // ═══════════════════════════════════════════════════════════════════
        surface: {
          light: '#FFFFFF',
          dark: '#050505',
        },
        'surface-highlight': {
          light: '#FEF9F3', // Warm white
          dark: '#0F0F12', // High-contrast dark highlight
        },
        'border-subtle': {
          light: '#F3F0EB',
          dark: '#27272A',
        },

        // Brand alias for backward compatibility (uses Sunrise gradient in light, Midnight in dark)
        brand: {
          50: '#FDF4FF',
          100: '#FAE8FF',
          200: '#F5D0FE',
          300: '#F0ABFC',
          400: '#E879F9',
          500: '#D946EF',
          600: '#C026D3',
          700: '#A21CAF',
          800: '#5B21B6', // Midnight violet
          900: '#4C1D95',
          950: '#2E1065',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Spacing scale (sm: 4, md: 8, lg: 16)
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.875rem', { lineHeight: '1.375rem' }],
        base: ['0.9375rem', { lineHeight: '1.7' }],
        lg: ['1.0625rem', { lineHeight: '1.7' }],
        xl: ['1.25rem', { lineHeight: '1.6' }],
        '2xl': ['1.5rem', { lineHeight: '1.5' }],
        '3xl': ['1.75rem', { lineHeight: '1.4' }],
        '4xl': ['2rem', { lineHeight: '1.3' }],
        '5xl': ['2.5rem', { lineHeight: '1.2' }],
      },
      // Border radius - rounded-2xl as standard
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // ═══════════════════════════════════════════════════════════════════
        // SHADOW PRESETS (Thea.study inspired)
        // ═══════════════════════════════════════════════════════════════════
        // light: shadow-sm → 0 4px 12px rgba(0,0,0,0.05)
        'sm': '0 4px 12px rgba(0, 0, 0, 0.05)',
        // medium: shadow-md → 0 8px 24px rgba(0,0,0,0.08)
        'md': '0 8px 24px rgba(0, 0, 0, 0.08)',

        // Ambient shadows - ultra-soft
        'xs': '0 1px 2px rgba(0, 0, 0, 0.02)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 4px 24px rgba(0, 0, 0, 0.05)',
        'soft-xl': '0 8px 32px rgba(0, 0, 0, 0.06)',
        'ambient': '0 4px 24px rgba(0, 0, 0, 0.05)',
        'ambient-lg': '0 8px 32px rgba(0, 0, 0, 0.06)',

        // Card shadows
        'card': '0 1px 8px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 20px rgba(0, 0, 0, 0.06)',

        // Button shadows (subtle primary glow)
        'button': '0 2px 8px rgba(59, 130, 246, 0.15)',
        'button-hover': '0 4px 16px rgba(59, 130, 246, 0.2)',

        // Glass effect
        'glass': '0 4px 24px rgba(0, 0, 0, 0.04)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        // ═══════════════════════════════════════════════════════════════════
        // MOTION PRESETS - Premium Glassmorphism
        // ═══════════════════════════════════════════════════════════════════
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'blur-in': 'blurIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'slow-spin': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        blurIn: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)' },
          '50%': { boxShadow: '0 0 25px rgba(124, 58, 237, 0.5)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.15)' 
          },
          '50%': { 
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)' 
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        'blur-in': 'blurIn 0.25s ease-out forwards',
        // Keep decorative ambient animations slow
        glowPulse: 'glowPulse 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        gradientX: 'gradientX 5s ease infinite',
        gradientShift: 'gradientShift 8s ease infinite',
        float: 'float 6s ease-in-out infinite',
        'slow-spin': 'spin 8s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      // hover-transition: background/color/box-shadow transition over 200ms ease-in-out
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'hover': '200ms',
        'theme': '300ms',
      },
      backdropBlur: {
        'xs': '2px',
      },
      // ═══════════════════════════════════════════════════════════════════
      // SUNRISE & MIDNIGHT GRADIENTS
      // ═══════════════════════════════════════════════════════════════════
      backgroundImage: {
        // SUNRISE GRADIENT (Light Mode) - Fuchsia → Pink → Orange/Gold
        'gradient-sunrise': 'linear-gradient(135deg, #C026D3 0%, #EC4899 50%, #F59E0B 100%)',
        'gradient-sunrise-soft': 'linear-gradient(135deg, rgba(192, 38, 211, 0.15) 0%, rgba(236, 72, 153, 0.15) 50%, rgba(245, 158, 11, 0.15) 100%)',
        
        // MIDNIGHT GRADIENT (Dark Mode) - Deep Violet → Royal Blue → Teal/Cyan
        'gradient-midnight': 'linear-gradient(135deg, #5B21B6 0%, #1D4ED8 50%, #06B6D4 100%)',
        'gradient-midnight-soft': 'linear-gradient(135deg, rgba(91, 33, 182, 0.2) 0%, rgba(29, 78, 216, 0.2) 50%, rgba(6, 182, 212, 0.2) 100%)',
        
        // Glass effects for Sunrise & Midnight
        'gradient-glass-sunrise': 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
        'gradient-glass-midnight': 'linear-gradient(180deg, rgba(91, 33, 182, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      addUtilities({
        '.pb-safe': {
          'padding-bottom': 'env(safe-area-inset-bottom, 0)',
        },
        '.h-safe': {
          'height': 'env(safe-area-inset-bottom, 0)',
        },
        '.pt-safe': {
          'padding-top': 'env(safe-area-inset-top, 0)',
        },
        // Hover transition preset: background/color/box-shadow/transform over 100ms ease-out
        '.hover-transition': {
          'transition-property': 'background-color, color, box-shadow, border-color, transform',
          'transition-duration': '100ms',
          'transition-timing-function': 'ease-out',
        },
        // Theme transition preset
        '.theme-transition': {
          'transition-property': 'background-color, color, border-color',
          'transition-duration': '300ms',
          'transition-timing-function': 'ease-out',
        },
      });
    },
  ],
};
