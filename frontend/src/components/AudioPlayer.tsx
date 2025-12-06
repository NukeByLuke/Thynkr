import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, RotateCw, Settings, X, Loader2 } from 'lucide-react';
import { useTTS, TTS_VOICES, TTS_SPEEDS, TTSVoice } from '../contexts/TTSContext';

interface AudioPlayerProps {
  compact?: boolean;
  onClose?: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ compact = false, onClose }: AudioPlayerProps) {
  const {
    isPlaying,
    isLoading,
    currentTrack,
    currentTime,
    duration,
    voice,
    speed,
    pause,
    resume,
    stop,
    seekTo,
    seekRelative,
    setVoice,
    setSpeed,
    queue,
  } = useTTS();

  const [showSettings, setShowSettings] = useState(false);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Don't capture if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (!currentTrack) return;

      switch (event.key) {
        case ' ':
          event.preventDefault();
          isPlaying ? pause() : resume();
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            seekRelative(-10);
          }
          break;
        case 'ArrowRight':
          if (event.shiftKey) {
            seekRelative(10);
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, pause, resume, seekRelative]);

  const handleSeekBarClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!seekBarRef.current || !duration) return;
      const rect = seekBarRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = x / rect.width;
      seekTo(percentage * duration);
    },
    [duration, seekTo]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!currentTrack) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-750 rounded-xl shadow-sm">
        {/* Play/Pause */}
        <button
          onClick={() => (isPlaying ? pause() : resume())}
          disabled={isLoading}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-50"
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
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentTrack.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div
          ref={seekBarRef}
          onClick={handleSeekBarClick}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full cursor-pointer overflow-hidden"
        >
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Player */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-gray-900 dark:via-gray-850 dark:to-gray-900 rounded-2xl p-6 shadow-2xl border border-slate-700/50">
        {/* Decorative glow */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/10 via-purple-500/5 to-primary-500/10 blur-xl pointer-events-none" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{currentTrack.title}</h3>
              {queue.length > 0 && (
                <p className="text-sm text-slate-400">{queue.length} more in queue</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Settings button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  showSettings
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                aria-label="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {onClose && (
                <button
                  onClick={() => {
                    stop();
                    onClose();
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div
              ref={seekBarRef}
              onClick={handleSeekBarClick}
              className="relative h-2 bg-slate-700 rounded-full cursor-pointer group"
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
            >
              {/* Progress fill */}
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full transition-all group-hover:from-primary-300 group-hover:to-primary-400"
                style={{ width: `${progress}%` }}
              />
              {/* Knob */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progress}% - 8px)` }}
              />
            </div>

            {/* Time display */}
            <div className="flex justify-between mt-2 text-sm text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {/* Back 10s */}
            <button
              onClick={() => seekRelative(-10)}
              className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
              aria-label="Back 10 seconds"
            >
              <RotateCcw className="h-6 w-6" />
              <span className="sr-only">-10s</span>
            </button>

            {/* Play/Pause */}
            <button
              onClick={() => (isPlaying ? pause() : resume())}
              disabled={isLoading}
              className="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white hover:from-primary-300 hover:to-primary-500 shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50 hover:scale-105"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </button>

            {/* Forward 10s */}
            <button
              onClick={() => seekRelative(10)}
              className="p-3 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-full transition-all"
              aria-label="Forward 10 seconds"
            >
              <RotateCw className="h-6 w-6" />
              <span className="sr-only">+10s</span>
            </button>
          </div>

          {/* Speed indicator */}
          <div className="flex justify-center mt-4">
            <span className="px-3 py-1 text-sm text-slate-400 bg-slate-700/50 rounded-full">
              {speed}× speed
            </span>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          ref={settingsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl p-4 z-10"
        >
          {/* Voice selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Voice</label>
            <div className="grid grid-cols-2 gap-2">
              {TTS_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id as TTSVoice)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all ${
                    voice === v.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Speed selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Playback Speed</label>
            <div className="flex gap-2">
              {TTS_SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg transition-all ${
                    speed === s.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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
  );
}
