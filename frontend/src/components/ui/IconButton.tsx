/**
 * IconButton Component
 * Accessible icon-only button with WCAG 2.1 compliant 44x44px minimum touch target
 */

import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

export interface IconButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  children: ReactNode;
  variant?: 'default' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string; // Required for accessibility
}

/**
 * IconButton - Accessible icon-only button
 * Ensures WCAG 2.1 minimum 44x44px touch target on mobile
 * Desktop can be smaller (md:min-w-[36px] md:min-h-[36px])
 */
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      'inline-flex items-center justify-center',
      'rounded-lg transition-all duration-200 ease-in-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'touch-manipulation active:scale-95'
    );

    const variants = {
      default: clsx(
        'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
        'hover:bg-slate-200 dark:hover:bg-slate-700',
        'active:bg-slate-300 dark:active:bg-slate-600'
      ),
      ghost: clsx(
        'text-slate-600 dark:text-slate-400 bg-transparent',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'active:bg-slate-200 dark:active:bg-slate-700'
      ),
      outline: clsx(
        'border-2 border-slate-200 dark:border-slate-700',
        'text-slate-700 dark:text-slate-300 bg-transparent',
        'hover:border-slate-300 dark:hover:border-slate-600',
        'hover:bg-slate-50 dark:hover:bg-slate-800'
      ),
      danger: clsx(
        'text-red-600 dark:text-red-400 bg-transparent',
        'hover:bg-red-50 dark:hover:bg-red-950/30',
        'active:bg-red-100 dark:active:bg-red-950/50'
      ),
    };

    // WCAG 2.1 compliant: 44x44px minimum on mobile, can be smaller on desktop
    const sizes = {
      sm: 'p-2 min-w-[44px] min-h-[44px] md:min-w-[32px] md:min-h-[32px]',
      md: 'p-2.5 min-w-[44px] min-h-[44px] md:min-w-[36px] md:min-h-[36px]',
      lg: 'p-3 min-w-[48px] min-h-[48px] md:min-w-[40px] md:min-h-[40px]',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default IconButton;
