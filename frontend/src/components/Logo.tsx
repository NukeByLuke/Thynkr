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
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  // Dark mode uses midnight colors, light mode uses sunrise colors
  const effectiveTheme = themeOverride || currentTheme;
  const brainSrc = effectiveTheme === 'dark' 
    ? '/brand/brain-dark.png' 
    : '/brand/brain-light.png';
  const wordmarkSrc = effectiveTheme === 'dark'
    ? '/brand/wordmark-dark.png'
    : '/brand/wordmark-light.png';

  // Size configurations for brain icon and wordmark
  const sizeConfig = {
    sm: { brain: 'h-6 w-6', wordmark: 'h-4', gap: 'gap-1.5' },
    md: { brain: 'h-8 w-8', wordmark: 'h-5', gap: 'gap-2' },
    lg: { brain: 'h-12 w-12', wordmark: 'h-7', gap: 'gap-3' },
    xl: { brain: 'h-16 w-16', wordmark: 'h-8', gap: 'gap-3' },
  };

  const sizes = sizeConfig[size] || sizeConfig.md;

  // Animation variants
  const motionProps = animated ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
  } : {};

  // Symbol variant - just the brain icon, no wrapper
  if (variant === 'symbol') {
    return (
      <motion.img
        src={brainSrc}
        alt="THYNKR"
        className={clsx('object-contain', sizes.brain, className)}
        {...motionProps}
      />
    );
  }

  // Icon variant - brain icon only with Link
  if (variant === 'icon') {
    return (
      <Link
        to="/"
        className={clsx('flex items-center select-none', className)}
        aria-label="THYNKR Home"
      >
        <motion.img
          src={brainSrc}
          alt="THYNKR"
          className={clsx('object-contain', sizes.brain)}
          {...motionProps}
        />
      </Link>
    );
  }

  // Full variant - brain icon + wordmark image with Link
  return (
    <Link
      to="/"
      className={clsx('group flex items-center select-none', sizes.gap, className)}
      aria-label="THYNKR Home"
    >
      <motion.img
        src={brainSrc}
        alt="THYNKR Brain"
        className={clsx('object-contain flex-shrink-0', sizes.brain)}
        {...motionProps}
      />
      <motion.img
        src={wordmarkSrc}
        alt="THYNKR"
        className={clsx('object-contain flex-shrink-0', sizes.wordmark)}
        {...motionProps}
      />
    </Link>
  );
}
