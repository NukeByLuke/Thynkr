import { motion, AnimatePresence } from 'framer-motion';
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

export default function GenerationLoader({
  isVisible,
  stages = defaultStages,
}: GenerationLoaderProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through stages every 2.5 seconds
  useEffect(() => {
    if (!isVisible) {
      setCurrentStageIndex(0);
      setProgress(0);
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

  // Animate progress from 0% to 90%
  useEffect(() => {
    if (!isVisible) return;

    const targetProgress = 90;
    const duration = 8000; // 8 seconds to reach 90%
    const steps = 60;
    const increment = targetProgress / steps;
    const stepDuration = duration / steps;

    let currentProgress = 0;

    const progressInterval = setInterval(() => {
      currentProgress += increment;
      if (currentProgress >= targetProgress) {
        currentProgress = targetProgress;
        clearInterval(progressInterval);
      }
      setProgress(currentProgress);
    }, stepDuration);

    return () => clearInterval(progressInterval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* Status Text */}
      <div className="flex items-center justify-center h-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStageIndex}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
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
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Generation progress"
      >
        {/* Animated Fill Bar */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{
            type: 'spring',
            stiffness: 50,
            damping: 20,
            mass: 1,
          }}
        >
          {/* Shimmer Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ width: '50%' }}
          />

          {/* Pulse Effect */}
          <motion.div
            className="absolute inset-0 bg-white/10 rounded-full"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
