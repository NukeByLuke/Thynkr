/**
 * Input Component
 * Thea-inspired form input with rounded-xl, clean borders, and focus ring.
 */

import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input - Thea-style form input field
 * - Rounded-xl corners
 * - Border #D1D5DB (gray-300)
 * - Focus ring blue-400
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 rounded-xl',
            'transition-all duration-200 ease-in-out',
            'bg-white dark:bg-slate-800',
            'border focus:outline-none',
            // iOS Safari auto-zooms on inputs with font-size < 16px
            // text-base (16px) prevents this unwanted zoom behavior
            // This is critical for mobile UX - DO NOT change to text-sm
            'text-base text-gray-900 dark:text-white',
            'placeholder:text-gray-400 dark:placeholder:text-slate-500',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-400/30 focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)]'
              : clsx(
                  'border-gray-300 dark:border-slate-600',
                  'hover:border-gray-400 dark:hover:border-slate-500',
                  'focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.1)]'
                ),
            props.disabled && 'bg-gray-100 dark:bg-slate-900 cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
