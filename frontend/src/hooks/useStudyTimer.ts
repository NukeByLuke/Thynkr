import { useState, useEffect, useCallback } from 'react';

interface UseStudyTimerOptions {
  durationMinutes: number;
  onComplete?: () => void;
  timerKey?: string; // Unique key for storing this specific timer
}

interface UseStudyTimerReturn {
  timeLeft: string; // Formatted as "MM:SS"
  progress: number; // 0-100
  isWarning: boolean; // true if < 1 minute remaining
  isActive: boolean; // true if timer is running
  start: () => void;
  pause: () => void;
  reset: () => void;
  cancel: () => void;
}

const STORAGE_PREFIX = 'study_timer_';

export function useStudyTimer({
  durationMinutes,
  onComplete,
  timerKey = 'default',
}: UseStudyTimerOptions): UseStudyTimerReturn {
  const storageKey = `${STORAGE_PREFIX}${timerKey}`;
  
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  const totalSeconds = durationMinutes * 60;

  // Load persisted timer on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        if (data.targetTimestamp && data.targetTimestamp > now) {
          // Timer is still valid
          setTargetTimestamp(data.targetTimestamp);
          setIsActive(true);
        } else {
          // Timer expired while page was closed
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error('Failed to parse stored timer:', error);
        localStorage.removeItem(storageKey);
      }
    }
  }, [storageKey]);

  // Update remaining time based on target timestamp
  useEffect(() => {
    if (!isActive || !targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((targetTimestamp - now) / 1000));
      
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !hasCompleted) {
        setIsActive(false);
        setHasCompleted(true);
        localStorage.removeItem(storageKey);
        
        if (onComplete) {
          onComplete();
        }
      }
    }, 100); // Update every 100ms for smooth progress bar

    return () => clearInterval(interval);
  }, [isActive, targetTimestamp, storageKey, onComplete, hasCompleted]);

  // Start timer
  const start = useCallback(() => {
    const target = Date.now() + remainingSeconds * 1000;
    setTargetTimestamp(target);
    setIsActive(true);
    setHasCompleted(false);
    
    // Persist to localStorage
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        targetTimestamp: target,
        durationMinutes,
      })
    );
  }, [remainingSeconds, storageKey, durationMinutes]);

  // Pause timer
  const pause = useCallback(() => {
    setIsActive(false);
    setTargetTimestamp(null);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Reset timer to original duration
  const reset = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setTargetTimestamp(null);
    setIsActive(false);
    setHasCompleted(false);
    localStorage.removeItem(storageKey);
  }, [totalSeconds, storageKey]);

  // Cancel timer completely
  const cancel = useCallback(() => {
    setRemainingSeconds(totalSeconds);
    setTargetTimestamp(null);
    setIsActive(false);
    setHasCompleted(false);
    localStorage.removeItem(storageKey);
  }, [totalSeconds, storageKey]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress (0-100)
  const progress = totalSeconds > 0 ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100 : 0;

  // Check if warning state (< 1 minute remaining)
  const isWarning = remainingSeconds < 60 && remainingSeconds > 0;

  return {
    timeLeft: formatTime(remainingSeconds),
    progress: Math.min(100, Math.max(0, progress)),
    isWarning,
    isActive,
    start,
    pause,
    reset,
    cancel,
  };
}
