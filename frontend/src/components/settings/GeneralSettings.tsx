import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, Sunset, Monitor, Volume2, Play } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useTTSVoices } from '@/hooks/useTTS';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  emitTTSPreferencesUpdated,
  isTTSVoice,
  normalizeTTSPreferences,
  readTTSPreferencesFromStorage,
  subscribeToTTSPreferences,
  type TTSVoice,
} from '@/lib/ttsPreferences';
import {
  emitQuizSoundPreferencesUpdated,
  isQuizCorrectSound,
  readQuizSoundPreferencesFromStorage,
  subscribeToQuizSoundPreferences,
  type QuizCorrectSound,
} from '@/lib/quizSoundPreferences';
import { playCorrectAnswerSound } from '@/utils/quizSounds';

const QUIZ_CORRECT_SOUND_OPTIONS: Array<{
  value: QuizCorrectSound;
  label: string;
  description: string;
}> = [
  {
    value: 'wave',
    label: 'Wave',
    description: 'Imported wave-style success sound.',
  },
  {
    value: 'classicding',
    label: 'Classic Ding',
    description: 'Imported classic ding success sound.',
  },
  {
    value: 'spark',
    label: 'Spark',
    description: 'Bright and uplifting, like a polished app reward.',
  },
  {
    value: 'chime',
    label: 'Chime',
    description: 'Warmer and calmer with a gentle success tone.',
  },
  {
    value: 'arcade',
    label: 'Arcade',
    description: 'Punchy and game-like for high-energy sessions.',
  },
  {
    value: 'off',
    label: 'Off',
    description: 'No sound on correct answers.',
  },
];

const normalizeLegacyQuizSound = (sound: QuizCorrectSound): QuizCorrectSound => {
  if (sound === 'ding') {
    return 'wave';
  }

  if (sound === 'pop') {
    return 'classicding';
  }

  return sound;
};

export default function GeneralSettings() {
  const { themeMode, setThemeMode } = useTheme();
  const { user, refetchUser } = useAuth();
  const { voices } = useTTSVoices();
  
  // Default to English if no language set
  const currentLanguage = user?.preferredLanguage || 'en';

  // TTS preferences state
  const [ttsVoice, setTtsVoice] = useState<TTSVoice>('charon');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [isSavingTTS, setIsSavingTTS] = useState(false);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);
  const [correctAnswerSound, setCorrectAnswerSound] = useState<QuizCorrectSound>('spark');
  const [isSavingQuizSound, setIsSavingQuizSound] = useState(false);

  // Load TTS preferences
  useEffect(() => {
    const cachedPreferences = readTTSPreferencesFromStorage();
    const cachedQuizSoundPreferences = readQuizSoundPreferencesFromStorage();

    if (cachedPreferences.voice) {
      setTtsVoice(cachedPreferences.voice);
    }
    if (typeof cachedPreferences.speed === 'number') {
      setTtsSpeed(cachedPreferences.speed);
    }
    if (cachedQuizSoundPreferences.correctAnswerSound) {
      setCorrectAnswerSound(
        normalizeLegacyQuizSound(cachedQuizSoundPreferences.correctAnswerSound)
      );
    }

    const loadPreferences = async () => {
      try {
        const response = await api.get('/tts/preferences');
        const normalized = normalizeTTSPreferences(response.data);

        if (normalized.voice) {
          setTtsVoice(normalized.voice);
        }
        if (typeof normalized.speed === 'number') {
          setTtsSpeed(normalized.speed);
        }

        emitTTSPreferencesUpdated(normalized);
      } catch (error) {
        console.error('Failed to load TTS preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    return subscribeToTTSPreferences((preferences) => {
      if (preferences.voice) {
        setTtsVoice(preferences.voice);
      }
      if (typeof preferences.speed === 'number') {
        setTtsSpeed(preferences.speed);
      }
    });
  }, []);

  useEffect(() => {
    return subscribeToQuizSoundPreferences((preferences) => {
      if (preferences.correctAnswerSound) {
        setCorrectAnswerSound(
          normalizeLegacyQuizSound(preferences.correctAnswerSound)
        );
      }
    });
  }, []);

  useEffect(() => {
    const accountSound = user?.quizCorrectSound;
    if (!isQuizCorrectSound(accountSound)) {
      return;
    }

    const normalizedSound = normalizeLegacyQuizSound(accountSound);
    setCorrectAnswerSound(normalizedSound);
    emitQuizSoundPreferencesUpdated({ correctAnswerSound: normalizedSound });
  }, [user?.quizCorrectSound]);

  // Save TTS preferences
  const saveTTSPreferences = async (voice: TTSVoice, speed: number) => {
    setIsSavingTTS(true);
    try {
      await api.patch('/tts/preferences', { voice, speed });
      emitTTSPreferencesUpdated({ voice, speed });
      toast.success('Audio preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error('Error saving TTS preferences:', error);
    } finally {
      setIsSavingTTS(false);
    }
  };

  const handleVoiceChange = (voice: string) => {
    if (!isTTSVoice(voice)) {
      return;
    }

    setTtsVoice(voice);
    saveTTSPreferences(voice, ttsSpeed);
  };

  const handleSpeedChange = (speed: number) => {
    setTtsSpeed(speed);
    saveTTSPreferences(ttsVoice, speed);
  };

  const playVoicePreview = async (voice: string) => {
    if (!isTTSVoice(voice)) {
      return;
    }

    // Stop any existing preview
    if (audioPreview) {
      audioPreview.pause();
      audioPreview.currentTime = 0;
    }

    try {
      // Use the same negotiate+stream approach as AudioPlayer
      const negotiateResponse = await api.post('/tts/negotiate', {
        text: 'Hello! This is how I sound. I can help you study by reading summaries and quiz questions aloud.',
        voice,
        speed: ttsSpeed,
      });

      if (!negotiateResponse.data.url) {
        throw new Error('No stream URL returned');
      }

      // Construct full audio URL
      let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      if (baseURL.startsWith('/')) {
        baseURL = `${window.location.origin}${baseURL}`;
      }
      baseURL = baseURL.replace(/\/$/, '');
      const audioUrl = `${baseURL}${negotiateResponse.data.url}`.replace('/api/api/', '/api/');

      const audio = new Audio(audioUrl);
      setAudioPreview(audio);
      
      audio.onended = () => {
        setAudioPreview(null);
      };

      await audio.play();
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Upgrade to Pro for TTS features!');
      } else {
        toast.error('Failed to play preview');
      }
    }
  };

  const handleCorrectAnswerSoundChange = async (sound: QuizCorrectSound) => {
    const previousSound = correctAnswerSound;

    setCorrectAnswerSound(sound);
    emitQuizSoundPreferencesUpdated({ correctAnswerSound: sound });

    setIsSavingQuizSound(true);
    try {
      await api.patch('/auth/profile', { quizCorrectSound: sound });
      await refetchUser();
    } catch (error) {
      setCorrectAnswerSound(previousSound);
      emitQuizSoundPreferencesUpdated({ correctAnswerSound: previousSound });
      toast.error('Failed to save correct-answer sound preference');
    } finally {
      setIsSavingQuizSound(false);
    }
  };

  const previewCorrectAnswerSound = (sound: QuizCorrectSound) => {
    if (sound === 'off') {
      return;
    }

    playCorrectAnswerSound(sound);
  };

  return (
    <div className="space-y-7 sm:space-y-8">
      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">Appearance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Customize how Thynkr looks on your device.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { mode: 'sunrise', Icon: Sun, label: 'Sunrise (Light)' },
            { mode: 'sunset', Icon: Sunset, label: 'Sunset (Dark)' },
            { mode: 'midnight', Icon: Moon, label: 'Midnight (Black)' },
            { mode: 'system', Icon: Monitor, label: 'System' },
          ] as const).map(({ mode, Icon, label }) => (
            <button
              key={mode}
              onClick={() => setThemeMode(mode)}
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                themeMode === mode
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
              }`}
            >
              <Icon className={`w-5 h-5 ${themeMode === mode && mode !== 'system' ? 'fill-current' : ''}`} />
              <span className="font-semibold text-xs">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <hr className="border-slate-200 dark:border-white/10" />

      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">Language</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Select your preferred language for the interface and study materials.
        </p>
        
        <div className="max-w-md">
            <LanguageSelector value={currentLanguage} onUpdate={refetchUser} />
        </div>
      </section>

      <hr className="border-slate-200 dark:border-white/10" />

      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">Voice & Audio</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Customize text-to-speech voice and playback speed for summaries and quizzes.
        </p>

        <div className="space-y-6 max-w-2xl">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              <Volume2 className="inline w-4 h-4 mr-1" />
              Voice
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {voices.map((voice) => {
                const isSelected = ttsVoice === voice.id;

                return (
                  <div
                    key={voice.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border-2 p-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleVoiceChange(voice.id)}
                      disabled={isSavingTTS}
                      className="flex-1 rounded-md px-1.5 py-1.5 text-left disabled:opacity-60"
                    >
                      <span className="block truncate font-medium text-sm capitalize">{voice.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => playVoicePreview(voice.id)}
                      disabled={isSavingTTS}
                      className={`rounded-md p-2 transition-colors disabled:opacity-60 ${
                        isSelected
                          ? 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={`Preview ${voice.name} - ${voice.description}`}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Playback Speed: {ttsSpeed.toFixed(2)}x
            </label>
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="w-10 sm:w-12 text-xs sm:text-sm text-slate-500 dark:text-slate-400">0.25x</span>
              <input
                type="range"
                min="0.25"
                max="4.0"
                step="0.25"
                value={ttsSpeed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                disabled={isSavingTTS}
                className="flex-1 h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <span className="w-10 sm:w-12 text-right text-xs sm:text-sm text-slate-500 dark:text-slate-400">4.0x</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Adjust how fast the text is read aloud.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Correct Answer Sound
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Pick the reward sound that plays when you get quiz answers right.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUIZ_CORRECT_SOUND_OPTIONS.map((option) => {
                const isSelected = correctAnswerSound === option.value;

                return (
                  <div
                    key={option.value}
                    className={`flex items-start justify-between gap-2 rounded-lg border-2 p-3 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCorrectAnswerSoundChange(option.value)}
                      disabled={isSavingQuizSound}
                      className="flex-1 text-left"
                    >
                      <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                        {option.description}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => previewCorrectAnswerSound(option.value)}
                      disabled={option.value === 'off' || isSavingQuizSound}
                      className={`rounded-md p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected
                          ? 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={option.value === 'off' ? 'Preview unavailable for Off' : `Preview ${option.label}`}
                    >
                      <Play className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                    </button>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Saved to your account and synced across devices.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
