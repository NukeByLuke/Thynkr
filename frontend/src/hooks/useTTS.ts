/**
 * useTTS Hook - Text-to-Speech Audio Playback
 * Manages audio playback state, caching, and exclusive playback across the app
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  normalizeTTSPreferences,
  readTTSPreferencesFromStorage,
  subscribeToTTSPreferences,
  type TTSVoice,
} from '@/lib/ttsPreferences';

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
  const [preferredVoice, setPreferredVoice] = useState<TTSVoice | null>(null);
  const [preferredSpeed, setPreferredSpeed] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Pull user's saved TTS preferences when voice/speed are not explicitly passed.
  useEffect(() => {
    if (options.voice && typeof options.speed === 'number') {
      return;
    }

    let isCancelled = false;

    const cachedPreferences = readTTSPreferencesFromStorage();
    if (cachedPreferences.voice) {
      setPreferredVoice(cachedPreferences.voice);
    }
    if (typeof cachedPreferences.speed === 'number') {
      setPreferredSpeed(cachedPreferences.speed);
    }

    const fetchPreferences = async () => {
      try {
        const response = await api.get('/tts/preferences');
        if (isCancelled) return;

        const normalized = normalizeTTSPreferences(response?.data);
        if (normalized.voice) {
          setPreferredVoice(normalized.voice);
        }
        if (typeof normalized.speed === 'number') {
          setPreferredSpeed(normalized.speed);
        }
      } catch {
        // Silent fallback: defaults are still valid when preference fetch fails.
      }
    };

    fetchPreferences();

    return () => {
      isCancelled = true;
    };
  }, [options.speed, options.voice]);

  // Reflect live updates from Settings/Audio player while mounted.
  useEffect(() => {
    if (options.voice && typeof options.speed === 'number') {
      return;
    }

    return subscribeToTTSPreferences((preferences) => {
      if (preferences.voice && !options.voice) {
        setPreferredVoice(preferences.voice);
      }
      if (typeof preferences.speed === 'number' && typeof options.speed !== 'number') {
        setPreferredSpeed(preferences.speed);
      }
    });
  }, [options.speed, options.voice]);

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

  /**
   * Stop current audio playback
   */
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
    options.onPlayEnd?.();
  }, [options]);

  /**
   * Play audio from text using streaming negotiation
   */
  const play = useCallback(async (text: string) => {
    const cleanText = text?.trim();

    if (!cleanText) {
      toast.error('No text to play');
      return;
    }

    // Stop any global audio first (exclusive playback)
    stopGlobalAudio();

    // Cancel any in-flight negotiate request for this instance
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setError(null);
    setIsLoading(true);

    try {
      const voice = options.voice ?? preferredVoice ?? undefined;
      const speed = Math.min(4, Math.max(0.25, typeof options.speed === 'number' ? options.speed : (preferredSpeed ?? 1.0)));

      // Negotiate for a fresh streaming URL (tokenized URLs are short-lived).
      abortControllerRef.current = new AbortController();

      const payload: Record<string, unknown> = {
        text: cleanText,
      };

      if (voice) {
        payload.voice = voice;
      }

      const response = await api.post(
        '/tts/negotiate',
        payload,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.data.url) {
        throw new Error('No stream URL returned');
      }

      const audioUrl = buildStreamUrl(response.data.url);

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

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
        setError('Failed to play audio');
        options.onPlayEnd?.();
        toast.error('Failed to play audio');
        if (globalAudioInstance === audio) {
          globalAudioInstance = null;
          globalStopCallback = null;
        }
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
      setIsPlaying(false);
      setIsLoading(false);
      options.onPlayEnd?.();
      
      if (err.response?.status === 403) {
        toast.error('TTS limit reached. Upgrade to Pro for unlimited access.');
      } else {
        toast.error(errorMessage);
      }
    }
  }, [options, preferredSpeed, preferredVoice, stop]);

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
          { id: 'charon', name: 'Charon', description: 'Warm, trustworthy voice' },
          { id: 'fenrir', name: 'Fenrir', description: 'Firm, authoritative voice' },
          { id: 'puck', name: 'Puck', description: 'Breezy, storytelling voice' },
          { id: 'enceladus', name: 'Enceladus', description: 'Deep, commanding voice' },
          { id: 'aoede', name: 'Aoede', description: 'Energetic, expressive voice' },
          { id: 'kore', name: 'Kore', description: 'Upbeat, cheerful voice' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVoices();
  }, []);

  return { voices, isLoading };
}
