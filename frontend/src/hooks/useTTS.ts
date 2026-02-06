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

// In-memory cache for streaming URLs (session-based)
// Note: These are backend stream URLs, not blob URLs
const audioCache = new Map<string, string>(); // key: hash, value: stream URL

/**
 * Generate cache key from text + voice (speed is client-side)
 */
function generateCacheKey(text: string, voice: TTSVoice): string {
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
   * Play audio from text using streaming negotiation
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
      const cacheKey = generateCacheKey(text, voice);

      let audioUrl: string;

      // Check cache first (cached URLs may have expired, but browser handles that)
      if (audioCache.has(cacheKey)) {
        audioUrl = audioCache.get(cacheKey)!;
      } else {
        // Negotiate for streaming URL (fast - just returns a token)
        abortControllerRef.current = new AbortController();
        
        const response = await api.post(
          '/tts/negotiate',
          { text, voice, speed: 1 }, // speed=1 since it's handled client-side
          { signal: abortControllerRef.current.signal }
        );

        if (!response.data.url) {
          throw new Error('No stream URL returned');
        }

        // Build full streaming URL
        audioUrl = buildStreamUrl(response.data.url);

        // Cache the URL for reuse (tokens expire in 1 min but cached audio persists)
        audioCache.set(cacheKey, audioUrl);
      }

      // Create or reuse audio element with preload for instant start
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.preload = 'auto';
      }

      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.playbackRate = speed; // Apply client-side speed

      // Set as global audio for exclusive playback
      globalAudioInstance = audio;
      globalStopCallback = stop;

      // Setup event handlers
      audio.oncanplaythrough = () => {
        // Audio is ready to play without buffering
        setIsLoading(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        options.onPlayEnd?.();
        if (globalAudioInstance === audio) {
          globalAudioInstance = null;
          globalStopCallback = null;
        }
      };

      audio.onerror = (e) => {
        setIsPlaying(false);
        setIsLoading(false);
        // Remove failed URL from cache so it can be re-negotiated
        audioCache.delete(cacheKey);
        setError('Failed to play audio');
        toast.error('Failed to play audio');
      };

      // Start playback immediately - audio will stream in
      // Loading state will clear when canplaythrough fires
      await audio.play();
      setIsPlaying(true);
      // Clear loading immediately after play starts (streaming)
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

export interface TTSVoiceInfo {
  id: string;
  name: string;
  description: string;
}

/**
 * Hook to fetch available TTS voices
 */
export function useTTSVoices() {
  const [voices, setVoices] = useState<TTSVoiceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/tts/voices');
        setVoices(response.data.voices || []);
      } catch (error) {
        console.error('Failed to fetch TTS voices:', error);
        // Fallback to default voice objects
        setVoices([
          { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
          { id: 'echo', name: 'Echo', description: 'Warm, conversational voice' },
          { id: 'fable', name: 'Fable', description: 'Expressive, narrative voice' },
          { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
          { id: 'nova', name: 'Nova', description: 'Friendly, energetic voice' },
          { id: 'shimmer', name: 'Shimmer', description: 'Clear, pleasant voice' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  return { voices, isLoading };
}
