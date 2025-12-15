/**
 * Global TTS Player Store
 * Manages text-to-speech player state across the application
 * Optimized with selectors to prevent unnecessary re-renders
 */

import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

interface PlayerState {
  // State
  isPlaying: boolean;
  text: string;
  language: string;
  speed: number;
  isMinimized: boolean;

  // Actions
  play: (text: string, language?: string) => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (rate: number) => void;
  toggleMinimize: () => void;
}

// Memoize language detection to avoid re-computing
const languageCache = new Map<string, string>();

/**
 * Auto-detect language from text content
 * Returns appropriate language code (e.g., 'es-ES', 'en-US')
 */
function detectLanguage(text: string): string {
  // Check cache first
  const cached = languageCache.get(text);
  if (cached) return cached;

  let language = 'en-US'; // Default

  // Simple language detection based on common patterns
  // Spanish indicators
  const spanishPatterns = /[áéíóúñ¿¡]/i;
  if (spanishPatterns.test(text)) {
    language = 'es-ES';
  }

  // French indicators
  else if (/[àâäæçéèêëïîôùûü]/i.test(text)) {
    language = 'fr-FR';
  }

  // German indicators
  else if (/[äöüß]/i.test(text)) {
    language = 'de-DE';
  }

  // Cache the result (limit cache size to 100 entries)
  if (languageCache.size > 100) {
    const firstKey = languageCache.keys().next().value;
    languageCache.delete(firstKey);
  }
  languageCache.set(text, language);

  return language || 'en';
}

export const usePlayerStore = create<PlayerState>((set) => ({
  // Initial State
  isPlaying: false,
  text: '',
  language: 'en-US',
  speed: 1.0,
  isMinimized: false,

  // Actions
  play: (text: string, language?: string) => {
    const detectedLanguage = language || detectLanguage(text);
    set({
      text,
      language: detectedLanguage,
      isPlaying: true,
    });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  stop: () => {
    set({
      isPlaying: false,
      text: '',
      language: 'en-US',
    });
  },

  setSpeed: (rate: number) => {
    // Clamp speed between 0.5 and 2.0
    const clampedRate = Math.max(0.5, Math.min(2.0, rate));
    set({ speed: clampedRate });
  },

  toggleMinimize: () => {
    set((state) => ({ isMinimized: !state.isMinimized }));
  },
}));

// Export selector hooks for optimized subscriptions
export const usePlayerText = () => usePlayerStore((state) => state.text);
export const usePlayerSpeed = () => usePlayerStore((state) => state.speed);
export const usePlayerIsPlaying = () => usePlayerStore((state) => state.isPlaying);
export const usePlayerActions = () => usePlayerStore(
  (state) => ({
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    setSpeed: state.setSpeed,
  }),
  shallow
);
