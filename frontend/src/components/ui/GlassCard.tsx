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
 * GlassCard - Soft-Square glassmorphic card component
 * 
 * A premium glass-style container with soft-square (rounded-xl) design,
 * backdrop-blur-md for glassmorphism, and high-clarity borders.
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
  // Base glass card styles with soft-square aesthetic
  const baseStyles =
    'rounded-xl border border-slate-200 dark:border-slate-800/50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md shadow-lg';

  // Variant-specific styles
  const variantStyles = {
    default: '',
    hover:
      'hover:bg-white/95 dark:hover:bg-zinc-950/95 hover:border-slate-300 dark:hover:border-slate-700/60 hover:shadow-xl transition-all duration-300',
    interactive:
      'hover:bg-white/95 dark:hover:bg-zinc-950/95 hover:border-slate-300 dark:hover:border-slate-700/60 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 cursor-pointer',
  };

  // Gradient border effect with soft-square design
  const gradientBorderStyles = gradientBorder
    ? 'relative before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:bg-gradient-to-br before:from-blue-500/50 before:via-violet-500/50 before:to-purple-500/50 before:-z-10'
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
