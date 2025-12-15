/**
 * OpenAI TTS Audio Streaming Hook
 * Provides audio playback with intelligent caching and state management
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

interface TTSCache {
  blobUrl: string;
  text: string;
  voice: string;
}

/**
 * Simple hash function for cache keys
 */
function hashText(text: string, voice: string): string {
  const content = `${text}:${voice}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

export function useOpenAITTS() {
  const { apiClient } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio element reference
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cache map: hash -> { blobUrl, text, voice }
  const cacheRef = useRef<Map<string, TTSCache>>(new Map());

  // Track current blob URL for cleanup
  const currentBlobUrlRef = useRef<string | null>(null);

  // Track if using system voice fallback
  const [isUsingSystemVoice, setIsUsingSystemVoice] = useState(false);

  // System voice utterance reference
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  /**
   * Initialize audio element
   */
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';

      // Event listeners
      audio.addEventListener('play', () => setIsPlaying(true));
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Playback failed');
        setIsPlaying(false);
      });

      audioRef.current = audio;
    }

    return () => {
      // Cleanup: revoke all blob URLs and destroy audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }

      // Revoke all cached blob URLs
      cacheRef.current.forEach((cache) => {
        URL.revokeObjectURL(cache.blobUrl);
      });
      cacheRef.current.clear();

      // Revoke current blob URL if exists
      if (currentBlobUrlRef.current) {
        URL.revokeObjectURL(currentBlobUrlRef.current);
        currentBlobUrlRef.current = null;
      }

      // Cancel any ongoing speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /**
   * Fallback to browser's built-in speech synthesis
   */
  const playWithSystemVoice = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      setError('System voice not available');
      return;
    }

    try {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
        setIsUsingSystemVoice(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setIsUsingSystemVoice(false);
      };

      utterance.onerror = (event) => {
        console.error('System voice error:', event);
        setIsPlaying(false);
        setIsUsingSystemVoice(false);
        setError('System voice playback failed');
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('System voice error:', err);
      setError('System voice unavailable');
    }
  }, []);

  /**
   * Play audio from text
   */
  const play = useCallback(
    async (text: string, voice: string = 'alloy') => {
      if (!audioRef.current) {
        setError('Audio system not initialized');
        return;
      }

      if (!text || text.trim().length === 0) {
        setError('No text provided');
        return;
      }

      setError(null);
      const hash = hashText(text, voice);

      // Check cache first
      const cached = cacheRef.current.get(hash);
      if (cached) {
        console.log('Playing from cache:', hash);
        audioRef.current.src = cached.blobUrl;
        audioRef.current.currentTime = 0;
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error('Cached playback error:', err);
          setError('Playback failed');
        }
        return;
      }

      // Fetch from API
      setIsLoading(true);
      try {
        const response = await apiClient.post('/tts', {
          text,
          voice,
        });

        if (!response.ok) {
          // Handle rate limiting
          if (response.status === 429) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || 'Voice limit reached. Please wait a moment.';
            toast.error(message);
            setError(message);
            return;
          }
          
          // Handle tier limit exceeded
          if (response.status === 403) {
            const errorData = await response.json().catch(() => ({}));
            if (errorData.upgradeRequired) {
              const message = errorData.message || 'Voice usage limit reached. Please upgrade your plan.';
              toast.error(message, { duration: 5000 });
              setError(message);
              // TODO: Open upgrade modal
              return;
            }
          }
          
          throw new Error(`TTS API error: ${response.statusText}`);
        }

        // Convert response to blob
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Store in cache
        cacheRef.current.set(hash, { blobUrl, text, voice });

        // Revoke previous blob URL if exists
        if (currentBlobUrlRef.current) {
          URL.revokeObjectURL(currentBlobUrlRef.current);
        }
        currentBlobUrlRef.current = blobUrl;

        // Play audio
        audioRef.current.src = blobUrl;
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      } catch (err: any) {
        console.error('TTS generation error:', err);
        
        // Fallback to system voice on API failure
        const isNetworkError = 
          err.message?.includes('fetch') || 
          err.message?.includes('network') || 
          err.message?.includes('Failed to fetch');
        
        if (isNetworkError || !navigator.onLine) {
          console.log('Falling back to system voice');
          toast('High-quality voice unavailable. Switched to system voice.', {
            icon: '🔊',
            duration: 3000,
          });
          playWithSystemVoice(text);
        } else {
          setError(err.message || 'Failed to generate audio');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [apiClient, playWithSystemVoice]
  );

  /**
   * Pause audio playback
   */
  const pause = useCallback(() => {
    if (isUsingSystemVoice && window.speechSynthesis) {
      window.speechSynthesis.pause();
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isUsingSystemVoice]);

  /**
   * Stop audio playback and reset to beginning
   */
  const stop = useCallback(() => {
    if (isUsingSystemVoice && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsUsingSystemVoice(false);
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, [isUsingSystemVoice]);

  /**
   * Clear cache (useful for memory management)
   */
  const clearCache = useCallback(() => {
    cacheRef.current.forEach((cache) => {
      URL.revokeObjectURL(cache.blobUrl);
    });
    cacheRef.current.clear();
    console.log('TTS cache cleared');
  }, []);

  return {
    isPlaying,
    isLoading,
    error,
    play,
    pause,
    stop,
    clearCache,
    audioElement: audioRef.current,
    isUsingSystemVoice,
  };
}
