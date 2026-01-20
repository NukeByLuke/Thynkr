/**
 * Performance Configuration
 * Global settings to optimize animation performance and reduce perceived lag
 */

/**
 * Framer Motion Performance Settings
 * Ultra-fast durations for instant, snappy feel
 */
/**
 * Aggressive easeOut curve for immediate visual feedback
 * Starts fast, decelerates smoothly - feels responsive
 */
const EASE_OUT_AGGRESSIVE = [0.25, 0.1, 0.25, 1.0] as const;
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const ANIMATION_CONFIG = {
  // Ultra-fast transitions for UI elements (buttons, hover states)
  fast: {
    duration: 0.06,
    ease: EASE_OUT_AGGRESSIVE,
  },

  // Standard transitions - aggressive easeOut for immediate feedback
  standard: {
    duration: 0.1,
    ease: EASE_OUT_AGGRESSIVE,
  },

  // Page transitions - still quick with expo easing
  page: {
    duration: 0.12,
    ease: EASE_OUT_EXPO,
  },

  // Spring animations - high stiffness for instant reactivity
  spring: {
    type: 'spring' as const,
    stiffness: 700,
    damping: 40,
    mass: 0.8,
  },

  // Bouncy spring for playful interactions (snappier, controlled overshoot)
  springBouncy: {
    type: 'spring' as const,
    stiffness: 800,
    damping: 35,
    mass: 0.6,
  },

  // Ultra-responsive spring for micro-interactions
  springSnappy: {
    type: 'spring' as const,
    stiffness: 900,
    damping: 45,
    mass: 0.5,
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
