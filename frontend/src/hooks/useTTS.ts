/**
 * useTTS Hook - Text-to-Speech Audio Playback
 * Manages audio playback state, caching, and exclusive playback across the app
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface UseTTSOptions {
  voice?: TTSVoice;
  speed?: number;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
}

interface UseTTSReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  play: (text: string) => Promise<void>;
  stop: () => void;
  toggle: (text: string) => Promise<void>;
}

// Global audio instance for exclusive playback
let globalAudioInstance: HTMLAudioElement | null = null;
let globalStopCallback: (() => void) | null = null;

// In-memory cache for audio blobs (session-based)
const audioCache = new Map<string, string>(); // key: hash, value: blob URL

/**
 * Generate cache key from text + voice + speed
 */
function generateCacheKey(text: string, voice: TTSVoice, speed: number): string {
  return `${text}:${voice}:${speed.toFixed(2)}`;
}

/**
 * Stop any currently playing global audio
 */
function stopGlobalAudio() {
  if (globalAudioInstance) {
    globalAudioInstance.pause();
    globalAudioInstance.currentTime = 0;
  }
  if (globalStopCallback) {
    globalStopCallback();
  }
}

export function useTTS(options: UseTTSOptions = {}): UseTTSReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  /**
   * Stop current audio playback
   */
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    options.onPlayEnd?.();
  }, [options]);

  /**
   * Play audio from text
   */
  const play = useCallback(async (text: string) => {
    if (!text?.trim()) {
      toast.error('No text to play');
      return;
    }

    // Stop any global audio first (exclusive playback)
    stopGlobalAudio();

    setError(null);
    setIsLoading(true);

    try {
      const voice = options.voice || 'alloy';
      const speed = options.speed || 1.0;
      const cacheKey = generateCacheKey(text, voice, speed);

      let audioUrl: string;

      // Check cache first
      if (audioCache.has(cacheKey)) {
        audioUrl = audioCache.get(cacheKey)!;
      } else {
        // Fetch from API
        abortControllerRef.current = new AbortController();
        
        const response = await api.post(
          '/tts',
          { text, voice, speed },
          {
            responseType: 'blob',
            signal: abortControllerRef.current.signal,
          }
        );

        const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(audioBlob);

        // Cache the URL (will be cleaned up when page unloads)
        audioCache.set(cacheKey, audioUrl);
      }

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = audioUrl;

      // Set as global audio for exclusive playback
      globalAudioInstance = audio;
      globalStopCallback = stop;

      // Setup event handlers
      audio.onended = () => {
        setIsPlaying(false);
        options.onPlayEnd?.();
        if (globalAudioInstance === audio) {
          globalAudioInstance = null;
          globalStopCallback = null;
        }
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setError('Failed to play audio');
        toast.error('Failed to play audio');
        setIsLoading(false);
      };

      // Start playback
      await audio.play();
      setIsPlaying(true);
      setIsLoading(false);
      options.onPlayStart?.();
    } catch (err: any) {
      console.error('TTS error:', err);
      
      if (err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }

      const errorMessage = err.response?.data?.error || err.message || 'Failed to generate audio';
      setError(errorMessage);
      setIsLoading(false);
      
      if (err.response?.status === 403) {
        toast.error('TTS limit reached. Upgrade to Pro for unlimited access.');
      } else {
        toast.error(errorMessage);
      }
    }
  }, [options, stop]);

  /**
   * Toggle play/stop
   */
  const toggle = useCallback(async (text: string) => {
    if (isPlaying) {
      stop();
    } else {
      await play(text);
    }
  }, [isPlaying, play, stop]);

  return {
    isPlaying,
    isLoading,
    error,
    play,
    stop,
    toggle,
  };
}

/**
 * Hook to fetch available TTS voices
 */
export function useTTSVoices() {
  const [voices, setVoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/tts/voices');
        setVoices(response.data.voices || []);
      } catch (error) {
        console.error('Failed to fetch TTS voices:', error);
        // Fallback to default voices
        setVoices(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  return { voices, isLoading };
}
