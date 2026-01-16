import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Moon, Sun, Monitor } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function GeneralSettings() {
  const { themeMode, setThemeMode } = useTheme();
  const { user, refetchUser } = useAuth();
  
  // Default to English if no language set
  const currentLanguage = user?.preferredLanguage || 'en';

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Appearance</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Customize how Thynkr looks on your device.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setThemeMode('light')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              themeMode === 'light'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
            <Sun className={`w-8 h-8 mb-3 ${themeMode === 'light' ? 'fill-current' : ''}`} />
            <span className="font-semibold text-sm">Light Mode</span>
          </button>

          <button
            onClick={() => setThemeMode('dark')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              themeMode === 'dark'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
             <Moon className={`w-8 h-8 mb-3 ${themeMode === 'dark' ? 'fill-current' : ''}`} />
            <span className="font-semibold text-sm">Dark Mode</span>
          </button>

          <button
            onClick={() => setThemeMode('system')}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
              themeMode === 'system'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
             <Monitor className={`w-8 h-8 mb-3`} />
            <span className="font-semibold text-sm">System</span>
          </button>
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
    </div>
  );
}
