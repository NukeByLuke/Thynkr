/**
 * SuspenseFallback Component
 * Reusable loading states for code-split components
 * Improves perceived performance during chunk loading
 */

import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SuspenseFallbackProps {
  /**
   * Variant determines the loading experience
   * - 'spinner': Minimal animated spinner (default)
   * - 'skeleton': Content placeholder skeleton
   * - 'minimal': Subtle loading indicator
   * - 'page': Full-page loading experience
   */
  variant?: 'spinner' | 'skeleton' | 'minimal' | 'page';
  message?: string;
  className?: string;
}

/**
 * Minimal Spinner Fallback (default)
 * Best for: Modals, small components, widgets
 */
const SpinnerFallback = ({ message, className }: Pick<SuspenseFallbackProps, 'message' | 'className'>) => (
  <div className={clsx('flex items-center justify-center p-8', className)}>
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, rotate: 360 }}
      transition={{
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
        rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
      }}
      className="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-500 dark:border-slate-700 dark:border-t-primary-400"
    />
    {message && (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="ml-3 text-sm text-slate-600 dark:text-slate-400"
      >
        {message}
      </motion.p>
    )}
  </div>
);

/**
 * Skeleton Fallback
 * Best for: Content areas, cards, lists
 */
const SkeletonFallback = ({ className }: Pick<SuspenseFallbackProps, 'className'>) => (
  <div className={clsx('p-6 space-y-4', className)}>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: i * 0.1,
        }}
        className="h-4 bg-slate-200 dark:bg-slate-700 rounded"
        style={{ width: `${100 - i * 15}%` }}
      />
    ))}
  </div>
);

/**
 * Minimal Fallback
 * Best for: Navigation, headers, sidebars
 */
const MinimalFallback = ({ className }: Pick<SuspenseFallbackProps, 'className'>) => (
  <div className={clsx('flex items-center justify-center p-4', className)}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      className="h-1 w-16 bg-gradient-to-r from-primary-400 to-purple-400 rounded-full"
    />
  </div>
);

/**
 * Page Fallback
 * Best for: Full page routes
 */
const PageFallback = ({ message }: Pick<SuspenseFallbackProps, 'message'>) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center min-h-[400px]"
  >
    <div className="text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1, rotate: 360 }}
        transition={{
          opacity: { duration: 0.2 },
          scale: { duration: 0.2 },
          rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
        }}
        className="h-12 w-12 mx-auto rounded-full border-3 border-primary-200 border-t-primary-500 dark:border-slate-700 dark:border-t-primary-400"
      />
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-slate-600 dark:text-slate-400"
        >
          {message}
        </motion.p>
      )}
    </div>
  </motion.div>
);

/**
 * Main SuspenseFallback Component
 */
export default function SuspenseFallback({ 
  variant = 'spinner', 
  message, 
  className 
}: SuspenseFallbackProps) {
  switch (variant) {
    case 'skeleton':
      return <SkeletonFallback className={className} />;
    case 'minimal':
      return <MinimalFallback className={className} />;
    case 'page':
      return <PageFallback message={message} />;
    case 'spinner':
    default:
      return <SpinnerFallback message={message} className={className} />;
  }
}

/**
 * Named exports for specific use cases
 */
export const PageLoader = () => <SuspenseFallback variant="page" />;
export const ModalLoader = () => <SuspenseFallback variant="spinner" />;
export const WidgetLoader = () => <SuspenseFallback variant="minimal" />;
export const ContentLoader = () => <SuspenseFallback variant="skeleton" />;
