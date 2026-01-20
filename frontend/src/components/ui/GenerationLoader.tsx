import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useEffect, useState } from 'react';

interface GenerationLoaderProps {
  isVisible: boolean;
  stages?: string[];
}

const defaultStages = [
  'Analyzing Context...',
  'Synthesizing Notes...',
  'Formatting Output...',
  'Finalizing...',
];

/**
 * GenerationLoader - Professional loading animation with Zeno's Paradox progress
 * 
 * Implements a "Zeno's Paradox" style progress bar that:
 * - Quickly animates to 60% (feels responsive)
 * - Slowly creeps towards 90% (visual feedback of ongoing work)
 * - Holds at 90% until completion (prevents false completion)
 * 
 * Optimized for performance using:
 * - transform and opacity only (GPU-accelerated)
 * - No heavy background animations
 * - Clean, professional aesthetic
 */
export default function GenerationLoader({
  isVisible,
  stages = defaultStages,
}: GenerationLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const progressControls = useAnimation();

  // Cycle through stages every 2.5 seconds
  useEffect(() => {
    if (!isVisible) {
      setCurrentStageIndex(0);
      return;
    }

    const stageInterval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev < stages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2500);

    return () => clearInterval(stageInterval);
  }, [isVisible, stages.length]);

  // Zeno's Paradox animation: Quick to 60%, slow creep to 90%, hold
  useEffect(() => {
    if (!isVisible) {
      progressControls.set({ width: '0%' });
      return;
    }

    // Phase 1: Quick animation to 60% (0.8s)
    progressControls.start({
      width: '60%',
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // easeOutCubic
      },
    });

    // Phase 2: Slow creep from 60% to 90% (8s)
    const phase2Timer = setTimeout(() => {
      progressControls.start({
        width: '90%',
        transition: {
          duration: 8,
          ease: [0.16, 1, 0.3, 1], // easeOutExpo - exponential slowdown
        },
      });
    }, 800);

    return () => {
      clearTimeout(phase2Timer);
    };
  }, [isVisible, progressControls]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Status Text with fade animation */}
      <div className="flex items-center justify-center h-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStageIndex}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="text-xs font-medium uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400"
          >
            {stages[currentStageIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar Container */}
      <div
        className="relative w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"
        role="progressbar"
        aria-label="Generation progress"
      >
        {/* Animated Fill Bar with Zeno's Paradox progression */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full"
          initial={{ width: '0%' }}
          animate={progressControls}
        >
          {/* Subtle shimmer effect for polish */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ width: '50%' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
