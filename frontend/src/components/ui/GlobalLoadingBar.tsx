/**
 * Global Loading Bar Component
 * Displays a thin animated loading indicator at the top of the screen
 * Optimized for 60fps with spring physics
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Spring physics config for buttery smooth progress
const springTransition = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 35,
  mass: 0.5,
};

// Aggressive easeOut for immediate feedback
const fastEaseOut = [0.25, 0.1, 0.25, 1.0];

export default function GlobalLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start loading on route change
    setIsLoading(true);
    setProgress(0);

    // Faster animation sequence for snappier feel
    const timer1 = setTimeout(() => setProgress(40), 30);
    const timer2 = setTimeout(() => setProgress(70), 100);
    const timer3 = setTimeout(() => setProgress(95), 200);
    const timer4 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 100);
    }, 280);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.08, ease: fastEaseOut }}
          className="fixed top-0 left-0 right-0 z-[9999] h-0.5"
          style={{
            transform: 'translateZ(0)',
            willChange: 'opacity',
            backfaceVisibility: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={springTransition}
            className="h-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#06B6D4] shadow-[0_0_10px_rgba(124,58,237,0.5)]"
            style={{
              transform: 'translateZ(0)',
              willChange: 'width',
              backfaceVisibility: 'hidden',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
