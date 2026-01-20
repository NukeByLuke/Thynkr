import { Clock, Pause, Play } from 'lucide-react';
import { useStudyTimer } from '@/hooks/useStudyTimer';

interface TimerDisplayProps {
  durationMinutes: number;
  onComplete?: () => void;
  timerKey?: string;
}

export default function TimerDisplay({ durationMinutes, onComplete, timerKey }: TimerDisplayProps) {
  const { timeLeft, isWarning, isActive, start, pause, progress } = useStudyTimer({
    durationMinutes,
    onComplete,
    timerKey,
  });

  // Parse time to check for critical state
  const [minutes, seconds] = timeLeft.split(':').map(Number);
  const totalSeconds = minutes * 60 + seconds;
  const isCritical = totalSeconds <= 10 && totalSeconds > 0;

  // Start timer if not active
  if (!isActive && totalSeconds === durationMinutes * 60) {
    start();
  }

  const handleToggle = () => {
    if (isActive) {
      pause();
    } else {
      start();
    }
  };

  return (
    <div className="fixed top-4 right-4 z-40 animate-in fade-in slide-in-from-top-5 duration-150">
      <div
        className={`
          flex items-center gap-3 px-4 py-2 rounded-full border-2 shadow-lg transition-all duration-150
          ${
            isCritical
              ? 'bg-red-600 border-red-700 text-white animate-pulse'
              : isWarning
                ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600 text-orange-900 dark:text-orange-200'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
          }
        `}
      >
        {/* Clock Icon */}
        <Clock
          className={`w-5 h-5 ${
            isCritical
              ? 'text-white'
              : isWarning
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-slate-600 dark:text-slate-400'
          }`}
        />

        {/* Time Display */}
        <div className="flex flex-col items-center min-w-[60px]">
          <span
            className={`text-lg font-bold tabular-nums ${
              isCritical ? 'text-white' : isWarning ? 'text-orange-900 dark:text-orange-100' : ''
            }`}
          >
            {timeLeft}
          </span>
          {/* Progress bar */}
          <div
            className={`w-full h-1 rounded-full mt-1 ${
              isCritical
                ? 'bg-red-900'
                : isWarning
                  ? 'bg-orange-200 dark:bg-orange-900'
                  : 'bg-slate-100 dark:bg-slate-700'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isCritical
                  ? 'bg-white'
                  : isWarning
                    ? 'bg-orange-600 dark:bg-orange-400'
                    : 'bg-brand-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Pause/Play Button */}
        <button
          onClick={handleToggle}
          className={`
            p-1.5 rounded-full transition-all hover:scale-110
            ${
              isCritical
                ? 'hover:bg-red-700'
                : isWarning
                  ? 'hover:bg-orange-100 dark:hover:bg-orange-800'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }
          `}
          aria-label={isActive ? 'Pause timer' : 'Resume timer'}
        >
          {isActive ? (
            <Pause
              className={`w-4 h-4 ${
                isCritical
                  ? 'text-white'
                  : isWarning
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400'
              }`}
            />
          ) : (
            <Play
              className={`w-4 h-4 ${
                isCritical
                  ? 'text-white'
                  : isWarning
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400'
              }`}
            />
          )}
        </button>
      </div>

      {/* Blur overlay when paused */}
      {!isActive && totalSeconds < durationMinutes * 60 && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-slate-900/40 backdrop-blur-sm z-30 animate-in fade-in duration-150" />
      )}
    </div>
  );
}
