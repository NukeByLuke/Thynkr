/**
 * GlobalAudioContext
 * 
 * Optimized site-wide audio player using Interface Segregation Principle.
 * Split into two contexts to prevent unnecessary re-renders:
 * - AudioStateContext: For components that READ audio state (time, playing status)
 * - AudioActionsContext: For components that only TRIGGER audio (play/pause/skip)
 * 
 * This pattern ensures buttons/triggers don't re-render when playback time updates.
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type VoiceId = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface AudioQueueItem {
  id: string;
  text: string;
  audioUrl?: string;
  title?: string;
}

export interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  voiceId: VoiceId;
  playbackRate: number;
  volume: number;
  queue: AudioQueueItem[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
}

export interface AudioActions {
  play: (item?: AudioQueueItem) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  setVoice: (voice: VoiceId) => void;
  setPlaybackRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  addToQueue: (items: AudioQueueItem | AudioQueueItem[]) => void;
  clearQueue: () => void;
  removeFromQueue: (id: string) => void;
}

// ============================================================================
// CONTEXTS
// ============================================================================

const AudioStateContext = createContext<AudioState | undefined>(undefined);
const AudioActionsContext = createContext<AudioActions | undefined>(undefined);

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  VOICE: 'thynkr_audio_voice',
  PLAYBACK_RATE: 'thynkr_audio_playback_rate',
  VOLUME: 'thynkr_audio_volume',
} as const;

const DEFAULT_VALUES = {
  VOICE: 'alloy' as VoiceId,
  PLAYBACK_RATE: 1.0,
  VOLUME: 1.0,
} as const;

// ============================================================================
// PROVIDER
// ============================================================================

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioElement] = useState(() => new Audio());

  // Initialize preferences from localStorage
  const getStoredVoice = (): VoiceId => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOICE);
      return (stored as VoiceId) || DEFAULT_VALUES.VOICE;
    } catch {
      return DEFAULT_VALUES.VOICE;
    }
  };

  const getStoredPlaybackRate = (): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLAYBACK_RATE);
      return stored ? parseFloat(stored) : DEFAULT_VALUES.PLAYBACK_RATE;
    } catch {
      return DEFAULT_VALUES.PLAYBACK_RATE;
    }
  };

  const getStoredVolume = (): number => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.VOLUME);
      return stored ? parseFloat(stored) : DEFAULT_VALUES.VOLUME;
    } catch {
      return DEFAULT_VALUES.VOLUME;
    }
  };

  // State
  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    voiceId: getStoredVoice(),
    playbackRate: getStoredPlaybackRate(),
    volume: getStoredVolume(),
    queue: [],
    currentIndex: -1,
    isLoading: false,
    error: null,
  });

  // Persist to localStorage with error handling
  const persistPreference = useCallback((key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('Failed to persist audio preference:', error);
    }
  }, []);

  // Setup audio element
  useEffect(() => {
    audioRef.current = audioElement;
    audioElement.volume = state.volume;
    audioElement.playbackRate = state.playbackRate;

    // Event listeners
    const handleTimeUpdate = () => {
      setState((prev) => ({
        ...prev,
        currentTime: audioElement.currentTime,
      }));
    };

    const handleDurationChange = () => {
      setState((prev) => ({
        ...prev,
        duration: audioElement.duration,
      }));
    };

    const handleEnded = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
      }));
      // Auto-play next in queue
      skipNext();
    };

    const handleError = () => {
      setState((prev) => ({
        ...prev,
        isPlaying: false,
        isLoading: false,
        error: 'Failed to load audio',
      }));
    };

    const handleLoadStart = () => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));
    };

    const handleCanPlay = () => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('durationchange', handleDurationChange);
    audioElement.addEventListener('ended', handleEnded);
    audioElement.addEventListener('error', handleError);
    audioElement.addEventListener('loadstart', handleLoadStart);
    audioElement.addEventListener('canplay', handleCanPlay);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('durationchange', handleDurationChange);
      audioElement.removeEventListener('ended', handleEnded);
      audioElement.removeEventListener('error', handleError);
      audioElement.removeEventListener('loadstart', handleLoadStart);
      audioElement.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioElement]);

  // ============================================================================
  // ACTIONS (useCallback for referential equality)
  // ============================================================================

  const play = useCallback(
    (item?: AudioQueueItem) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (item) {
        // Play new item
        if (item.audioUrl) {
          audio.src = item.audioUrl;
          audio.load();
          audio.play().catch((err) => {
            console.error('Audio play failed:', err);
            setState((prev) => ({
              ...prev,
              error: 'Failed to play audio',
              isPlaying: false,
            }));
          });

          setState((prev) => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
            error: null,
          }));
        }
      } else {
        // Resume current
        audio.play().catch((err) => {
          console.error('Audio play failed:', err);
        });
        setState((prev) => ({
          ...prev,
          isPlaying: true,
          isPaused: false,
        }));
      }
    },
    []
  );

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));
  }, []);

  const resume = useCallback(() => {
    play();
  }, [play]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
    }));
  }, []);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setState((prev) => ({
      ...prev,
      currentTime: time,
    }));
  }, []);

  const skipNext = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      if (nextIndex < prev.queue.length) {
        const nextItem = prev.queue[nextIndex];
        play(nextItem);
        return {
          ...prev,
          currentIndex: nextIndex,
        };
      }
      return prev;
    });
  }, [play]);

  const skipPrevious = useCallback(() => {
    setState((prev) => {
      const prevIndex = prev.currentIndex - 1;
      if (prevIndex >= 0) {
        const prevItem = prev.queue[prevIndex];
        play(prevItem);
        return {
          ...prev,
          currentIndex: prevIndex,
        };
      }
      return prev;
    });
  }, [play]);

  const setVoice = useCallback(
    (voice: VoiceId) => {
      persistPreference(STORAGE_KEYS.VOICE, voice);
      setState((prev) => ({
        ...prev,
        voiceId: voice,
      }));
    },
    [persistPreference]
  );

  const setPlaybackRate = useCallback(
    (rate: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.playbackRate = rate;
      }
      persistPreference(STORAGE_KEYS.PLAYBACK_RATE, rate.toString());
      setState((prev) => ({
        ...prev,
        playbackRate: rate,
      }));
    },
    [persistPreference]
  );

  const setVolume = useCallback(
    (volume: number) => {
      const audio = audioRef.current;
      if (audio) {
        audio.volume = volume;
      }
      persistPreference(STORAGE_KEYS.VOLUME, volume.toString());
      setState((prev) => ({
        ...prev,
        volume,
      }));
    },
    [persistPreference]
  );

  const addToQueue = useCallback((items: AudioQueueItem | AudioQueueItem[]) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setState((prev) => ({
      ...prev,
      queue: [...prev.queue, ...itemsArray],
    }));
  }, []);

  const clearQueue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      queue: [],
      currentIndex: -1,
    }));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      queue: prev.queue.filter((item) => item.id !== id),
    }));
  }, []);

  // Memoized actions object
  const actions: AudioActions = React.useMemo(
    () => ({
      play,
      pause,
      resume,
      stop,
      seek,
      skipNext,
      skipPrevious,
      setVoice,
      setPlaybackRate,
      setVolume,
      addToQueue,
      clearQueue,
      removeFromQueue,
    }),
    [
      play,
      pause,
      resume,
      stop,
      seek,
      skipNext,
      skipPrevious,
      setVoice,
      setPlaybackRate,
      setVolume,
      addToQueue,
      clearQueue,
      removeFromQueue,
    ]
  );

  return (
    <AudioStateContext.Provider value={state}>
      <AudioActionsContext.Provider value={actions}>{children}</AudioActionsContext.Provider>
    </AudioStateContext.Provider>
  );
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access audio state (causes re-renders on state changes)
 * Use this in components that display current time, progress bars, etc.
 */
export const useAudioState = (): AudioState => {
  const context = useContext(AudioStateContext);
  if (context === undefined) {
    throw new Error('useAudioState must be used within AudioProvider');
  }
  return context;
};

/**
 * Hook to access audio actions (does NOT cause re-renders on state changes)
 * Use this in components that only trigger audio (play/pause buttons, etc.)
 */
export const useAudioActions = (): AudioActions => {
  const context = useContext(AudioActionsContext);
  if (context === undefined) {
    throw new Error('useAudioActions must be used within AudioProvider');
  }
  return context;
};

/**
 * Hook to access both state and actions (convenience hook)
 * Use sparingly - prefer useAudioState or useAudioActions for better performance
 */
export const useAudio = (): AudioState & AudioActions => {
  const state = useAudioState();
  const actions = useAudioActions();
  return { ...state, ...actions };
};
