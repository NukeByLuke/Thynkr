import {
  readQuizSoundPreferencesFromStorage,
  type QuizCorrectSound,
} from '@/lib/quizSoundPreferences';

let sharedAudioContext: AudioContext | null = null;
let cachedNoiseBuffer: AudioBuffer | null = null;
let cachedNoiseBufferSampleRate: number | null = null;

const DEFAULT_CORRECT_SOUND: QuizCorrectSound = 'spark';

type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type ExtendedAudioContextState = AudioContextState | 'interrupted';

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
  const delay = context.createDelay();
  const delayFeedback = context.createGain();
  const delayWet = context.createGain();
  const dry = context.createGain();

  input.gain.setValueAtTime(0.9, startTime);
  compressor.threshold.setValueAtTime(-24, startTime);
  compressor.knee.setValueAtTime(18, startTime);
  compressor.ratio.setValueAtTime(3, startTime);
  compressor.attack.setValueAtTime(0.003, startTime);
  compressor.release.setValueAtTime(0.2, startTime);

  dry.gain.setValueAtTime(0.95, startTime);
  delay.delayTime.setValueAtTime(0.11, startTime);
  delayFeedback.gain.setValueAtTime(0.16, startTime);
  delayWet.gain.setValueAtTime(0.24, startTime);

  input.connect(dry);
  dry.connect(compressor);

  input.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(compressor);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);

  compressor.connect(context.destination);

  return input;
};

const createBellOutputBus = (context: AudioContext, startTime: number): GainNode => {
  const input = context.createGain();
  const highpass = context.createBiquadFilter();
  const highshelf = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const delay = context.createDelay();
  const delayFeedback = context.createGain();
  const delayWet = context.createGain();
  const dry = context.createGain();

  input.gain.setValueAtTime(1.0, startTime);

  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(320, startTime);
  highpass.Q.setValueAtTime(0.72, startTime);

  highshelf.type = 'highshelf';
  highshelf.frequency.setValueAtTime(2200, startTime);
  highshelf.gain.setValueAtTime(5.6, startTime);

  compressor.threshold.setValueAtTime(-24, startTime);
  compressor.knee.setValueAtTime(12, startTime);
  compressor.ratio.setValueAtTime(2.5, startTime);
  compressor.attack.setValueAtTime(0.003, startTime);
  compressor.release.setValueAtTime(0.21, startTime);

  dry.gain.setValueAtTime(0.98, startTime);
  delay.delayTime.setValueAtTime(0.125, startTime);
  delayFeedback.gain.setValueAtTime(0.08, startTime);
  delayWet.gain.setValueAtTime(0.1, startTime);

  input.connect(highpass);
  highpass.connect(highshelf);

  highshelf.connect(dry);
  dry.connect(compressor);

  highshelf.connect(delay);
  delay.connect(delayWet);
  delayWet.connect(compressor);
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);

  compressor.connect(context.destination);

  return input;
};

const createPopOutputBus = (context: AudioContext, startTime: number): GainNode => {
  const input = context.createGain();
  const highpass = context.createBiquadFilter();
  const lowpass = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();

  input.gain.setValueAtTime(1.05, startTime);

  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(90, startTime);
  highpass.Q.setValueAtTime(0.72, startTime);

  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(7800, startTime);
  lowpass.Q.setValueAtTime(0.45, startTime);

  compressor.threshold.setValueAtTime(-21, startTime);
  compressor.knee.setValueAtTime(11, startTime);
  compressor.ratio.setValueAtTime(2.8, startTime);
  compressor.attack.setValueAtTime(0.002, startTime);
  compressor.release.setValueAtTime(0.14, startTime);

  input.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(compressor);
  compressor.connect(context.destination);

  return input;
};

const getNoiseBuffer = (context: AudioContext): AudioBuffer => {
  if (
    cachedNoiseBuffer &&
    cachedNoiseBufferSampleRate === context.sampleRate
  ) {
    return cachedNoiseBuffer;
  }

  const bufferLength = Math.max(1, Math.round(context.sampleRate * 0.2));
  const buffer = context.createBuffer(1, bufferLength, context.sampleRate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < bufferLength; i += 1) {
    channel[i] = Math.random() * 2 - 1;
  }

  cachedNoiseBuffer = buffer;
  cachedNoiseBufferSampleRate = context.sampleRate;
  return buffer;
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

const playDingStrike = (
  context: AudioContext,
  destination: AudioNode,
  baseFrequency: number,
  startTime: number,
  velocity = 1
): void => {
  // Clean high-pitched bell partial stack for a cheerful app-like ding.
  playTone(
    context,
    destination,
    baseFrequency,
    startTime,
    0.34,
    0.1 * velocity,
    'sine',
    baseFrequency * 0.998
  );
  playTone(
    context,
    destination,
    baseFrequency * 2.02,
    startTime + 0.002,
    0.24,
    0.046 * velocity,
    'sine'
  );
  playTone(
    context,
    destination,
    baseFrequency * 3.07,
    startTime + 0.004,
    0.19,
    0.026 * velocity,
    'sine'
  );
  playTone(
    context,
    destination,
    baseFrequency * 4.33,
    startTime + 0.005,
    0.14,
    0.017 * velocity,
    'sine'
  );

  // Tiny mallet click for definition.
  playTone(
    context,
    destination,
    baseFrequency * 7.6,
    startTime,
    0.02,
    0.012 * velocity,
    'triangle',
    baseFrequency * 5.4
  );
};

const playBellDingSound = (context: AudioContext, startTime: number) => {
  const bus = createBellOutputBus(context, startTime);

  // High-pitched cheerful "ding ding".
  playDingStrike(context, bus, 1318.51, startTime, 0.95);
  playDingStrike(context, bus, 1661.22, startTime + 0.145, 1);
};

const playPopSound = (context: AudioContext, startTime: number) => {
  const bus = createPopOutputBus(context, startTime);
  const noiseSource = context.createBufferSource();
  const bandpass = context.createBiquadFilter();
  const noiseGain = context.createGain();

  noiseSource.buffer = getNoiseBuffer(context);

  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(3200, startTime);
  bandpass.Q.setValueAtTime(2.3, startTime);
  bandpass.frequency.exponentialRampToValueAtTime(1400, startTime + 0.022);

  noiseGain.gain.setValueAtTime(0.0001, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.0016);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.024);

  noiseSource.connect(bandpass);
  bandpass.connect(noiseGain);
  noiseGain.connect(bus);

  noiseSource.start(startTime);
  noiseSource.stop(startTime + 0.03);

  // Water-droplet body: bright attack with quick resonant downward bloom.
  playTone(context, bus, 1640, startTime + 0.001, 0.11, 0.12, 'sine', 500);
  playTone(context, bus, 1120, startTime + 0.003, 0.13, 0.072, 'sine', 340);
  playTone(context, bus, 420, startTime + 0.028, 0.1, 0.034, 'triangle', 185);
};

const playFallbackSound = (context: AudioContext, startTime: number): void => {
  playTone(context, context.destination, 659.25, startTime, 0.12, 0.07, 'triangle', 698.46);
  playTone(context, context.destination, 987.77, startTime + 0.11, 0.16, 0.065, 'triangle', 1046.5);
};

const playSelectedSound = (
  context: AudioContext,
  selectedSound: QuizCorrectSound
): boolean => {
  const startTime = context.currentTime + 0.02;

  try {
    if (selectedSound === 'ding') {
      playBellDingSound(context, startTime);
      return true;
    }

    if (selectedSound === 'spark') {
      playSparkSound(context, startTime);
      return true;
    }

    if (selectedSound === 'chime') {
      playWarmChimeSound(context, startTime);
      return true;
    }

    if (selectedSound === 'pop') {
      playPopSound(context, startTime);
      return true;
    }

    playArcadeSound(context, startTime);
    return true;
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
    return override;
  }

  const stored = readQuizSoundPreferencesFromStorage();
  return stored.correctAnswerSound || DEFAULT_CORRECT_SOUND;
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

    if (playSelectedSound(context, selectedSound)) {
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

    void playSelectedSound(resumedRetryContext, selectedSound);
  })();
};

export const playCorrectAnswerDing = (): void => {
  playCorrectAnswerSound();
};