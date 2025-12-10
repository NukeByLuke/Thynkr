import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
  animated?: boolean;
  /**
   * Color mode for the logo text
   * - 'auto': uses CSS classes for light/dark mode
   * - 'light': forces light text (for dark backgrounds)
   * - 'dark': forces dark text (for light backgrounds)
   */
  textColor?: 'auto' | 'light' | 'dark';
}

export default function Logo({ variant = 'full', className, animated = true, textColor = 'auto' }: LogoProps) {
  // Always navigate to home page
  const destination = '/';

  // Text color classes based on mode
  const textColorClass = textColor === 'light' 
    ? 'text-white' 
    : textColor === 'dark' 
      ? 'text-gray-900' 
      : 'text-gray-900 dark:text-white';

  return (
    <Link
      to={destination}
      className={clsx('group flex items-center gap-2.5 select-none', className)}
      aria-label="Thynkr Home"
    >
      <motion.div
        whileHover={animated ? { scale: 1.02 } : {}}
        whileTap={animated ? { scale: 0.98 } : {}}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg"
        style={{ 
          backgroundColor: '#A78BFA',
          boxShadow: '0 2px 8px rgba(167, 139, 250, 0.3)'
        }}
      >
        {/* Simple "T" letter mark */}
        <span className="text-white font-bold text-lg">T</span>
      </motion.div>

      {variant === 'full' && (
        <span className={clsx(
          'font-semibold text-xl tracking-tight',
          textColorClass
        )}>
          Thynkr
        </span>
      )}
    </Link>
  );
}
