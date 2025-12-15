/**
 * GlobalAudioPlayer Component
 * 
 * Example implementation showing how to use the split AudioContext pattern.
 * This component demonstrates both read-only state access and action triggers.
 */

import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { useAudioState, useAudioActions } from '../../contexts/AudioContext';

/**
 * Progress Bar Component - Uses useAudioState (will re-render on time updates)
 */
const AudioProgressBar: React.FC = () => {
  const { currentTime, duration } = useAudioState();
  const { seek } = useAudioActions();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full">
      <div
        onClick={handleSeek}
        className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full cursor-pointer overflow-hidden"
      >
        <div
          className="h-full bg-brand-500 transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

/**
 * Control Buttons - Uses useAudioActions (NO re-renders on time updates)
 */
const AudioControls: React.FC = () => {
  const { isPlaying } = useAudioState(); // Only read playing status
  const { play, pause, skipNext, skipPrevious } = useAudioActions(); // Actions don't cause re-renders

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => skipPrevious()}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        aria-label="Previous"
      >
        <SkipBack className="w-5 h-5" />
      </button>

      <button
        onClick={() => (isPlaying ? pause() : play())}
        className="p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-full transition-colors"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
      </button>

      <button
        onClick={() => skipNext()}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
        aria-label="Next"
      >
        <SkipForward className="w-5 h-5" />
      </button>
    </div>
  );
};

/**
 * Volume Control - Uses useAudioActions (optimized)
 */
const VolumeControl: React.FC = () => {
  const { volume } = useAudioState();
  const { setVolume } = useAudioActions();

  return (
    <div className="flex items-center gap-2">
      <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(e) => setVolume(parseFloat(e.target.value))}
        className="w-24"
      />
    </div>
  );
};

/**
 * Speed Control - Uses useAudioActions (optimized)
 */
const SpeedControl: React.FC = () => {
  const { playbackRate } = useAudioState();
  const { setPlaybackRate } = useAudioActions();

  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <div className="flex items-center gap-1">
      {speeds.map((speed) => (
        <button
          key={speed}
          onClick={() => setPlaybackRate(speed)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            playbackRate === speed
              ? 'bg-brand-500 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {speed}x
        </button>
      ))}
    </div>
  );
};

/**
 * Main Player Component - Combines all sub-components
 */
export const GlobalAudioPlayer: React.FC = () => {
  const { isLoading, error, queue, currentIndex } = useAudioState();

  const currentItem = currentIndex >= 0 ? queue[currentIndex] : null;

  if (queue.length === 0) {
    return null; // Hide player when no audio in queue
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {error && (
          <div className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</div>
        )}

        {isLoading && (
          <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">Loading audio...</div>
        )}

        {currentItem && (
          <div className="mb-2">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white">
              {currentItem.title || 'Audio Playing'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track {currentIndex + 1} of {queue.length}
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <AudioControls />
          <div className="flex-1">
            <AudioProgressBar />
          </div>
          <SpeedControl />
          <VolumeControl />
        </div>
      </div>
    </div>
  );
};

export default GlobalAudioPlayer;
