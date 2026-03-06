/**
 * AudioPlayer Component - Rich TTS Audio Player
 * Features: voice selection, speed control, progress bar, seek functionality
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
  Settings,
  GripVertical,
  X,
  Loader2,
  // Mic2, // removed
  // Gauge // removed
} from 'lucide-react';
import { api } from '@/lib/api';
import { TTS_VOICES } from '@/lib/constants';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export type TTSVoice = 'charon' | 'fenrir' | 'puck' | 'enceladus' | 'aoede' | 'kore';

interface AudioPlayerProps {
  text: string;
  title?: string;
  className?: string;
  compact?: boolean;
  docked?: boolean;
  autoPlay?: boolean;
  autoPlayKey?: string | number;
  onClose?: () => void;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

interface TTSPreferences {
  voice: TTSVoice;
  speed: number;
}

// Global audio instance for exclusive playback
let globalAudioInstance: HTMLAudioElement | null = null;
let globalStopCallback: (() => void) | null = null;

// In-memory cache for streaming URLs (not blobs)
const audioCache = new Map<string, string>();

function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

function generateCacheKey(text: string, voice: TTSVoice): string {
  // Full-text hash prevents collisions for similarly prefixed content.
  return `${voice}:${text.length}:${fnv1aHash(text)}`;
}

/**
 * Build full backend URL for streaming
 */
function buildStreamUrl(path: string): string {
  let baseURL = import.meta.env.VITE_API_URL || '/api';
  
  // If baseURL is relative, prepend origin
  if (baseURL.startsWith('/')) {
    baseURL = `${window.location.origin}${baseURL}`;
  }
  
  // Remove trailing slash
  baseURL = baseURL.replace(/\/$/, '');
  
  // Construct URL and fix potential double-api issue
  let url = `${baseURL}${path}`;
  url = url.replace('/api/api/', '/api/');
  
  return url;
}

function stopGlobalAudio() {
  if (globalAudioInstance) {
    globalAudioInstance.pause();
    globalAudioInstance.currentTime = 0;
  }
  if (globalStopCallback) {
    globalStopCallback();
  }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({
  text,
  title = 'Audio Summary',
  className,
  compact = false,
  docked = false,
  autoPlay = false,
  autoPlayKey,
  onClose,
  onPlayStart,
  onPlayEnd,
}: AudioPlayerProps) {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Settings state
  const [activeSetting, setActiveSetting] = useState<'voice' | 'speed' | null>(null);
  const [voice, setVoice] = useState<TTSVoice>('charon');
  const [speed, setSpeed] = useState(1.0);
  const [dragConstraints, setDragConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const floatingPlayerRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resumeTimeRef = useRef<number | null>(null);
  const isChangingVoiceRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastAutoPlayKeyRef = useRef<string | number | undefined>(undefined);
  const dragControls = useDragControls();

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await api.get('/tts/preferences');
        if (response.data.voice) setVoice(response.data.voice);
        if (response.data.speed) setSpeed(response.data.speed);
      } catch (error) {
        // Use defaults
      }
    };
    loadPreferences();
  }, []);

  // Smooth 60fps progress updates using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let lastUpdate = 0;
    const update = (timestamp: number) => {
      // Throttle to ~30fps to avoid excessive re-renders while staying smooth
      if (timestamp - lastUpdate >= 33) {
        const audio = audioRef.current;
        if (audio) {
          setCurrentTime(audio.currentTime);
          // Update Media Session position state
          if ('mediaSession' in navigator && audio.duration && Number.isFinite(audio.duration)) {
            try {
              navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: audio.playbackRate,
                position: Math.min(audio.currentTime, audio.duration),
              });
            } catch (_) { /* ignore */ }
          }
        }
        lastUpdate = timestamp;
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying]);

  // Save preferences when changed
  const savePreferences = useCallback(async (newVoice?: TTSVoice, newSpeed?: number) => {
    try {
      const updates: Partial<TTSPreferences> = {};
      if (newVoice) updates.voice = newVoice;
      if (newSpeed !== undefined) updates.speed = newSpeed;
      await api.patch('/tts/preferences', updates);
    } catch (error) {
      console.error('Failed to save TTS preferences:', error);
    }
  }, []);

  // Update time as audio plays
  useEffect(() => {
    // Ensure audio instance exists
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      // RAF handles smooth updates; this is a fallback for edge cases
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    
    const handleDurationChange = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onPlayEnd?.();
      if (globalAudioInstance === audio) {
        globalAudioInstance = null;
        globalStopCallback = null;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlayEnd]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        if (globalAudioInstance === audioRef.current) {
          globalAudioInstance = null;
          globalStopCallback = null;
        }
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      if (globalAudioInstance === audioRef.current) {
        globalAudioInstance = null;
        globalStopCallback = null;
      }
    }
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayEnd?.();
  }, [onPlayEnd]);

  const seekBySeconds = useCallback(
    (deltaSeconds: number) => {
      if (!audioRef.current) {
        return;
      }

      const audio = audioRef.current;
      const nextTime = audio.currentTime + deltaSeconds;
      const maxTime =
        Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : Number.POSITIVE_INFINITY;
      const clamped = Math.max(0, Math.min(nextTime, maxTime));

      audio.currentTime = clamped;
      setCurrentTime(clamped);
    },
    []
  );

  // Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      const setActionHandlerSafely = (
        action: MediaSessionAction,
        handler: MediaSessionActionHandler | null
      ) => {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Some browsers do not support every action type.
        }
      };

      navigator.mediaSession.metadata = new MediaMetadata({
        title,
        artist: 'Thynkr AI',
        artwork: [
            { src: '/brand/brain-dark.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      setActionHandlerSafely('play', () => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
      });
      setActionHandlerSafely('pause', () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
      });
      setActionHandlerSafely('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
             const dur = audioRef.current.duration;
             if (dur && Number.isFinite(dur)) {
               const targetTime = Math.min(details.seekTime, dur);
               audioRef.current.currentTime = targetTime;
               setCurrentTime(targetTime);
             }
        }
      });
      setActionHandlerSafely('stop', () => {
         stop();
      });

      setActionHandlerSafely('seekbackward', (details) => {
        const jump = typeof details.seekOffset === 'number' ? details.seekOffset : 15;
        seekBySeconds(-jump);
      });

      setActionHandlerSafely('seekforward', (details) => {
        const jump = typeof details.seekOffset === 'number' ? details.seekOffset : 15;
        seekBySeconds(jump);
      });
    }
  }, [seekBySeconds, setIsPlaying, stop, title]);

  const play = useCallback(async () => {
    if (!text?.trim()) {
      toast.error('No text to play');
      return;
    }

    // Stop any global audio first
    stopGlobalAudio();

    // Loading state only during negotiation, not entire playback
    setIsLoading(true);

    try {
      // NOTE: We always request speed: 1 from server to allow client-side speed changes without regeneration
      const cacheKey = generateCacheKey(text, voice);
      let audioUrl: string;

      if (audioCache.has(cacheKey)) {
        audioUrl = audioCache.get(cacheKey)!;
      } else {
        abortControllerRef.current = new AbortController();

        // Negotiate for streaming URL (fast — server starts generation immediately)
        const response = await api.post(
          '/tts/negotiate',
          { text, voice, speed: 1 }, 
          { signal: abortControllerRef.current.signal }
        );

        if (!response.data.url) {
          throw new Error('No stream URL returned');
        }

        // Build full streaming URL
        audioUrl = buildStreamUrl(response.data.url);
        
        // Cache the URL for voice change resume
        audioCache.set(cacheKey, audioUrl);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto'; // Optimize for instant streaming
      }

      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = speed;

      globalAudioInstance = audio;
      globalStopCallback = stop;

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        audioCache.delete(cacheKey);
        toast.error('Failed to play audio');
      };
      
      // Handle resuming from voice change
      if (resumeTimeRef.current !== null) {
          audio.currentTime = resumeTimeRef.current;
          resumeTimeRef.current = null;
      }

      await audio.play();
      setIsPlaying(true);
      setIsLoading(false); // Only clear loading AFTER playback actually starts
      onPlayStart?.();
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.error('TTS error:', err);
      setIsLoading(false);

      if (err.response?.status === 403) {
        toast.error('TTS limit reached. Upgrade for more access.');
      } else {
        toast.error(err.response?.data?.error || 'Failed to generate audio');
      }
    }
  }, [text, voice, speed, volume, isMuted, stop, onPlayStart]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else if (audioRef.current?.src && currentTime > 0) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      play();
    }
  }, [isPlaying, currentTime, play]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !audioRef.current || !duration || !Number.isFinite(duration)) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? volume : 0;
    }
    setIsMuted(!isMuted);
  }, [isMuted, volume]);

  const handleVoiceChange = useCallback((newVoice: TTSVoice) => {
    if (isPlaying) {
      isChangingVoiceRef.current = true;
      resumeTimeRef.current = currentTime;
      // Just pause, don't full stop to keep UI state
      audioRef.current?.pause();
      setIsPlaying(false);
    }
    
    setVoice(newVoice);
    savePreferences(newVoice, undefined);
  }, [savePreferences, isPlaying, currentTime]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    savePreferences(undefined, newSpeed);
    
    // Changing speed does not require regeneration anymore
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, [savePreferences]);
  
  // Re-trigger play when voice changes if we were playing
  useEffect(() => {
    if (isChangingVoiceRef.current) {
        play();
        isChangingVoiceRef.current = false;
    }
  }, [voice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start playback when a new request is opened.
  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    if (autoPlayKey === undefined) {
      return;
    }

    if (lastAutoPlayKeyRef.current === autoPlayKey) {
      return;
    }
    lastAutoPlayKeyRef.current = autoPlayKey;

    setCurrentTime(0);
    setDuration(0);
    setActiveSetting(null);
    void play();
  }, [autoPlay, autoPlayKey, play]);

  // Keep drag area inside viewport while still allowing free movement.
  useEffect(() => {
    if (!docked) {
      return;
    }

    const updateConstraints = () => {
      const margin = 16;
      const width = floatingPlayerRef.current?.offsetWidth ?? 360;
      const height = floatingPlayerRef.current?.offsetHeight ?? 280;

      const horizontalTravel = Math.max(0, window.innerWidth - width - margin * 2);
      const verticalTravel = Math.max(0, window.innerHeight - height - margin * 2);

      setDragConstraints({
        left: -horizontalTravel,
        right: 0,
        top: -verticalTravel,
        bottom: 0,
      });
    };

    updateConstraints();
    window.addEventListener('resize', updateConstraints, { passive: true });
    window.addEventListener('orientationchange', updateConstraints, { passive: true });

    return () => {
      window.removeEventListener('resize', updateConstraints);
      window.removeEventListener('orientationchange', updateConstraints);
    };
  }, [activeSetting, docked, text]);

  // Use real duration (always available with Content-Length responses)
  const progress = (duration > 0 && Number.isFinite(duration)) 
    ? Math.min((currentTime / duration) * 100, 100) 
    : 0;

  const selectedVoiceLabel = TTS_VOICES.find((v) => v.id === voice)?.name || voice;

  // --- DOCKED/FLOATING PLAYER LAYOUT ---
  if (docked) {
    const playerContent = (
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        drag
        dragControls={dragControls}
        dragListener={false}
        dragMomentum={false}
        dragElastic={0.08}
        dragConstraints={dragConstraints}
        className="fixed bottom-4 right-4 z-[90] w-[min(92vw,24rem)] sm:w-[23rem] touch-none"
      >
        <div
          ref={floatingPlayerRef}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/95"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2 dark:border-slate-700/70">
            <div className="min-w-0 flex-1 flex items-center gap-1.5">
              <button
                type="button"
                onPointerDown={(event) => dragControls.start(event)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-grab active:cursor-grabbing"
                title="Drag player"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {isLoading ? 'Generating audio...' : title}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{selectedVoiceLabel} voice</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveSetting(activeSetting ? null : 'voice')}
                className={clsx(
                  'inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                  activeSetting
                    ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
                title="Open audio settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    stop();
                    onClose();
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  title="Close player"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="px-3 pt-3">
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"
            >
              {isLoading && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent animate-shimmer dark:via-cyan-400/40" />
              )}
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 transition-[width] duration-150 ease-linear dark:from-cyan-500 dark:to-violet-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-3 pb-2 pt-3">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => seekBySeconds(-15)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Back 15 seconds"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                disabled={isLoading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 text-white shadow-md transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100 dark:from-cyan-500 dark:to-violet-600"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5 fill-current" />
                ) : (
                  <Play className="h-5 w-5 fill-current ml-0.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => seekBySeconds(15)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Forward 15 seconds"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={stop}
                disabled={!isPlaying && currentTime <= 0}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Stop"
              >
                <Square className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSetting(activeSetting === 'speed' ? null : 'speed')}
                className={clsx(
                  'rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                  activeSetting === 'speed'
                    ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                )}
                title="Playback speed"
              >
                {speed}x
              </button>
              <button
                type="button"
                onClick={() => setActiveSetting(activeSetting === 'voice' ? null : 'voice')}
                className={clsx(
                  'rounded-lg px-2 py-1 text-xs font-semibold transition-colors',
                  activeSetting === 'voice'
                    ? 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                )}
                title="Select voice"
              >
                {selectedVoiceLabel}
              </button>
            </div>
          </div>

          <div className="px-3 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-fuchsia-500 dark:bg-slate-700 dark:accent-cyan-500"
                aria-label="Volume"
              />
            </div>
          </div>

          <AnimatePresence>
            {activeSetting && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-slate-200/70 px-3 pb-3 pt-3 dark:border-slate-700/70"
              >
                {activeSetting === 'voice' && (
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Voice
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {TTS_VOICES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => handleVoiceChange(v.id as TTSVoice)}
                          className={clsx(
                            'rounded-lg border px-2 py-2 text-left text-xs transition-all',
                            voice === v.id
                              ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300'
                              : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                          )}
                        >
                          <span className="block font-semibold">{v.name}</span>
                          <span className="block truncate text-[10px] opacity-80">{v.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeSetting === 'speed' && (
                  <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Speed: {speed}x
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSpeedChange(s)}
                          className={clsx(
                            'rounded-lg border px-2 py-2 text-xs font-medium transition-all',
                            Math.abs(speed - s) < 0.01
                              ? 'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-900/20 dark:text-fuchsia-300'
                              : 'border-transparent bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                          )}
                        >
                          {s === 1 ? 'Normal' : `${s}x`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );

    return createPortal(playerContent, document.body);
  }

  if (compact) {
    return (
      <div className={clsx('flex items-center gap-2', className)}>
        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="p-2 rounded-lg bg-fuchsia-100 dark:bg-violet-900/30 text-fuchsia-600 dark:text-violet-400 hover:bg-fuchsia-200 dark:hover:bg-violet-900/50 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </button>
        {isPlaying && (
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-fuchsia-500 dark:bg-violet-500 transition-[width] duration-150 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{formatTime(duration)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm', className)}>
      {/* Progress Bar */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer mb-4 group overflow-hidden"
      >
        {/* Loading shimmer */}
        {isLoading && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-fuchsia-400/40 dark:via-cyan-400/40 to-transparent animate-shimmer" />
        )}
        {/* Progress fill */}
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-cyan-500 dark:to-violet-500 rounded-full transition-[width] duration-150 ease-linear"
          style={{ width: `${progress}%` }}
        />
        {/* Seek handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-lg border-2 border-fuchsia-500 dark:border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progress}% - 8px)` }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left: Play Controls */}
        <div className="flex items-center gap-2">

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-cyan-500 dark:to-violet-500 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          {isPlaying && (
            <button
              onClick={stop}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Stop"
            >
              <Square className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Right: Volume & Settings */}
        <div className="flex items-center gap-3">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-fuchsia-500 dark:accent-cyan-500"
            />
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setActiveSetting(activeSetting ? null : 'voice')}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              activeSetting
                ? 'bg-fuchsia-100 dark:bg-violet-900/30 text-fuchsia-600 dark:text-violet-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {activeSetting && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold capitalize">{activeSetting} Settings</h3>
                <div className="flex gap-2 text-xs">
                     <button onClick={() => setActiveSetting('voice')} className={clsx("px-2 py-1 rounded", activeSetting === 'voice' ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300' : 'text-gray-500')}>Voice</button>
                     <button onClick={() => setActiveSetting('speed')} className={clsx("px-2 py-1 rounded", activeSetting === 'speed' ? 'bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300' : 'text-gray-500')}>Speed</button>
                </div>
              </div>

              {/* Voice Selection */}
              {activeSetting === 'voice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Voice
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TTS_VOICES.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVoiceChange(v.id as TTSVoice)}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                        voice === v.id
                          ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-cyan-500 dark:to-violet-500 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      <div className="font-semibold">{v.name}</div>
                      <div className="text-xs opacity-75">{v.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Speed Control (YouTube Style) */}
              {activeSetting === 'speed' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Speed
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={clsx(
                        'px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                        Math.abs(speed - s) < 0.01
                          ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 shadow-sm'
                          : 'border-transparent bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      )}
                    >
                      {s === 1 ? 'Normal' : `${s}x`}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
