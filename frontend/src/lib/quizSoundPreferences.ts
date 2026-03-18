export type QuizCorrectSound =
  | 'ding'
  | 'spark'
  | 'chime'
  | 'arcade'
  | 'pop'
  | 'off';

export interface QuizSoundPreferences {
  correctAnswerSound: QuizCorrectSound;
}

const QUIZ_SOUND_PREFERENCES_STORAGE_KEY = 'thynkr:quiz-sound-preferences';
const QUIZ_SOUND_PREFERENCES_UPDATED_EVENT = 'thynkr:quiz-sound-preferences-updated';

const SUPPORTED_CORRECT_SOUNDS: readonly QuizCorrectSound[] = [
  'ding',
  'spark',
  'chime',
  'arcade',
  'pop',
  'off',
];

export function isQuizCorrectSound(value: unknown): value is QuizCorrectSound {
  return (
    typeof value === 'string' &&
    SUPPORTED_CORRECT_SOUNDS.includes(value as QuizCorrectSound)
  );
}

export function normalizeQuizSoundPreferences(
  value: unknown
): Partial<QuizSoundPreferences> {
  if (!value || typeof value !== 'object') {
    return {};
  }

  const input = value as Record<string, unknown>;
  const normalized: Partial<QuizSoundPreferences> = {};

  if (isQuizCorrectSound(input.correctAnswerSound)) {
    normalized.correctAnswerSound = input.correctAnswerSound;
  }

  return normalized;
}

export function readQuizSoundPreferencesFromStorage(): Partial<QuizSoundPreferences> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(QUIZ_SOUND_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    return normalizeQuizSoundPreferences(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function writeQuizSoundPreferencesToStorage(
  preferences: Partial<QuizSoundPreferences>
) {
  if (typeof window === 'undefined') {
    return;
  }

  const current = readQuizSoundPreferencesFromStorage();
  const next = {
    ...current,
    ...normalizeQuizSoundPreferences(preferences),
  };

  try {
    window.localStorage.setItem(
      QUIZ_SOUND_PREFERENCES_STORAGE_KEY,
      JSON.stringify(next)
    );
  } catch {
    // Ignore storage failures.
  }
}

export function emitQuizSoundPreferencesUpdated(
  preferences: Partial<QuizSoundPreferences>
) {
  const normalized = normalizeQuizSoundPreferences(preferences);
  if (!normalized.correctAnswerSound) {
    return;
  }

  writeQuizSoundPreferencesToStorage(normalized);

  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<Partial<QuizSoundPreferences>>(
      QUIZ_SOUND_PREFERENCES_UPDATED_EVENT,
      {
        detail: normalized,
      }
    )
  );
}

export function subscribeToQuizSoundPreferences(
  listener: (preferences: Partial<QuizSoundPreferences>) => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<Partial<QuizSoundPreferences>>).detail;
    listener(normalizeQuizSoundPreferences(detail));
  };

  window.addEventListener(QUIZ_SOUND_PREFERENCES_UPDATED_EVENT, handler);
  return () => {
    window.removeEventListener(QUIZ_SOUND_PREFERENCES_UPDATED_EVENT, handler);
  };
}