/**
 * Thynkr Unified Logo Component
 * Single source of truth for all logo usage throughout the app
 * Uses official brand assets from /public/brand/ with Framer Motion animations
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useTheme } from '@/contexts/ThemeContext';

interface LogoProps {
  /**
   * Logo variant:
   * - 'full': Logo image + "Thynkr" text (default)
   * - 'icon': Logo image only with Link wrapper
   * - 'symbol': Logo image only without Link (for embedding)
   */
  variant?: 'full' | 'icon' | 'symbol';
  className?: string;
  /**
   * Enable hover/tap animations
   */
  animated?: boolean;
  /**
   * Force a specific theme for the logo
   * - undefined: auto-detect from ThemeContext
   * - 'light': use light theme assets (for dark backgrounds)
   * - 'dark': use dark theme assets (for light backgrounds)
   */
  theme?: 'light' | 'dark';
  /**
   * Size preset for quick sizing
   */
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ 
  variant = 'full', 
  className, 
  animated = true,
  theme: themeOverride,
  size = 'md',
}: LogoProps) {
  const { theme: currentTheme } = useTheme();
  
  // Determine which theme's assets to use
  // If on dark mode, we want the light logo (white/light colored)
  // If on light mode, we want the dark logo (dark colored)
  const effectiveTheme = themeOverride || currentTheme;
  const logoSrc = effectiveTheme === 'dark' 
    ? '/brand/logo-dark.png' 
    : '/brand/logo-light.png';

  // Size configurations
  const sizeConfig = {
    sm: { logo: 'h-6 w-6', text: 'text-base', gap: 'gap-1.5' },
    md: { logo: 'h-8 w-8', text: 'text-xl', gap: 'gap-2' },
    lg: { logo: 'h-12 w-12', text: 'text-2xl', gap: 'gap-3' },
  };

  const sizes = sizeConfig[size];

  // Text color based on theme
  const textColorClass = effectiveTheme === 'dark' 
    ? 'text-white' 
    : 'text-slate-900';

  // Animation variants
  const motionProps = animated ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  } : {};

  // Symbol variant - just the image, no wrapper
  if (variant === 'symbol') {
    return (
      <motion.img
        src={logoSrc}
        alt="Thynkr"
        className={clsx('object-contain', sizes.logo, className)}
        {...motionProps}
      />
    );
  }

  // Icon variant - logo image only with Link
  if (variant === 'icon') {
    return (
      <Link
        to="/"
        className={clsx('flex items-center select-none', className)}
        aria-label="Thynkr Home"
      >
        <motion.img
          src={logoSrc}
          alt="Thynkr"
          className={clsx('object-contain', sizes.logo)}
          {...motionProps}
        />
      </Link>
    );
  }

  // Full variant - logo + text with Link
  return (
    <Link
      to="/"
      className={clsx('group flex items-center select-none', sizes.gap, className)}
      aria-label="Thynkr Home"
    >
      <motion.img
        src={logoSrc}
        alt="Thynkr"
        className={clsx('object-contain flex-shrink-0', sizes.logo)}
        {...motionProps}
      />
      <span
        className={clsx(
          'font-bold tracking-tight transition-colors',
          sizes.text,
          textColorClass
        )}
        style={{
          fontFamily: "'Inter', 'Geist', sans-serif",
          letterSpacing: '-0.03em',
        }}
      >
        THYNKR
      </span>
    </Link>
  );
}
