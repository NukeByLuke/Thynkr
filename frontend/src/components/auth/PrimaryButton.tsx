/**
 * PrimaryButton - Main CTA button for auth forms
 * Rounded-full, cyan background, hover effect
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PrimaryButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'submit' | 'button' | 'reset';
  onClick?: () => void;
}

export function PrimaryButton({
  children,
  isLoading = false,
  disabled,
  className = '',
  type = 'submit',
  onClick,
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { backgroundColor: '#0891B2' } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={`
        w-full h-12 
        flex items-center justify-center gap-2
        rounded-full 
        text-white font-medium text-sm
        transition-all duration-200
        disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
      style={{ backgroundColor: '#06B6D4' }}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
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
      ) : (
        children
      )}
    </motion.button>
  );
}

export default PrimaryButton;
