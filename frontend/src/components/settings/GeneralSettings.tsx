import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useTTS, TTS_VOICES, TTS_SPEEDS, TTSVoice } from '@/contexts/TTSContext';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, Monitor, Play, Loader2 } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import Switch from '@/components/Switch';

export default function GeneralSettings() {
  const { user } = useAuth();
  const { themeMode, setThemeMode } = useTheme();
  const { voice, speed, setVoice, setSpeed, play, isLoading } = useTTS();
  const [testPlaying, setTestPlaying] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);
  const [darkModeSync, setDarkModeSync] = useState(themeMode === 'system');

  const handleTestVoice = async () => {
    setTestPlaying(true);
    try {
      await play({
        id: 'tts-test',
        title: 'Voice Test',
        text: 'Hello! This is a preview of your selected voice and speed settings. Adjust them to find what works best for you.',
      });
    } finally {
      setTestPlaying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preferences */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
          Preferences
        </h3>

        <div className="space-y-4">
          <Switch
            checked={darkModeSync}
            onCheckedChange={(checked) => {
              setDarkModeSync(checked);
              setThemeMode(checked ? 'system' : 'light');
            }}
            label="Dark Mode System Sync"
            description="Automatically match your system's theme preference"
          />
          
          <Switch
            checked={autoPlayAudio}
            onCheckedChange={setAutoPlayAudio}
            label="Auto-play Audio"
            description="Automatically play text-to-speech when opening study materials"
          />
        </div>
      </div>

      {/* Theme Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
          Theme Preferences
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setThemeMode('light')}
            className={`p-4 rounded-lg border-2 transition-all ${
              themeMode === 'light'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <Sun
              className={`w-6 h-6 mx-auto mb-2 ${
                themeMode === 'light'
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                themeMode === 'light'
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Light
            </p>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`p-4 rounded-lg border-2 transition-all ${
              themeMode === 'dark'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <Moon
              className={`w-6 h-6 mx-auto mb-2 ${
                themeMode === 'dark'
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                themeMode === 'dark'
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              Dark
            </p>
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`p-4 rounded-lg border-2 transition-all ${
              themeMode === 'system'
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
            }`}
          >
            <Monitor
              className={`w-6 h-6 mx-auto mb-2 ${
                themeMode === 'system'
                  ? 'text-brand-600 dark:text-brand-400'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            />
            <p
              className={`text-sm font-medium ${
                themeMode === 'system'
                  ? 'text-brand-700 dark:text-brand-300'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              System
            </p>
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          {themeMode === 'system'
            ? 'Automatically matches your operating system theme'
            : `Theme is set to ${themeMode} mode regardless of system preference`}
        </p>
      </div>

      {/* Language Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
          Language Preferences
        </h3>

        <LanguageSelector value={user?.preferredLanguage || 'en'} />
      </div>

      {/* TTS Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-6">
          Voice Reader Settings
        </h3>

        <div className="space-y-6">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Voice
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TTS_VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVoice(v.id as TTSVoice)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    voice === v.id
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <p
                    className={`font-medium ${
                      voice === v.id
                        ? 'text-brand-700 dark:text-brand-300'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {v.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {v.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Speed Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              Playback Speed
            </label>
            <div className="flex gap-2">
              {TTS_SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSpeed(s.value)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                    speed === s.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Voice Button */}
          <div className="pt-2">
            <button
              onClick={handleTestVoice}
              disabled={isLoading || testPlaying}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg hover:from-brand-700 hover:to-accent-700 disabled:opacity-50 transition-all"
            >
              {isLoading || testPlaying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Test Voice
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Hear a sample with your current voice and speed settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
