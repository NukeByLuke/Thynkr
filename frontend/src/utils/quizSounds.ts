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

  input.gain.setValueAtTime(0.92, startTime);

  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(260, startTime);
  highpass.Q.setValueAtTime(0.78, startTime);

  highshelf.type = 'highshelf';
  highshelf.frequency.setValueAtTime(1850, startTime);
  highshelf.gain.setValueAtTime(4.2, startTime);

  compressor.threshold.setValueAtTime(-26, startTime);
  compressor.knee.setValueAtTime(13, startTime);
  compressor.ratio.setValueAtTime(2.4, startTime);
  compressor.attack.setValueAtTime(0.004, startTime);
  compressor.release.setValueAtTime(0.24, startTime);

  dry.gain.setValueAtTime(0.97, startTime);
  delay.delayTime.setValueAtTime(0.145, startTime);
  delayFeedback.gain.setValueAtTime(0.09, startTime);
  delayWet.gain.setValueAtTime(0.13, startTime);

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
  const compressor = context.createDynamicsCompressor();

  input.gain.setValueAtTime(0.92, startTime);

  highpass.type = 'highpass';
  highpass.frequency.setValueAtTime(150, startTime);
  highpass.Q.setValueAtTime(0.6, startTime);

  compressor.threshold.setValueAtTime(-23, startTime);
  compressor.knee.setValueAtTime(12, startTime);
  compressor.ratio.setValueAtTime(2.6, startTime);
  compressor.attack.setValueAtTime(0.003, startTime);
  compressor.release.setValueAtTime(0.16, startTime);

  input.connect(highpass);
  highpass.connect(compressor);
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

const playBellPartial = (
  context: AudioContext,
  destination: AudioNode,
  frequency: number,
  startTime: number,
  peakGain: number,
  decay: number,
  detuneCents = 0
): void => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine';
  oscillator.detune.setValueAtTime(detuneCents, startTime);
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(20, frequency * 0.997),
    startTime + decay
  );

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.004);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);

  oscillator.connect(gainNode);
  gainNode.connect(destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + decay + 0.03);
};

const playBellHit = (
  context: AudioContext,
  destination: AudioNode,
  baseFrequency: number,
  startTime: number,
  velocity = 1
): void => {
  // Inharmonic partial blend tuned for a cheerful app-style bell ring.
  playBellPartial(context, destination, baseFrequency, startTime, 0.09 * velocity, 0.88, -1.8);
  playBellPartial(
    context,
    destination,
    baseFrequency * 2.03,
    startTime,
    0.04 * velocity,
    0.72,
    1.4
  );
  playBellPartial(
    context,
    destination,
    baseFrequency * 2.72,
    startTime,
    0.026 * velocity,
    0.61,
    -0.9
  );
  playBellPartial(
    context,
    destination,
    baseFrequency * 3.84,
    startTime,
    0.017 * velocity,
    0.5,
    2.4
  );
  playBellPartial(
    context,
    destination,
    baseFrequency * 4.18,
    startTime,
    0.012 * velocity,
    0.41,
    -1.3
  );

  // Mallet transient for a more convincing bell strike.
  playTone(
    context,
    destination,
    baseFrequency * 7.8,
    startTime,
    0.035,
    0.009 * velocity,
    'triangle',
    baseFrequency * 5.9
  );
};

const playBellDingSound = (context: AudioContext, startTime: number) => {
  const bus = createBellOutputBus(context, startTime);

  // Cheerful "da ding": bright lower bell followed by a higher resolving bell.
  playBellHit(context, bus, 783.99, startTime, 0.88);
  playBellHit(context, bus, 1174.66, startTime + 0.17, 1);
};

const playPopSound = (context: AudioContext, startTime: number) => {
  const bus = createPopOutputBus(context, startTime);
  const noiseSource = context.createBufferSource();
  const bandpass = context.createBiquadFilter();
  const lowpass = context.createBiquadFilter();
  const noiseGain = context.createGain();

  noiseSource.buffer = getNoiseBuffer(context);

  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(860, startTime);
  bandpass.Q.setValueAtTime(1.2, startTime);
  bandpass.frequency.exponentialRampToValueAtTime(540, startTime + 0.09);

  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(5200, startTime);
  lowpass.frequency.exponentialRampToValueAtTime(2200, startTime + 0.09);

  noiseGain.gain.setValueAtTime(0.0001, startTime);
  noiseGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.09);

  noiseSource.connect(bandpass);
  bandpass.connect(lowpass);
  lowpass.connect(noiseGain);
  noiseGain.connect(bus);

  noiseSource.start(startTime);
  noiseSource.stop(startTime + 0.1);

  // Low "air push" to make it feel like a real pop, not just hiss.
  playTone(context, bus, 180, startTime, 0.08, 0.045, 'sine', 72);
  playTone(context, bus, 1280, startTime, 0.028, 0.014, 'triangle', 780);
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