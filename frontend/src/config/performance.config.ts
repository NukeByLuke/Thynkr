/**
 * Performance Configuration
 * Global settings to optimize animation performance and reduce perceived lag
 */

/**
 * Framer Motion Performance Settings
 * Ultra-fast durations for instant, snappy feel
 */
export const ANIMATION_CONFIG = {
  // Ultra-fast transitions for UI elements (buttons, hover states)
  fast: {
    duration: 0.08,
    ease: 'easeOut',
  },

  // Standard transitions for most interactions
  standard: {
    duration: 0.12,
    ease: 'easeInOut',
  },

  // Page transitions - still quick
  page: {
    duration: 0.15,
    ease: 'easeInOut',
  },

  // Spring animations (more natural feel, faster)
  spring: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 35,
  },

  // Bouncy spring for playful interactions (snappier)
  springBouncy: {
    type: 'spring' as const,
    stiffness: 600,
    damping: 28,
  },
} as const;

/**
 * Common Animation Variants
 * Reusable for consistency
 */
export const FADE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: ANIMATION_CONFIG.fast },
  exit: { opacity: 0, transition: { duration: 0.05 } },
};

export const SLIDE_UP_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: ANIMATION_CONFIG.standard },
  exit: { opacity: 0, y: -10, transition: { duration: 0.05 } },
};

export const SCALE_VARIANTS = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: ANIMATION_CONFIG.fast },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.05 } },
};

/**
 * Disable animations based on user preference or device capability
 */
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get animation config with reduced motion support
 */
export const getAnimationConfig = (config: typeof ANIMATION_CONFIG.standard) => {
  return shouldReduceMotion() ? { duration: 0 } : config;
};
