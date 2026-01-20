import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

type LoadingVariant = 'default' | 'upload' | 'stream';

interface LoadingProgressProps {
  message?: string;
  stage?: string;
  variant?: LoadingVariant;
}

/**
 * LoadingProgress - Data Stream Animation
 * 
 * High-velocity, GPU-accelerated loading component featuring:
 * - Racing colored blocks that simulate fast data transfer
 * - Upload variant with accelerated pulse patterns
 * - Stream variant with continuous flow effect
 * 
 * Performance optimizations:
 * - Uses transform and opacity only (GPU-accelerated)
 * - will-change hints for browser optimization
 * - 60fps smooth animations at high velocities
 */
export default function LoadingProgress({
  message = 'Processing...',
  stage,
  variant = 'default',
}: LoadingProgressProps) {
  const [cycleIndex, setCycleIndex] = useState(0);

  // Fast cycle for text updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCycleIndex((prev) => (prev + 1) % 3);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const dots = ['', '.', '..', '...'];
  const dotIndex = cycleIndex % dots.length;

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      {/* Data Stream Animation - Racing Blocks */}
      <div className="w-full max-w-sm mb-6">
        <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden">
          {/* Multiple racing blocks at different speeds */}
          {variant === 'upload' ? (
            // High-velocity upload variant - triple stream
            <>
              <motion.div
                className="absolute top-0 left-0 h-full w-1/4 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"
                animate={{ x: ['-100%', '500%'] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{ willChange: 'transform' }}
              />
              <motion.div
                className="absolute top-0 left-0 h-full w-1/5 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full shadow-lg shadow-violet-500/50"
                animate={{ x: ['-100%', '600%'] }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.15,
                }}
                style={{ willChange: 'transform' }}
              />
              <motion.div
                className="absolute top-0 left-0 h-full w-1/6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-500/50"
                animate={{ x: ['-100%', '700%'] }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  ease: [0.4, 0, 0.2, 1],
                  delay: 0.3,
                }}
                style={{ willChange: 'transform' }}
              />
            </>
          ) : variant === 'stream' ? (
            // Continuous stream variant
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className={clsx(
                    'absolute top-0 h-full w-8 rounded-full',
                    i % 3 === 0 && 'bg-cyan-400 shadow-cyan-400/50',
                    i % 3 === 1 && 'bg-violet-500 shadow-violet-500/50',
                    i % 3 === 2 && 'bg-blue-400 shadow-blue-400/50',
                    'shadow-lg'
                  )}
                  animate={{ 
                    x: ['-32px', 'calc(100% + 32px)'],
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                    delay: i * 0.2,
                  }}
                  style={{ willChange: 'transform, opacity' }}
                />
              ))}
            </>
          ) : (
            // Default variant - racing pulse
            <>
              <motion.div
                className="absolute top-0 left-0 h-full w-1/3 bg-gradient-to-r from-cyan-400 via-violet-500 to-blue-400 rounded-full"
                animate={{ 
                  x: ['-100%', '400%'],
                  scaleX: [1, 1.2, 0.8, 1],
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                style={{ willChange: 'transform' }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ willChange: 'transform' }}
              />
            </>
          )}
        </div>
      </div>

      {/* Quantum Pulse Indicator */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={clsx(
              'w-2 h-2 rounded-full',
              i === 0 && 'bg-cyan-400',
              i === 1 && 'bg-violet-500',
              i === 2 && 'bg-amber-400'
            )}
            animate={{
              scale: [1, 1.8, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              delay: i * 0.1,
              ease: [0.4, 0, 0.2, 1],
            }}
            style={{ willChange: 'transform, opacity' }}
          />
        ))}
      </div>

      {/* Message with rapid dot animation */}
      <AnimatePresence mode="popLayout">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
          className="text-slate-200 font-semibold text-sm"
        >
          {message}{dots[dotIndex]}
        </motion.p>
      </AnimatePresence>

      {/* Stage indicator */}
      {stage && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-slate-400 mt-2 font-medium"
        >
          {stage}
        </motion.p>
      )}

      {/* Speed lines for visual velocity */}
      <div className="flex items-center gap-1 mt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="w-6 h-0.5 bg-gradient-to-r from-cyan-400/60 to-transparent rounded-full"
            animate={{
              scaleX: [0.3, 1, 0.3],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              delay: i * 0.05,
              ease: 'easeOut',
            }}
            style={{ willChange: 'transform, opacity' }}
          />
        ))}
      </div>
    </div>
  );
}
