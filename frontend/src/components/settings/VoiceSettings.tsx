import { useState } from 'react';
import { Volume2, Play } from 'lucide-react';
import { useOpenAITTS } from '@/hooks/useOpenAITTS';

const VOICES = [
  { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
  { id: 'echo', name: 'Echo', description: 'Warm, conversational voice' },
  { id: 'fable', name: 'Fable', description: 'Expressive, narrative voice' },
  { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
  { id: 'nova', name: 'Nova', description: 'Friendly, energetic voice' },
  { id: 'shimmer', name: 'Shimmer', description: 'Clear, pleasant voice' },
] as const;

const SPEEDS = [
  { value: 0.75, label: '0.75x' },
  { value: 1.0, label: '1x' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
] as const;

type Voice = typeof VOICES[number]['id'];

export default function VoiceSettings() {
  const [selectedVoice, setSelectedVoice] = useState<Voice>('alloy');
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const { play, isLoading, isPlaying } = useOpenAITTS();

  const handleTestVoice = async () => {
    await play('Hello, this is your study partner.', selectedVoice);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Volume2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          Voice Reader Settings
        </h4>
      </div>

      {/* Voice Selection Grid */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Select Voice
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            return (
              <button
                key={voice.id}
                onClick={() => setSelectedVoice(voice.id)}
                className={`
                  p-4 rounded-lg border-2 transition-all text-left
                  ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500'
                      : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700/50'
                  }
                `}
              >
                <div className="font-semibold text-slate-900 dark:text-white mb-1">
                  {voice.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {voice.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Playback Speed
        </label>
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1">
          {SPEEDS.map((speed) => {
            const isSelected = selectedSpeed === speed.value;
            return (
              <button
                key={speed.value}
                onClick={() => setSelectedSpeed(speed.value)}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-all
                  ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                  }
                `}
              >
                {speed.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Button */}
      <div>
        <button
          onClick={handleTestVoice}
          disabled={isLoading || isPlaying}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg hover:from-brand-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <Play className="w-4 h-4" />
          {isLoading ? 'Loading...' : isPlaying ? 'Playing...' : 'Test Voice'}
        </button>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Preview your selected voice and speed settings
        </p>
      </div>
    </div>
  );
}
