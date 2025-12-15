/**
 * useThrottle Hook
 * Throttles a value update to prevent render thrashing
 * Use for high-frequency updates like currentTime, scroll position, etc.
 *
 * Example:
 * const throttledTime = useThrottle(audioElement.currentTime, 250);
 * // Only updates state every 250ms, not on every timeupdate event
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface UseThrottleOptions {
  /**
   * Throttle interval in milliseconds
   * @default 250
   */
  interval?: number;
  /**
   * Fire on the leading edge (immediately)
   * @default true
   */
  leading?: boolean;
  /**
   * Fire on the trailing edge (after interval expires)
   * @default true
   */
  trailing?: boolean;
}

/**
 * Hook to throttle value updates
 * Perfect for currentTime, scrollY, mouse position, etc.
 */
export function useThrottle<T>(
  value: T,
  options: UseThrottleOptions = {}
): T {
  const { interval = 250, leading = true, trailing = true } = options;

  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRanRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRanRef.current;

    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Run immediately if enough time has passed (leading edge)
    if (timeSinceLastRun >= interval && leading) {
      setThrottledValue(value);
      lastRanRef.current = now;
    } else if (trailing) {
      // Schedule for later (trailing edge)
      const remainingTime = interval - timeSinceLastRun;
      timerRef.current = setTimeout(() => {
        setThrottledValue(value);
        lastRanRef.current = Date.now();
      }, remainingTime);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, interval, leading, trailing]);

  return throttledValue;
}

/**
 * Alternative: useThrottleCallback
 * Throttles a callback function instead of a value
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  interval: number = 250
): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRanRef = useRef<number>(0);

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRanRef.current;

      if (timeSinceLastRun >= interval) {
        callback(...args);
        lastRanRef.current = now;
      } else {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
          callback(...args);
          lastRanRef.current = Date.now();
        }, interval - timeSinceLastRun);
      }
    }) as T,
    [callback, interval]
  );
}
