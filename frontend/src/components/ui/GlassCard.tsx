import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'hover' | 'interactive';
  gradientBorder?: boolean;
  onClick?: () => void;
}

/**
 * GlassCard - Reusable glassmorphic card component
 * 
 * A premium glass-style container that provides consistent styling across the application.
 * Features backdrop blur, subtle borders, and optional hover effects.
 * 
 * @param children - Content to render inside the card
 * @param className - Additional Tailwind classes to apply
 * @param variant - Visual variant: 'default' | 'hover' | 'interactive'
 * @param gradientBorder - Enable gradient border effect
 * @param onClick - Optional click handler for interactive cards
 */
export default function GlassCard({
  children,
  className,
  variant = 'default',
  gradientBorder = false,
  onClick,
}: GlassCardProps) {
  // Base glass card styles
  const baseStyles =
    'rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm shadow-xl';

  // Variant-specific styles
  const variantStyles = {
    default: '',
    hover:
      'hover:bg-slate-800/60 hover:border-white/20 hover:shadow-2xl transition-all duration-300',
    interactive:
      'hover:bg-slate-800/60 hover:border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer',
  };

  // Gradient border effect
  const gradientBorderStyles = gradientBorder
    ? 'relative before:absolute before:inset-0 before:rounded-2xl before:p-[1px] before:bg-gradient-to-br before:from-indigo-500/50 before:via-purple-500/50 before:to-pink-500/50 before:-z-10'
    : '';

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        gradientBorderStyles,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
