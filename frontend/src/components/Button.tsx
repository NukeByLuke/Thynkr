/**
 * Button Component
 * Reusable button with variants, sizes, loading states, and gradient brand styling.
 */

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

/**
 * Button component with theme-aware styling and loading indicator
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

    const variants = {
      primary:
        'relative overflow-hidden bg-gradient-to-r from-[#7c3aed] via-[#9333ea] to-[#3b82f6] text-white hover:from-[#7c3aed] hover:via-[#7c3aed] hover:to-[#3b82f6] dark:from-[#7c3aed] dark:via-[#9333ea] dark:to-[#3b82f6] focus:ring-brand-500 shadow-[0_4px_20px_rgba(124,58,237,0.35)] hover:shadow-[0_0_24px_rgba(124,58,237,0.45)]',
      secondary:
        'relative overflow-hidden bg-gradient-to-r from-accent-500 to-accent-400 text-white hover:from-accent-400 hover:to-accent-300 focus:ring-accent-500 shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]',
      outline:
        'border-2 border-brand-500 dark:border-brand-400 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 focus:ring-brand-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]',
      ghost:
        'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:ring-gray-500',
      danger:
        'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus:ring-red-500 shadow-[0_4px_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
