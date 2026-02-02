/**
 * Card Component
 * Thea-inspired card with rounded-2xl, soft shadow, and optional header/footer.
 */

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
  variant?: 'default' | 'glass' | 'subtle' | 'elevated';
  header?: ReactNode;
  footer?: ReactNode;
}

export default function Card({
  children,
  hover = false,
  padding = 'md',
  variant = 'default',
  header,
  footer,
  className,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const variantClasses = {
    default: clsx(
      'bg-white dark:bg-slate-800',
      'border border-gray-200 dark:border-slate-700',
      'shadow-sm'
    ),
    glass: clsx(
      'backdrop-blur-xl bg-white/80 dark:bg-slate-800/60',
      'border border-gray-100/60 dark:border-slate-700/30',
      'shadow-sm'
    ),
    subtle: clsx(
      'bg-gray-50 dark:bg-slate-800/40',
      'border border-gray-100 dark:border-slate-700/30'
    ),
    elevated: clsx(
      'bg-white dark:bg-slate-800',
      'border border-gray-100 dark:border-slate-700',
      'shadow-md'
    ),
  };

  const baseClassName = clsx(
    'rounded-2xl',
    'transition-all duration-200 ease-in-out',
    variantClasses[variant],
    hover && 'cursor-pointer hover:shadow-xl hover:-translate-y-0.5 hover:border-thynkr-purple/50',
    className
  );

  const content = (
    <>
      {header && (
        <div className={clsx(
          'border-b border-gray-200 dark:border-slate-700',
          padding !== 'none' ? paddingClasses[padding] : 'p-4'
        )}>
          {header}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
      {footer && (
        <div className={clsx(
          'border-t border-gray-200 dark:border-slate-700',
          padding !== 'none' ? paddingClasses[padding] : 'p-4'
        )}>
          {footer}
        </div>
      )}
    </>
  );

  if (hover) {
    return (
      <motion.div
        className={baseClassName}
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        {...(props as HTMLMotionProps<'div'>)}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div className={baseClassName} {...props}>
      {content}
    </div>
  );
}
