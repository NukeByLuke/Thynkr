/**
 * OAuthButton - Social authentication button
 * Variants: Google (white), Apple (black)
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface OAuthButtonProps {
  variant: 'google' | 'apple';
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
  icon?: ReactNode;
}

const variants = {
  google: {
    bg: '#FFFFFF',
    text: '#1F2937',
    border: '1px solid #D1D5DB',
    hoverShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  apple: {
    bg: '#000000',
    text: '#FFFFFF',
    border: '1px solid #000000',
    hoverShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
};

export function OAuthButton({
  variant,
  onClick,
  disabled = false,
  children,
  icon,
}: OAuthButtonProps) {
  const style = variants[variant];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={{ boxShadow: style.hoverShadow }}
      whileTap={{ scale: 0.98 }}
      className="w-full h-12 flex items-center justify-center gap-3 rounded-full transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        backgroundColor: style.bg,
        color: style.text,
        border: style.border,
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="font-medium text-sm">{children}</span>
    </motion.button>
  );
}

export default OAuthButton;
