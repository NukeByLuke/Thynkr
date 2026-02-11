/**
 * AudioPlayer Component - Rich TTS Audio Player
 * Features: voice selection, speed control, progress bar, seek functionality
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
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
  className?: string;
  compact?: boolean;
  docked?: boolean;
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

function generateCacheKey(text: string, voice: TTSVoice): string {
  // We only cache by text and voice since speed is now client-side
  return `${text.slice(0, 100)}:${voice}`;
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
  className,
  compact = false,
  docked = false,
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
  const [estimatedDuration, setEstimatedDuration] = useState(0);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const resumeTimeRef = useRef<number | null>(null);
  const isChangingVoiceRef = useRef(false);

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

  // Estimate duration based on text length (rough approximation for streaming)
  useEffect(() => {
    // Avg 15 chars per second for normal speech speed
    // This provides a fallback duration while streaming
    // Adjust for playback speed
    if (text) {
        setEstimatedDuration((text.length / 15) / speed);
    }
  }, [text, speed]);

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
      setCurrentTime(audio.currentTime);
      
      // Update Media Session Position
      if ('mediaSession' in navigator && estimatedDuration > 0) {
          const effectiveDuration = (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) ? audio.duration : estimatedDuration;
          if (effectiveDuration > 0 && audio.currentTime <= effectiveDuration) {
               try {
                  navigator.mediaSession.setPositionState({
                      duration: effectiveDuration,
                      playbackRate: audio.playbackRate,
                      position: audio.currentTime
                  });
               } catch (e) {
                   // ignore errors
               }
          }
      }
    };

    const handleLoadedMetadata = () => setDuration(audio.duration);
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
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [onPlayEnd, estimatedDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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
    }
    setIsPlaying(false);
    setCurrentTime(0);
    onPlayEnd?.();
  }, [onPlayEnd]);

  // Media Session API Integration
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Audio Summary',
        artist: 'Thynkr AI',
        artwork: [
            { src: '/brand/brain-dark.png', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (audioRef.current) {
            audioRef.current.play();
            setIsPlaying(true);
        }
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
      });
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime !== undefined) {
             const effectiveDuration = (audioRef.current.duration && Number.isFinite(audioRef.current.duration)) ? audioRef.current.duration : estimatedDuration;
             // Clamp seek time
             const targetTime = Math.min(details.seekTime, effectiveDuration);
             audioRef.current.currentTime = targetTime;
             setCurrentTime(targetTime);
        }
      });
      navigator.mediaSession.setActionHandler('stop', () => {
         stop();
      });
    }
  }, [estimatedDuration, stop, setIsPlaying]);

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
        // Skip loading state for cached URLs
        setIsLoading(false);
      } else {
        abortControllerRef.current = new AbortController();

        // Negotiate for streaming URL (fast - just returns a token)
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
        
        // Negotiation complete - clear loading state before playback starts
        setIsLoading(false);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto'; // Optimize for instant streaming
      }

      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.volume = isMuted ? 0 : volume;
      audio.playbackRate = speed; // Apply client-side speed

      globalAudioInstance = audio;
      globalStopCallback = stop;

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        // Remove failed URL from cache so it can be re-negotiated
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
      setIsLoading(false);
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
    const effectiveDuration = (duration && isFinite(duration) && duration > 0) ? duration : estimatedDuration;
    
    if (!progressRef.current || !audioRef.current || !effectiveDuration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * effectiveDuration;

    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration, estimatedDuration]);

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

  // Use real duration if available (e.g. fully buffered), otherwise use estimate
  const effectiveDuration = (duration && Number.isFinite(duration) && duration > 0) ? duration : estimatedDuration;
  const progress = effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0;

  // --- DOCKED/FLOATING PLAYER LAYOUT ---
  if (docked) {
    const playerContent = (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-brand-200/50 dark:border-gray-700 shadow-[0_-8px_32px_rgba(0,0,0,0.1)]"
      >
        {/* Progress Bar (Top Edge) - REMOVED to avoid duplicate refs and confusion */}
        
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-4">
            
            {/* Play/Pause Button - Prominent */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-cyan-500 dark:to-violet-600 text-white shadow-lg hover:shadow-pink-500/25 dark:hover:shadow-cyan-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            {/* Main Content Area: Title & Progress */}
            <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
               <div className="flex justify-between items-baseline">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {isLoading ? 'Generating Audio...' : 'Audio Summary'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {formatTime(currentTime)} / {formatTime(effectiveDuration)}
                  </div>
               </div>

               {/* Seek Bar - Thicker and interactive */}
               <div
                  ref={progressRef}
                  onClick={handleProgressClick}
                  className="relative h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group"
                >
                  <motion.div
                    className="absolute h-full rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-600 dark:from-cyan-400 dark:to-violet-500"
                    style={{ width: `${progress}%` }}
                  />
                  {/* Seek Handle */}
                  <motion.div 
                     className="absolute top-1/2 -mt-2 w-4 h-4 bg-white dark:bg-gray-200 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                     style={{ left: `calc(${progress}% - 8px)` }}
                  />
               </div>
            </div>


            {/* Right: Controls & Settings */}
            <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700">
               {/* Voice Settings */}
               <div className="hidden md:flex flex-col items-center">
                  <span className="text-[10px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Voice</span>
                  <button 
                    onClick={() => setActiveSetting(activeSetting === 'voice' ? null : 'voice')}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", 
                      activeSetting === 'voice' 
                        ? "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 ring-2 ring-fuchsia-500 ring-opacity-50" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    )}
                  >
                    {TTS_VOICES.find(v => v.id === voice)?.name || voice}
                  </button>
               </div>

               {/* Speed Settings */}
               <div className="hidden md:flex flex-col items-center">
                  <span className="text-[10px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Speed</span>
                  <button 
                     onClick={() => setActiveSetting(activeSetting === 'speed' ? null : 'speed')}
                     className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", 
                      activeSetting === 'speed' 
                        ? "bg-fuchsia-100 dark:bg-fuchsia-900/40 text-fuchsia-700 dark:text-fuchsia-300 ring-2 ring-fuchsia-500 ring-opacity-50" 
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                     )}
                  >
                     {speed}x
                  </button>
               </div>
              
               {/* Close */}
               {onClose && (
                <button
                  onClick={() => {
                   stop();
                   onClose();
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors ml-2"
                  title="Close Player"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>

          {/* Expanded Settings Panel (for Docked Mode) */}
          <AnimatePresence>
            {activeSetting && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-100 dark:border-gray-800 mt-4 md:absolute md:bottom-full md:right-4 md:w-80 md:bg-white md:dark:bg-gray-900 md:rounded-2xl md:shadow-2xl md:border md:border-gray-200 md:dark:border-gray-700 md:mb-4"
              >
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center md:hidden">
                       <h3 className="text-sm font-semibold capitalize">{activeSetting} Settings</h3>
                       <button onClick={() => setActiveSetting(null)}><X className="w-4 h-4" /></button>
                    </div>

                    {activeSetting === 'voice' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Voice</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TTS_VOICES.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => handleVoiceChange(v.id as TTSVoice)}
                                className={clsx(
                                'px-2 py-2 rounded-lg text-xs font-medium transition-all border text-left',
                                voice === v.id
                                    ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300'
                                    : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                                )}
                            >
                                <span className="block font-bold">{v.name}</span>
                                <span className="text-[10px] opacity-75 truncate block">{v.description}</span>
                            </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {activeSetting === 'speed' && (
                      <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Speed: {speed}x</label>
                      <div className="grid grid-cols-4 gap-2">
                          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSpeedChange(s)}
                              className={clsx(
                                'px-2 py-2 rounded-lg text-xs font-medium transition-all border',
                                Math.abs(speed - s) < 0.01
                                  ? 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 shadow-sm'
                                  : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
                className="h-full bg-fuchsia-500 dark:bg-violet-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span>{formatTime(effectiveDuration)}</span>
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
        className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer mb-4 group"
      >
        {/* Progress fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-cyan-500 dark:to-violet-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
        {/* Seek handle */}
        <motion.div
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
