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
}

export default function Card({
  children,
  hover = false,
  padding = 'md',
  className,
  ...props
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const baseClassName = clsx(
    'bg-white dark:bg-slate-900 rounded-2xl border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.25)]',
    hover &&
      'transition-all duration-300 hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] cursor-pointer',
    paddingClasses[padding],
    className
  );

  if (hover) {
    return (
      <motion.div
        className={baseClassName}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
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
