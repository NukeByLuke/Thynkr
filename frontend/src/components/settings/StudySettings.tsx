import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Clock, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function StudySettings() {
  const { user, refetchUser } = useAuth();
  
  // State for timer settings
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25);
  const [isDirty, setIsDirty] = useState(false);

  // Initialize from user data when available
  useEffect(() => {
    if (user) {
      // TODO: Load from user.timerEnabled and user.timerDuration when fields are added to schema
      setTimerEnabled(false);
      setTimerDuration(25);
    }
  }, [user]);

  // Track changes
  useEffect(() => {
    // TODO: Compare with actual user values once schema fields exist
    const hasChanges = timerEnabled !== false || timerDuration !== 25;
    setIsDirty(hasChanges);
  }, [timerEnabled, timerDuration]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: { timerEnabled: boolean; timerDuration: number }) => {
      // TODO: Update endpoint to accept timerEnabled and timerDuration once backend schema is updated
      const response = await api.patch('/users/me', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Study settings saved successfully');
      refetchUser();
      setIsDirty(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    },
  });

  const handleSave = () => {
    if (timerDuration < 5 || timerDuration > 120) {
      toast.error('Timer duration must be between 5 and 120 minutes');
      return;
    }
    saveSettingsMutation.mutate({ timerEnabled, timerDuration });
  };

  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setTimerDuration(Math.max(5, Math.min(120, numValue)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        <h4 className="text-base font-semibold text-slate-900 dark:text-white">
          Timer Defaults
        </h4>
      </div>

      {/* Enable Timer Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Enable Test Timer by Default
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Automatically start a timer when beginning study sessions
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={timerEnabled}
            onChange={(e) => setTimerEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {/* Default Duration Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Default Duration (Minutes)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="5"
            max="120"
            value={timerDuration}
            onChange={(e) => handleDurationChange(e.target.value)}
            className="w-32 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setTimerDuration(Math.min(120, timerDuration + 5))}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Increase duration"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => setTimerDuration(Math.max(5, timerDuration - 5))}
              className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              aria-label="Decrease duration"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          Choose a duration between 5 and 120 minutes
        </p>
      </div>

      {/* Common Duration Presets */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {[15, 25, 30, 45, 60, 90].map((preset) => (
            <button
              key={preset}
              onClick={() => setTimerDuration(preset)}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${
                  timerDuration === preset
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }
              `}
            >
              {preset} min
            </button>
          ))}
        </div>
      </div>

      {/* Save Button */}
      {isDirty && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-purple-600 text-white rounded-lg hover:from-brand-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {/* Note about schema */}
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-xs text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> Timer settings will be saved once the database schema is updated to include <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">timerEnabled</code> and <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">timerDuration</code> fields in the User model.
        </p>
      </div>
    </div>
  );
}
