/**
 * Input Component
 * Reusable form input with label, error states, and theme-aware styling.
 */

import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * Input - Form input field with validation and accessibility support
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full px-4 py-3 rounded-2xl transition-all duration-250 ease-out',
            'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm',
            'border-2 focus:outline-none',
            'placeholder:text-slate-400 dark:placeholder:text-slate-500',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-slate-200/50 dark:border-slate-700/50 hover:border-brand-300 dark:hover:border-brand-600 focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20',
            props.disabled && 'bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-60',
            className
          )}
          {...props}
        />
        {error && <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
