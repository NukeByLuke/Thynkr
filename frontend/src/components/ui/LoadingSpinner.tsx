import { clsx } from 'clsx';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false, message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const spinner = (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, rotate: 360 }}
      transition={{
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
      }}
      className={clsx(
        'rounded-full border-primary-200 border-t-primary-500',
        sizes[size]
      )}
    />
  );

  if (fullScreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-screen"
      >
        <div className="text-center">
          {spinner}
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-500 dark:text-slate-400 text-sm"
          >
            {message || 'Loading...'}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  return spinner;
}
