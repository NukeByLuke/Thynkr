/**
 * Animation Configuration
 * Optimized for 60fps performance with GPU acceleration
 * All animations use transform and opacity only for best performance
 */

export const ANIMATION_CONFIG = {
  // Duration values (in seconds) - tight and snappy
  duration: {
    instant: 0.15,
    fast: 0.2,
    normal: 0.3,
    slow: 0.35,
  },
  
  // Easing functions
  easing: {
    default: [0.4, 0, 0.2, 1], // easeInOut
    out: [0, 0, 0.2, 1], // easeOut
    in: [0.4, 0, 1, 1], // easeIn
  },
  
  // Common animation variants
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 10 },
    },
    slideDown: {
      initial: { opacity: 0, y: -20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -10 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.98 },
    },
  },
  
  // Hover animations
  hover: {
    scale: 1.02,
    lift: -2, // translateY in pixels
  },
  
  // Tap animations
  tap: {
    scale: 0.95,
  },
} as const;

/**
 * Common Tailwind classes for GPU-accelerated animations
 */
export const ANIMATION_CLASSES = {
  // Base transition classes - GPU accelerated properties only
  base: 'transition-all duration-200 ease-out',
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-300 ease-out',
  
  // Transform-based transitions (GPU accelerated)
  transform: 'transition-transform duration-200 ease-out',
  transformFast: 'transition-transform duration-150 ease-out',
  
  // Opacity transitions (GPU accelerated)
  opacity: 'transition-opacity duration-200 ease-out',
  opacityFast: 'transition-opacity duration-150 ease-out',
  
  // Combined transform + opacity (most common)
  both: 'transition-[transform,opacity] duration-200 ease-out',
  bothFast: 'transition-[transform,opacity] duration-150 ease-out',
  
  // Tactile feedback for clickable elements
  clickable: 'active:scale-95 transition-transform duration-150',
  clickableSubtle: 'active:scale-[0.98] transition-transform duration-150',
  
  // Hover effects
  hover: 'hover:scale-[1.02] transition-transform duration-200',
  hoverLift: 'hover:-translate-y-0.5 transition-transform duration-200',
} as const;
