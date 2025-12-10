import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  ChevronDown,
  Loader2,
  Volume2,
  Settings,
  ListMusic,
  Repeat,
} from 'lucide-react';
import { useTTS, TTS_VOICES, TTS_SPEEDS, TTSVoice } from '@/contexts/TTSContext';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MiniPlayer() {
  const {
    isPlaying,
    isLoading,
    currentTrack,
    currentTime,
    duration,
    voice,
    speed,
    queue,
    pause,
    resume,
    stop,
    seekTo,
    seekRelative,
    setVoice,
    setSpeed,
    isMinimized,
    setIsMinimized,
    isLooping,
    toggleLoop,
  } = useTTS();

  const [showSettings, setShowSettings] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    if (!currentTrack) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Don't capture if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          isPlaying ? pause() : resume();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          seekRelative(-5);
          break;
        case 'ArrowRight':
          event.preventDefault();
          seekRelative(5);
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, pause, resume, seekRelative]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    seekTo(percentage * duration);
  };

  // Minimized state - just a small floating button
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg shadow-primary-500/25 flex items-center justify-center text-white hover:scale-105 transition-transform"
        aria-label="Open audio player"
      >
        {isPlaying ? (
          <Volume2 className="h-6 w-6 animate-pulse" />
        ) : (
          <Play className="h-6 w-6 ml-0.5" />
        )}
      </button>
    );
  }

  return (
    <>
      {/* Backdrop for settings */}
      {showSettings && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
      )}

      {/* Mini Player Dock */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-md z-50">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 md:rounded-2xl shadow-2xl border-t md:border border-slate-700/50 overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 via-purple-500/5 to-primary-500/5 pointer-events-none" />

          {/* Progress bar (top) - smooth animation */}
          <div
            onClick={handleSeekBarClick}
            className="relative h-1 bg-slate-700 cursor-pointer group"
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="relative p-3 md:p-4">
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={() => (isPlaying ? pause() : resume())}
                disabled={isLoading}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:scale-105 transition-all disabled:opacity-50"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentTrack.title}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-slate-600">/</span>
                  <span>{formatTime(duration)}</span>
                  <span className="text-slate-600">•</span>
                  <span>{speed}×</span>
                  {queue.length > 0 && (
                    <>
                      <span className="text-slate-600">•</span>
                      <ListMusic className="h-3 w-3" />
                      <span>{queue.length}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Skip controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => seekRelative(-10)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                  aria-label="Back 10 seconds"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => seekRelative(10)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                  aria-label="Forward 10 seconds"
                >
                  <RotateCw className="h-4 w-4" />
                </button>
              </div>

              {/* Loop toggle */}
              <button
                onClick={toggleLoop}
                className={`p-2 rounded-lg transition-colors ${
                  isLooping
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
              >
                <Repeat className="h-4 w-4" />
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Minimize */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                aria-label="Minimize"
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Close */}
              <button
                onClick={stop}
                className="p-2 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-4 pt-4 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                {/* Voice selection */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Voice</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {TTS_VOICES.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setVoice(v.id as TTSVoice)}
                        className={`px-2 py-1.5 text-xs rounded-lg transition-all ${
                          voice === v.id
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Speed selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Speed</label>
                  <div className="flex gap-1.5">
                    {TTS_SPEEDS.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setSpeed(s.value)}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-all ${
                          speed === s.value
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
