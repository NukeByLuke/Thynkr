/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════════════════════════
        // BRAND NAVY - Primary identity color (#1E1B4B)
        // ═══════════════════════════════════════════════════════════════════
        navy: {
          DEFAULT: '#1E1B4B',
          50: '#EEEDF7',
          100: '#DDDCEF',
          200: '#BBB8DF',
          300: '#9995CF',
          400: '#7771BF',
          500: '#554EAF',
          600: '#433E8C',
          700: '#322F69',
          800: '#1E1B4B',
          900: '#141236',
        },

        // ═══════════════════════════════════════════════════════════════════
        // BACKGROUND COLORS
        // ═══════════════════════════════════════════════════════════════════
        'bg-light': '#F9FAFB',
        'bg-dark': '#1E293B',
        background: {
          light: '#F9FAFB',
          'light-alt': '#F3F4F6',
          dark: '#1E293B',
          'dark-alt': '#0F172A',
        },

        // ═══════════════════════════════════════════════════════════════════
        // TEXT COLORS
        // ═══════════════════════════════════════════════════════════════════
        'text-primary-light': '#111827',
        'text-primary-dark': '#F1F5F9',
        'text-secondary-light': '#6B7280',
        'text-secondary-dark': '#9CA3AF',

        // ═══════════════════════════════════════════════════════════════════
        // BORDER COLORS
        // ═══════════════════════════════════════════════════════════════════
        'border-light': '#E5E7EB',
        'border-dark': '#374151',

        // ═══════════════════════════════════════════════════════════════════
        // PRIMARY ACCENT - accessible blue (#3B82F6)
        // ═══════════════════════════════════════════════════════════════════
        primary: {
          DEFAULT: '#3B82F6',
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },

        // ═══════════════════════════════════════════════════════════════════
        // SECONDARY ACCENT - gentle lavender (#A78BFA)
        // ═══════════════════════════════════════════════════════════════════
        secondary: {
          DEFAULT: '#A78BFA',
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C4B5FD',
          500: '#A78BFA',
          600: '#8B5CF6',
          700: '#7C3AED',
          800: '#6D28D9',
          900: '#4C1D95',
        },

        // ═══════════════════════════════════════════════════════════════════
        // ACCENT - calming cyan (#06B6D4)
        // ═══════════════════════════════════════════════════════════════════
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

        // ═══════════════════════════════════════════════════════════════════
        // AURORA DESIGN SYSTEM - Thynkr Brand Colors
        // ═══════════════════════════════════════════════════════════════════
        'thynkr-blue': '#3b82f6',
        'thynkr-purple': '#8b5cf6',
        'thynkr-cyan': '#06b6d4',

        // ═══════════════════════════════════════════════════════════════════
        // AURORA THEME TOKENS
        // ═══════════════════════════════════════════════════════════════════
        surface: {
          light: '#ffffff',
          dark: '#0f172a',
        },
        'surface-highlight': {
          light: '#f8fafc',
          dark: '#1e293b',
        },
        'border-subtle': {
          light: '#e2e8f0',
          dark: '#334155',
        },

        // ═══════════════════════════════════════════════════════════════════
        // SEMANTIC COLORS
        // ═══════════════════════════════════════════════════════════════════
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',

        // Brand alias (for backward compatibility)
        brand: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C4B5FD',
          500: '#A78BFA',
          600: '#8B5CF6',
          700: '#7C3AED',
          800: '#6D28D9',
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
        // MOTION PRESETS
        // ═══════════════════════════════════════════════════════════════════
        // fade-in: 0 → opacity 1 over 300ms ease-out
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        // slide-up: translateY 10px → 0 over 300ms
        'slide-up': 'slideUp 0.3s ease-out',
        'blur-in': 'blurIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'gradient-x': 'gradientX 8s ease infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
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
      // AURORA GRADIENTS
      // ═══════════════════════════════════════════════════════════════════
      backgroundImage: {
        'gradient-aurora': 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
        'gradient-aurora-hover': 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
        'gradient-glass': 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
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
        // Hover transition preset: background/color/box-shadow over 200ms ease-in-out
        '.hover-transition': {
          'transition-property': 'background-color, color, box-shadow, border-color',
          'transition-duration': '200ms',
          'transition-timing-function': 'ease-in-out',
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
