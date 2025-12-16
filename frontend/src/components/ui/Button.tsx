/**
 * Button Component
 * Thea-inspired button with rounded-full design, consistent padding, and hover shadows.
 */

import { forwardRef, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref' | 'children'> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean; // For icon-only buttons that need 44x44px minimum
}

/**
 * Button - Thea-style button with variants
 * - primary: Solid indigo background
 * - secondary: Soft gray background
 * - outline: Border only
 * - ghost: No background, hover reveals
 * - danger: Red for destructive actions
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      iconOnly = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      'inline-flex items-center justify-center font-medium',
      'rounded-xl transition-all duration-200 ease-in-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
    );

    const variants = {
      primary: clsx(
        'bg-gradient-aurora text-white shadow-lg shadow-blue-500/25',
        'hover:bg-gradient-aurora-hover hover:shadow-xl hover:shadow-blue-500/30',
        'active:scale-[0.98]'
      ),
      secondary: clsx(
        'bg-gray-100 text-gray-700',
        'hover:bg-gray-200 hover:shadow-sm',
        'dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600',
        'active:scale-[0.98]'
      ),
      outline: clsx(
        'border-2 border-gray-200 text-gray-700 bg-transparent',
        'hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm',
        'dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800'
      ),
      ghost: clsx(
        'text-gray-600 bg-transparent',
        'hover:bg-gray-100 hover:text-gray-900',
        'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
      ),
      danger: clsx(
        'bg-red-500 text-white',
        'hover:bg-red-600 hover:shadow-md',
        'active:scale-[0.98]'
      ),
    };

    // WCAG 2.1 Success Criterion 2.5.5: Target Size (Level AAA)
    // Mobile touch targets must be at least 44x44px for accessibility
    // Desktop can be slightly smaller for better visual density
    const sizes = {
      sm: 'px-4 py-2.5 md:py-2 text-sm gap-1.5 min-h-[44px]',
      md: 'px-6 py-3 md:py-2.5 text-sm gap-2 min-h-[44px]',
      lg: 'px-8 py-4 md:py-3 text-base gap-2 min-h-[48px]',
    };

    // Icon-only buttons enforce minimum 44x44px on mobile, 48x48px on larger sizes
    // This ensures WCAG Level AAA compliance for touch target accessibility
    const iconOnlySizes = {
      sm: 'p-2.5 min-w-[44px] min-h-[44px]',
      md: 'p-3 min-w-[44px] min-h-[44px]',
      lg: 'p-4 min-w-[48px] min-h-[48px]',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={clsx(
          baseStyles,
          variants[variant],
          iconOnly ? iconOnlySizes[size] : sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
