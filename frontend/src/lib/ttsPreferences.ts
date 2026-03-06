export type TTSVoice = 'charon' | 'fenrir' | 'puck' | 'enceladus' | 'aoede' | 'kore';

export interface TTSPreferences {
  voice: TTSVoice;
  speed: number;
}

const TTS_PREFERENCES_STORAGE_KEY = 'thynkr:tts-preferences';
const TTS_PREFERENCES_UPDATED_EVENT = 'thynkr:tts-preferences-updated';

const SUPPORTED_VOICES: readonly TTSVoice[] = ['charon', 'fenrir', 'puck', 'enceladus', 'aoede', 'kore'];

export function isTTSVoice(value: unknown): value is TTSVoice {
  return typeof value === 'string' && SUPPORTED_VOICES.includes(value as TTSVoice);
}

function clampSpeed(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  return Math.min(4, Math.max(0.25, value));
}

export function normalizeTTSPreferences(value: unknown): Partial<TTSPreferences> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const input = value as Record<string, unknown>;
  const normalized: Partial<TTSPreferences> = {};

  if (isTTSVoice(input.voice)) {
    normalized.voice = input.voice;
  }

  const speed = clampSpeed(input.speed);
  if (typeof speed === 'number') {
    normalized.speed = speed;
  }

  return normalized;
}

export function readTTSPreferencesFromStorage(): Partial<TTSPreferences> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(TTS_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return normalizeTTSPreferences(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function writeTTSPreferencesToStorage(preferences: Partial<TTSPreferences>) {
  if (typeof window === 'undefined') {
    return;
  }

  const current = readTTSPreferencesFromStorage();
  const next = {
    ...current,
    ...normalizeTTSPreferences(preferences),
  };

  try {
    window.localStorage.setItem(TTS_PREFERENCES_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota/privacy failures.
  }
}

export function emitTTSPreferencesUpdated(preferences: Partial<TTSPreferences>) {
  const normalized = normalizeTTSPreferences(preferences);
  if (!normalized.voice && typeof normalized.speed !== 'number') {
    return;
  }

  writeTTSPreferencesToStorage(normalized);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<Partial<TTSPreferences>>(TTS_PREFERENCES_UPDATED_EVENT, {
      detail: normalized,
    })
  );
}

export function subscribeToTTSPreferences(
  listener: (preferences: Partial<TTSPreferences>) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<Partial<TTSPreferences>>).detail;
    listener(normalizeTTSPreferences(detail));
  };

  window.addEventListener(TTS_PREFERENCES_UPDATED_EVENT, handler);
  return () => {
    window.removeEventListener(TTS_PREFERENCES_UPDATED_EVENT, handler);
  };
}
