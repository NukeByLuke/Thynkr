import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Volume2, Music } from 'lucide-react';
import { useTTS } from '@/contexts/TTSContext';

export default function MediaControls() {
  const { isPlaying, currentTrack, pause, resume, playNext } = useTTS();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-collapse after 3 seconds of no interaction
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Show nothing if there's no track
  if (!currentTrack) {
    return null;
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Media Control Bar */}
      <div className="relative px-2 pb-4">
        {/* Background Gradient Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-accent-500/10 to-blue-500/10 rounded-lg blur-sm" />

        {/* Content */}
        <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700 p-2">
          {/* Now Playing Indicator */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-2"
              >
                <div className="flex items-center gap-2 px-1">
                  <Music className="w-3 h-3 text-brand-500 animate-pulse" />
                  <p className="text-[9px] text-slate-600 dark:text-slate-400 truncate font-medium">
                    {currentTrack.title}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Control Buttons */}
          <div className="flex items-center justify-center gap-1">
            {/* TTS Indicator */}
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-r from-brand-500/20 to-accent-400/20">
              <Volume2 className="w-3.5 h-3.5 text-brand-500" />
            </div>

            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className="flex items-center justify-center w-8 h-8 rounded-lg accent-gradient hover:opacity-90 shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 text-white fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 text-white fill-current" />
              )}
            </motion.button>

            {/* Next Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={playNext}
              className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-all"
              title="Next"
            >
              <SkipForward className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <AnimatePresence>
            {isExpanded && isPlaying && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-2 px-1"
              >
                <div className="h-0.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-brand-500 to-accent-400"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
