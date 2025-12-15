/**
 * GlobalPlayerBar Component
 * 
 * A fixed-bottom audio player bar with glassmorphism design.
 * Uses split AudioContext pattern for optimal re-render performance.
 * Animates into view only when audio is active.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Gauge } from 'lucide-react';
import { useAudioState, useAudioActions } from '../../contexts/AudioContext';

/**
 * Voice ID options for TTS
 */
const VOICE_OPTIONS = [
  { id: 'alloy', label: 'Alloy' },
  { id: 'echo', label: 'Echo' },
  { id: 'fable', label: 'Fable' },
  { id: 'onyx', label: 'Onyx' },
  { id: 'nova', label: 'Nova' },
  { id: 'shimmer', label: 'Shimmer' }
] as const;

/**
 * Playback speed options
 */
const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;

/**
 * Format seconds to MM:SS
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Progress Bar - Uses state (re-renders on time updates)
 */
const ProgressBar: React.FC = React.memo(() => {
  const { currentTime, duration } = useAudioState();
  const { seek } = useAudioActions();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  return (
    <div 
      className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700 cursor-pointer group"
      onClick={handleClick}
    >
      <div 
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
        style={{ width: `${progress}%` }}
      />
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-slate-900 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ left: `calc(${progress}% - 6px)` }}
      />
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

/**
 * Playback Controls - Uses actions only (no re-renders on time updates)
 */
const PlaybackControls: React.FC = React.memo(() => {
  const { isPlaying, isPaused } = useAudioState();
  const { play, pause, resume, skipPrevious, skipNext } = useAudioActions();

  const handlePlayPause = () => {
    if (isPlaying && !isPaused) {
      pause();
    } else if (isPaused) {
      resume();
    } else {
      play();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={skipPrevious}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
        aria-label="Previous track"
      >
        <SkipBack className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </button>

      <button
        onClick={handlePlayPause}
        className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-colors duration-200 shadow-lg"
        aria-label={isPlaying && !isPaused ? 'Pause' : 'Play'}
      >
        {isPlaying && !isPaused ? (
          <Pause className="w-6 h-6 text-white fill-current" />
        ) : (
          <Play className="w-6 h-6 text-white fill-current" />
        )}
      </button>

      <button
        onClick={skipNext}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
        aria-label="Next track"
      >
        <SkipForward className="w-5 h-5 text-slate-700 dark:text-slate-300" />
      </button>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';

/**
 * Speed Control - Uses actions only
 */
const SpeedControl: React.FC = React.memo(() => {
  const { playbackRate } = useAudioState();
  const { setPlaybackRate } = useAudioActions();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
        aria-label="Playback speed"
      >
        <Gauge className="w-4 h-4 text-slate-700 dark:text-slate-300" />
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {playbackRate}x
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50"
            >
              <div className="flex flex-col gap-1">
                {SPEED_OPTIONS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => {
                      setPlaybackRate(speed);
                      setIsOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded text-sm transition-colors duration-200 text-left ${
                      playbackRate === speed
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

SpeedControl.displayName = 'SpeedControl';

/**
 * Voice Selector - Uses actions only
 */
const VoiceSelector: React.FC = React.memo(() => {
  const { voiceId } = useAudioState();
  const { setVoice } = useAudioActions();

  return (
    <div className="hidden sm:block">
      <select
        value={voiceId}
        onChange={(e) => setVoice(e.target.value as any)}
        className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm border-0 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-colors duration-200 cursor-pointer"
        aria-label="Select voice"
      >
        {VOICE_OPTIONS.map((voice) => (
          <option key={voice.id} value={voice.id}>
            {voice.label}
          </option>
        ))}
      </select>
    </div>
  );
});

VoiceSelector.displayName = 'VoiceSelector';

/**
 * Track Info - Uses state (re-renders on updates)
 */
const TrackInfo: React.FC = React.memo(() => {
  const { currentTime, duration, queue, currentIndex } = useAudioState();
  const currentTrack = queue[currentIndex];

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {currentTrack?.text ? (
            currentTrack.text.length > 50 
              ? `${currentTrack.text.substring(0, 50)}...` 
              : currentTrack.text
          ) : (
            'No track playing'
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </p>
      </div>
    </div>
  );
});

TrackInfo.displayName = 'TrackInfo';

/**
 * Main GlobalPlayerBar Component
 */
export const GlobalPlayerBar: React.FC = React.memo(() => {
  const { queue, isPlaying } = useAudioState();
  
  // Only show bar when there's audio in queue or playing
  const isActive = queue.length > 0 || isPlaying;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
          className="fixed bottom-0 left-0 w-full z-50"
        >
          <div className="relative backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-700">
            <ProgressBar />
            
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Track Info */}
                <div className="flex-1 min-w-0">
                  <TrackInfo />
                </div>

                {/* Center: Playback Controls */}
                <div className="flex-shrink-0">
                  <PlaybackControls />
                </div>

                {/* Right: Speed & Voice Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <SpeedControl />
                  <VoiceSelector />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

GlobalPlayerBar.displayName = 'GlobalPlayerBar';
