/**
 * Global TTS Player Store
 * Manages text-to-speech player state across the application
 */

import { create } from 'zustand';

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

/**
 * Auto-detect language from text content
 * Returns appropriate language code (e.g., 'es-ES', 'en-US')
 */
function detectLanguage(text: string): string {
  // Simple language detection based on common patterns
  // Spanish indicators
  const spanishPatterns = /[áéíóúñ¿¡]/i;
  if (spanishPatterns.test(text)) {
    return 'es-ES';
  }

  // French indicators
  const frenchPatterns = /[àâäæçéèêëïîôùûü]/i;
  if (frenchPatterns.test(text)) {
    return 'fr-FR';
  }

  // German indicators
  const germanPatterns = /[äöüß]/i;
  if (germanPatterns.test(text)) {
    return 'de-DE';
  }

  // Default to English
  return 'en-US';
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
