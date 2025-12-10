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
  variant?: 'default' | 'glass' | 'subtle';
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
    default: 'bg-white dark:bg-slate-800/70 border border-gray-100 dark:border-slate-700/40 shadow-soft',
    glass: 'backdrop-blur-xl bg-white/80 dark:bg-slate-800/60 border border-gray-100/60 dark:border-slate-700/30 shadow-glass',
    subtle: 'bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100/80 dark:border-slate-700/30',
  };

  const baseClassName = clsx(
    'rounded-2xl transition-all duration-300 ease-out',
    variantClasses[variant],
    hover && 'cursor-pointer hover:shadow-soft-md hover:-translate-y-0.5 hover:border-gray-200 dark:hover:border-slate-600',
    paddingClasses[padding],
    className
  );

  if (hover) {
    return (
      <motion.div
        className={baseClassName}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
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
