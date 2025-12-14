/**
 * GameLoadingWrapper Component
 * Handles loading state with dynamic status messages during game generation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GenerationLoader from '@/components/ui/GenerationLoader';

interface GameLoadingWrapperProps {
  isLoading: boolean;
  onLoadingComplete?: () => void;
  children: React.ReactNode;
}

const GAME_GENERATION_STAGES = [
  'Reading selected files...',
  'Extracting key concepts...',
  'Building game board...',
];

export default function GameLoadingWrapper({
  isLoading,
  onLoadingComplete,
  children,
}: GameLoadingWrapperProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!isLoading && !showContent) {
      // Small delay before showing content for smooth transition
      const timeout = setTimeout(() => {
        setShowContent(true);
        onLoadingComplete?.();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, showContent, onLoadingComplete]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-screen px-4"
          >
            <div className="w-full max-w-md space-y-8">
              {/* Title */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Preparing Game
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This will only take a moment
                </p>
              </div>

              {/* Loader */}
              <GenerationLoader 
                isVisible={true} 
                stages={GAME_GENERATION_STAGES}
              />
            </div>
          </motion.div>
        ) : showContent ? (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
