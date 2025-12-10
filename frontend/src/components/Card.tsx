import { HTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';

interface CardProps
  extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
  > {
  children: ReactNode;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'gradient';
}

export default function Card({
  children,
  hover = false,
  padding = 'md',
  variant = 'default',
  className,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'bg-white dark:bg-slate-900/90 border border-slate-200/50 dark:border-white/10 shadow-soft',
    glass: 'backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border border-white/20 dark:border-white/10 shadow-glass',
    gradient: 'bg-gradient-to-br from-[#8B5CF6]/5 to-[#06B6D4]/5 dark:from-[#8B5CF6]/10 dark:to-[#06B6D4]/10 border border-white/20 dark:border-white/10 shadow-soft backdrop-blur-sm',
  };

  const baseClassName = clsx(
    'rounded-3xl transition-all duration-300 ease-out',
    variantClasses[variant],
    hover && 'cursor-pointer hover:shadow-glow-brand hover:scale-[1.02] hover:border-brand-500/20 dark:hover:border-brand-400/20',
    paddingClasses[padding],
    className
  );

  if (hover) {
    return (
      <motion.div
        className={baseClassName}
        whileHover={{ y: -4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...(props as HTMLMotionProps<'div'>)}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={baseClassName} {...props}>
      {children}
    </div>
  );
}
