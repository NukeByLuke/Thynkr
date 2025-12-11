/**
 * Switch - Thynkr's custom toggle switch component
 * Features smooth transition from slate-200 (off) to thynkr-blue (on)
 */

import { forwardRef, InputHTMLAttributes } from 'react';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Whether the switch is checked */
  checked: boolean;
  /** Callback when switch state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Optional label */
  label?: string;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, label, description, disabled = false, className = '', ...props }, ref) => {
    return (
      <label className={`flex items-center justify-between cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
        {(label || description) && (
          <div className="flex-1 mr-4">
            {label && (
              <p className="font-medium text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {label}
              </p>
            )}
            {description && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div
            className={`
              w-11 h-6 rounded-full transition-all duration-200
              ${checked 
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                : 'bg-slate-200 dark:bg-slate-700'
              }
              ${!disabled && 'peer-focus:ring-4 peer-focus:ring-cyan-500/20'}
            `}
          >
            {/* Thumb */}
            <div
              className={`
                absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md
                transition-transform duration-200
                ${checked ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </div>
        </div>
      </label>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
