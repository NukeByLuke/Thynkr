import {
  readQuizSoundPreferencesFromStorage,
  type QuizCorrectSound,
} from '@/lib/quizSoundPreferences';

let sharedAudioContext: AudioContext | null = null;

const FILE_BACKED_SOUND_URLS = {
  wave: '/sounds/wave.mp3',
  classicding: '/sounds/classicding.mp3',
} as const;

type FileBackedCorrectSound = keyof typeof FILE_BACKED_SOUND_URLS;

const cachedFileSoundBuffers: Partial<Record<FileBackedCorrectSound, AudioBuffer>> = {};

const DEFAULT_CORRECT_SOUND: QuizCorrectSound = 'spark';

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type ExtendedAudioContextState = AudioContextState | 'interrupted';

const normalizeLegacyCorrectSound = (
  sound: QuizCorrectSound
): QuizCorrectSound => {
  if (sound === 'ding') {
    return 'wave';
  }

  if (sound === 'pop') {
    return 'classicding';
  }

  return sound;
};

const isFileBackedCorrectSound = (
  sound: QuizCorrectSound
): sound is FileBackedCorrectSound => {
  return sound === 'wave' || sound === 'classicding';
};

const resetSharedAudioContext = (): void => {
  sharedAudioContext = null;
};

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  const AudioContextCtor =
    window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextCtor) return null;

  if (sharedAudioContext && sharedAudioContext.state === 'closed') {
    resetSharedAudioContext();
  }

  if (!sharedAudioContext) {
    sharedAudioContext = new AudioContextCtor();
  }

  return sharedAudioContext;
};

const resumeContextIfNeeded = async (
  context: AudioContext
): Promise<AudioContext | null> => {
  const state = context.state as ExtendedAudioContextState;

  if (state === 'running') {
    return context;
  }

  if (state === 'closed') {
    return null;
  }

  try {
    await context.resume();
  } catch {
    return null;
  }

  return context.state === 'closed' ? null : context;
};

const playTone = (
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  startTime: number,
  duration: number,
  peakGain: number,
  wave: OscillatorType = 'triangle',
  glideToFrequency?: number
): void => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  if (glideToFrequency) {
    oscillator.frequency.exponentialRampToValueAtTime(
      glideToFrequency,
      startTime + duration
    );
  }

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
};

const createPolishedOutputBus = (context: AudioContext, startTime: number): GainNode => {
  const input = context.createGain();
  const compressor = context.createDynamicsCompressor();
  const makeup = context.createGain();
  const delay = context.createDelay();
  const delayFeedback = context.createGain();
  const delayWet = context.createGain();
  const dry = context.createGain();

  input.gain.setValueAtTime(2.6, startTime);
  compressor.threshold.setValueAtTime(-18, startTime);
  compressor.knee.setValueAtTime(16, startTime);
  compressor.ratio.setValueAtTime(2.2, startTime);
  compressor.attack.setValueAtTime(0.003, startTime);
  compressor.release.setValueAtTime(0.18, startTime);

  makeup.gain.setValueAtTime(2.2, startTime);

  dry.gain.setValueAtTime(1.04, startTime);
  delay.delayTime.setValueAtTime(0.11, startTime);
  delayFeedback.gain.setValueAtTime(0.14, startTime);
  delayWet.gain.setValueAtTime(0.2, startTime);

  input.connect(dry);
  dry.connect(compressor);

  input.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(compressor);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);

  compressor.connect(makeup);
  makeup.connect(context.destination);

  return input;
};

const playAudioBuffer = (
  context: AudioContext,
  destination: AudioNode,
  buffer: AudioBuffer,
  startTime: number,
  peakGain = 1
): void => {
  const source = context.createBufferSource();
  const gainNode = context.createGain();

  source.buffer = buffer;

  gainNode.gain.setValueAtTime(Math.max(0.0001, peakGain), startTime);

  source.connect(gainNode);
  gainNode.connect(destination);

  source.start(startTime);
};

const loadFileBackedSoundBuffer = async (
  context: AudioContext,
  sound: FileBackedCorrectSound
): Promise<AudioBuffer | null> => {
  const cached = cachedFileSoundBuffers[sound];
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(FILE_BACKED_SOUND_URLS[sound], {
      cache: 'force-cache',
    });

    if (!response.ok) {
      return null;
    }

    const encodedBuffer = await response.arrayBuffer();
    const decodedBuffer = await context.decodeAudioData(encodedBuffer.slice(0));
    cachedFileSoundBuffers[sound] = decodedBuffer;
    return decodedBuffer;
  } catch {
    return null;
  }
};

const playFileBackedSound = async (
  context: AudioContext,
  sound: FileBackedCorrectSound,
  startTime: number
): Promise<boolean> => {
  const audioBuffer = await loadFileBackedSoundBuffer(context, sound);
  if (!audioBuffer) {
    return false;
  }

  const gain = sound === 'wave' ? 0.98 : 0.95;
  playAudioBuffer(context, context.destination, audioBuffer, startTime, gain);
  return true;
};

const playSparkSound = (context: AudioContext, startTime: number) => {
  const bus = createPolishedOutputBus(context, startTime);

  playTone(context, bus, 523.25, startTime, 0.14, 0.095, 'triangle', 545);
  playTone(context, bus, 659.25, startTime + 0.09, 0.16, 0.09, 'triangle', 686);
  playTone(context, bus, 783.99, startTime + 0.18, 0.19, 0.085, 'triangle', 812);
  playTone(context, bus, 1046.5, startTime + 0.29, 0.24, 0.082, 'sine');
  playTone(context, bus, 1318.51, startTime + 0.39, 0.16, 0.05, 'sine');
  playTone(context, bus, 261.63, startTime, 0.2, 0.032, 'sine', 294);
};

const playWarmChimeSound = (context: AudioContext, startTime: number) => {
  const bus = createPolishedOutputBus(context, startTime);

  playTone(context, bus, 392, startTime, 0.16, 0.052, 'sine', 415);
  playTone(context, bus, 659.25, startTime + 0.08, 0.2, 0.082, 'triangle');
  playTone(context, bus, 830.61, startTime + 0.2, 0.25, 0.072, 'triangle', 880);
  playTone(context, bus, 987.77, startTime + 0.32, 0.26, 0.06, 'sine');
};

const playArcadeSound = (context: AudioContext, startTime: number) => {
  const bus = createPolishedOutputBus(context, startTime);

  playTone(context, bus, 622.25, startTime, 0.08, 0.06, 'square');
  playTone(context, bus, 783.99, startTime + 0.08, 0.08, 0.06, 'square');
  playTone(context, bus, 1046.5, startTime + 0.17, 0.12, 0.068, 'square');
  playTone(context, bus, 1318.51, startTime + 0.29, 0.18, 0.055, 'triangle', 1396.91);
};

const playFallbackSound = (context: AudioContext, startTime: number): void => {
  playTone(context, context.destination, 659.25, startTime, 0.12, 0.07, 'triangle', 698.46);
  playTone(context, context.destination, 987.77, startTime + 0.11, 0.16, 0.065, 'triangle', 1046.5);
};

const playSelectedSound = async (
  context: AudioContext,
  selectedSound: QuizCorrectSound
): Promise<boolean> => {
  const startTime = context.currentTime + 0.02;
  const normalizedSound = normalizeLegacyCorrectSound(selectedSound);

  try {
    if (isFileBackedCorrectSound(normalizedSound)) {
      return playFileBackedSound(context, normalizedSound, startTime);
    }

    if (normalizedSound === 'spark') {
      playSparkSound(context, startTime);
      return true;
    }

    if (normalizedSound === 'chime') {
      playWarmChimeSound(context, startTime);
      return true;
    }

    if (normalizedSound === 'arcade') {
      playArcadeSound(context, startTime);
      return true;
    }

    return false;
  } catch {
    try {
      playFallbackSound(context, startTime);
      return true;
    } catch {
      return false;
    }
  }
};

const resolveCorrectSound = (override?: QuizCorrectSound): QuizCorrectSound => {
  if (override) {
    return normalizeLegacyCorrectSound(override);
  }

  const stored = readQuizSoundPreferencesFromStorage();
  return normalizeLegacyCorrectSound(
    stored.correctAnswerSound || DEFAULT_CORRECT_SOUND
  );
};

export const playCorrectAnswerSound = (override?: QuizCorrectSound): void => {
  const selectedSound = resolveCorrectSound(override);
  if (selectedSound === 'off') {
    return;
  }

  void (async () => {
    let context = getAudioContext();
    if (!context) {
      return;
    }

    context = await resumeContextIfNeeded(context);

    // Some browsers can return a non-usable context after tab lifecycle events.
    if (!context) {
      resetSharedAudioContext();
      const freshContext = getAudioContext();
      if (!freshContext) {
        return;
      }

      context = await resumeContextIfNeeded(freshContext);
      if (!context) {
        return;
      }
    }

    if (await playSelectedSound(context, selectedSound)) {
      return;
    }

    // Retry once with a brand-new context before giving up.
    resetSharedAudioContext();
    const retryContext = getAudioContext();
    if (!retryContext) {
      return;
    }

    const resumedRetryContext = await resumeContextIfNeeded(retryContext);
    if (!resumedRetryContext) {
      return;
    }

    await playSelectedSound(resumedRetryContext, selectedSound);
  })();
};

export const playCorrectAnswerDing = (): void => {
  playCorrectAnswerSound();
};