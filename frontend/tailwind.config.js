/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        // Primary - soft welcoming blue (Thea.study inspired)
        primary: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#60A5FA', // Softer main primary
          600: '#3B82F6',
          700: '#2563EB',
          800: '#1D4ED8',
          900: '#1E3A8A',
        },
        // Secondary - gentle lavender/purple
        secondary: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C4B5FD', // Softer main secondary
          500: '#A78BFA',
          600: '#8B5CF6',
          700: '#7C3AED',
          800: '#6D28D9',
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
        // Brand alias (for gradients - purple to cyan)
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C3AED',
          600: '#6D28D9',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B1483',
        },
        // Background colors (warmer, calmer)
        background: {
          light: '#FAFBFC',
          'light-alt': '#F5F7FA',
          dark: '#0F172A',
          'dark-alt': '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      // Generous spacing
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontSize: {
        // Base sizes with optimal line heights and relaxed spacing
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
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        // Ultra-soft ambient shadows (calm, welcoming)
        'xs': '0 1px 2px rgba(0, 0, 0, 0.02)',
        'soft': '0 2px 8px rgba(0, 0, 0, 0.03)',
        'soft-md': '0 4px 16px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 6px 24px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 8px 32px rgba(0, 0, 0, 0.05)',
        // Card shadows (minimal, clean)
        'card': '0 1px 8px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.05)',
        // Button shadows (subtle primary glow)
        'button': '0 2px 8px rgba(96, 165, 250, 0.12)',
        'button-hover': '0 4px 12px rgba(96, 165, 250, 0.18)',
        // Glass effect (very light)
        'glass': '0 4px 24px rgba(0, 0, 0, 0.03)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
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
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
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
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backdropBlur: {
        'xs': '2px',
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
      });
    },
  ],
};
