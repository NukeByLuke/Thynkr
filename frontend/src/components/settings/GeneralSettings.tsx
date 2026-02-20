import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, Monitor, Volume2, Play } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { useTTSVoices } from '@/hooks/useTTS';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function GeneralSettings() {
  const { themeMode, setThemeMode } = useTheme();
  const { user, refetchUser } = useAuth();
  const { voices } = useTTSVoices();
  
  // Default to English if no language set
  const currentLanguage = user?.preferredLanguage || 'en';

  // TTS preferences state
  const [ttsVoice, setTtsVoice] = useState<string>('charon');
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [isSavingTTS, setIsSavingTTS] = useState(false);
  const [audioPreview, setAudioPreview] = useState<HTMLAudioElement | null>(null);

  // Load TTS preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await api.get('/tts/preferences');
        setTtsVoice(response.data.voice || 'charon');
        setTtsSpeed(response.data.speed || 1.0);
      } catch (error) {
        console.error('Failed to load TTS preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Save TTS preferences
  const saveTTSPreferences = async (voice: string, speed: number) => {
    setIsSavingTTS(true);
    try {
      await api.patch('/tts/preferences', { voice, speed });
      toast.success('Audio preferences saved!');
    } catch (error) {
      toast.error('Failed to save preferences');
      console.error('Error saving TTS preferences:', error);
    } finally {
      setIsSavingTTS(false);
    }
  };

  const handleVoiceChange = (voice: string) => {
    setTtsVoice(voice);
    saveTTSPreferences(voice, ttsSpeed);
  };

  const handleSpeedChange = (speed: number) => {
    setTtsSpeed(speed);
    saveTTSPreferences(ttsVoice, speed);
  };

  const playVoicePreview = async (voice: string) => {
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

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-0.5">Appearance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Customize how Thynkr looks on your device.
        </p>

        <div className="grid grid-cols-3 gap-3">
          {([
            { mode: 'light', Icon: Sun, label: 'Light' },
            { mode: 'dark', Icon: Moon, label: 'Dark' },
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
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Language</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {voices.map((voice) => (
                <button
                  key={voice.id}
                  onClick={() => handleVoiceChange(voice.id)}
                  disabled={isSavingTTS}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    ttsVoice === voice.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 shadow-sm'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span className="font-medium text-sm capitalize">{voice.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicePreview(voice.id);
                    }}
                    className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-md transition-colors"
                    title={`Preview ${voice.name} - ${voice.description}`}
                  >
                    <Play className="w-4 h-4" />
                  </button>
                </button>
              ))}
            </div>
          </div>

          {/* Speed Control */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Playback Speed: {ttsSpeed.toFixed(2)}x
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400 w-12">0.25x</span>
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
              <span className="text-sm text-slate-500 dark:text-slate-400 w-12 text-right">4.0x</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Adjust how fast the text is read aloud.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
