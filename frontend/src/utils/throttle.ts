/**
 * Performance Utilities
 * Throttle and debounce helpers for optimizing high-frequency events
 */

/**
 * Throttle: Limits function execution to once per specified delay
 * Use for scroll, resize, mousemove events
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      // Schedule one final call after delay
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce: Delays function execution until after specified delay has passed
 * since the last invocation. Use for search inputs, window resize handlers.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function debounced(...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * RequestAnimationFrame-based throttle for visual updates
 * More efficient than time-based throttle for UI updates
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let latestArgs: Parameters<T> | null = null;

  return function throttled(...args: Parameters<T>) {
    latestArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (latestArgs) {
          func(...latestArgs);
          latestArgs = null;
        }
        rafId = null;
      });
    }
  };
}
