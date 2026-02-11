/**
 * YouTube Processing Overlay
 * Full-screen loading experience for YouTube video processing
 * Shows animated brain + rotating tips while Gemini processes the video
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Sparkles, Brain, Clock, Zap } from 'lucide-react';

interface YouTubeProcessingOverlayProps {
  isOpen: boolean;
  onCancel?: () => void;
  videoTitle?: string;
}

// Rotating tips shown during processing
const PROCESSING_TIPS = [
  { icon: Brain, text: 'Our AI is watching and analyzing the video...' },
  { icon: Sparkles, text: 'Extracting key concepts and dialogue...' },
  { icon: Zap, text: 'Creating study materials just for you...' },
  { icon: Clock, text: 'Longer videos take a bit more time...' },
  { icon: Youtube, text: 'We process the entire video for accuracy...' },
];

export default function YouTubeProcessingOverlay({
  isOpen,
  onCancel,
  videoTitle,
}: YouTubeProcessingOverlayProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Rotate tips every 4 seconds
  useEffect(() => {
    if (!isOpen) {
      setTipIndex(0);
      setElapsedSeconds(0);
      return;
    }

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % PROCESSING_TIPS.length);
    }, 4000);

    const timeInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(tipInterval);
      clearInterval(timeInterval);
    };
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const CurrentTipIcon = PROCESSING_TIPS[tipIndex].icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-900/95 via-purple-900/95 to-violet-900/95 dark:from-slate-950/98 dark:via-cyan-950/95 dark:to-violet-950/95 backdrop-blur-xl" />

          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/10 rounded-full"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  y: [null, Math.random() * -200 - 100],
                  opacity: [0.3, 0],
                }}
                transition={{
                  duration: Math.random() * 3 + 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>

          {/* Cancel button */}
          {onCancel && (
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={onCancel}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors group"
              title="Cancel processing"
            >
              <X className="w-6 h-6 text-white/70 group-hover:text-white" />
            </motion.button>
          )}

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md">
          {/* Animated brain icon instead of Lottie (simpler, no import issues) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-32 h-32 mb-6 flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/30 to-violet-500/30 dark:from-cyan-500/30 dark:to-violet-500/30 flex items-center justify-center"
            >
              <Brain className="w-12 h-12 text-white/80" />
            </motion.div>
          </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-white mb-2"
            >
              Processing Your Video
            </motion.h2>

            {/* Video title if provided */}
            {videoTitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-white/60 text-sm mb-4 line-clamp-1 max-w-full"
              >
                "{videoTitle}"
              </motion.p>
            )}

            {/* Elapsed time */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-2 text-white/50 text-sm mb-8"
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsedSeconds)}</span>
            </motion.div>

            {/* Animated tip */}
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-3 bg-white/10 rounded-xl px-5 py-3"
            >
              <CurrentTipIcon className="w-5 h-5 text-cyan-400 dark:text-cyan-300 flex-shrink-0" />
              <span className="text-white/80 text-sm">{PROCESSING_TIPS[tipIndex].text}</span>
            </motion.div>

            {/* Progress dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex gap-2 mt-8"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white/40"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>

            {/* Subtle note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/40 text-xs mt-8"
            >
              This usually takes 30-90 seconds depending on video length
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
