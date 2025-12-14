import { useState, useEffect } from 'react';
import { X, Play, Pause, RotateCcw, RotateCw, Loader2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/usePlayerStore';
import { useOpenAITTS } from '@/hooks/useOpenAITTS';

export default function GlobalPlayerBar() {
  const { isPlaying: storeIsPlaying, text, speed, stop, pause, play } = usePlayerStore();
  const { isPlaying: audioIsPlaying, isLoading, play: playAudio, pause: pauseAudio, audioElement } = useOpenAITTS();
  
  const [progress, setProgress] = useState(0);

  // Update progress based on audio element's current time
  useEffect(() => {
    if (!audioElement) return;

    const updateProgress = () => {
      const current = audioElement.currentTime;
      const duration = audioElement.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    };

    const handleEnded = () => {
      setProgress(0);
    };

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('timeupdate', updateProgress);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement]);

  // Only show if there's text to play or audio is currently playing
  if (!text && !audioIsPlaying && !storeIsPlaying) {
    return null;
  }

  const handlePlayPause = () => {
    if (audioIsPlaying) {
      pauseAudio();
      pause();
    } else {
      playAudio(text, 'alloy'); // TODO: Use selected voice from settings
      play(text);
    }
  };

  const handleRewind = () => {
    // TODO: Implement rewind 10s functionality
    console.log('Rewind 10s');
  };

  const handleFastForward = () => {
    // TODO: Implement fast forward functionality
    console.log('Fast forward');
  };

  const handleClose = () => {
    pauseAudio();
    stop();
  };

  // Truncate text for display
  const displayText = text.length > 80 ? `${text.substring(0, 80)}...` : text;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 dark:border-slate-700 backdrop-blur-xl bg-white/80 dark:bg-slate-900/90">
      {/* Progress Bar */}
      <div className="h-1 bg-purple-100 dark:bg-purple-900/30 w-full">
        <div 
          className="h-full bg-purple-600 transition-all duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Now Reading */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex flex-col min-w-0">
                <span className={`text-xs text-slate-500 dark:text-slate-400 font-medium ${isLoading ? 'animate-pulse' : ''}`}>
                  {isLoading ? 'Loading...' : 'Now Reading'}
                </span>
                <p className={`text-sm text-slate-900 dark:text-white truncate ${isLoading ? 'animate-pulse' : ''}`}>
                  {displayText || 'No text selected'}
                </p>
              </div>
              <span className="shrink-0 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                Alloy
              </span>
            </div>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2">
            {/* Rewind 10s */}
            <button
              onClick={handleRewind}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Rewind 10 seconds"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={handlePlayPause}
              disabled={isLoading || !text}
              className="p-3 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
              aria-label={isLoading ? 'Loading' : audioIsPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : audioIsPlaying ? (
                <Pause className="w-6 h-6" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
              )}
            </button>

            {/* Fast Forward */}
            <button
              onClick={handleFastForward}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fast forward"
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>

          {/* Right: Speed & Close */}
          <div className="flex items-center gap-3">
            {/* Speed Indicator */}
            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {speed.toFixed(1)}x
              </span>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close player"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
