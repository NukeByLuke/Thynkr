/**
 * SmartInput - Thynkr's branded input component
 * Features cyan focus ring (brand: "Cyan = Active/Thinking")
 * Supports optional left icon for visual context
 */

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface SmartInputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional icon to display on the left side of the input */
  icon?: ReactNode;
  /** Error state - shows red border instead of cyan */
  hasError?: boolean;
  /** Additional class names */
  className?: string;
}

const SmartInput = forwardRef<HTMLInputElement, SmartInputProps>(
  ({ icon, hasError = false, className = '', ...props }, ref) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={`
            w-full h-12 rounded-xl border-2 text-base transition-all duration-200 outline-none
            ${icon ? 'pl-11 pr-4' : 'px-4'}
            ${isDark
              ? hasError
                ? 'bg-slate-950 border-red-500/50 text-slate-100 placeholder-slate-500 hover:border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500 hover:border-slate-700 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'
              : hasError
                ? 'bg-white border-red-200 text-slate-800 placeholder-slate-400 hover:border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                : 'bg-white border-slate-100 text-slate-800 placeholder-slate-400 hover:border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

SmartInput.displayName = 'SmartInput';

export default SmartInput;
