/**
 * AIGenerationProgress Component
 * A polished progress bar with Aurora gradient and shimmer animation
 * for AI generation tasks.
 */

import { clsx } from 'clsx';

interface AIGenerationProgressProps {
  /** Progress value from 0-100 */
  progress?: number;
  /** Status text to display above the bar */
  status?: string;
  /** If true, bar stays full width and just shimmers (for unknown duration tasks) */
  isIndeterminate?: boolean;
  /** Size variant */
  size?: 'slim' | 'default';
  /** Additional className for the container */
  className?: string;
}

/**
 * AIGenerationProgress - Aurora-themed progress bar with shimmer effect
 *
 * @example
 * // Determinate progress
 * <AIGenerationProgress progress={45} status="Synthesizing notes..." />
 *
 * @example
 * // Indeterminate (unknown duration)
 * <AIGenerationProgress isIndeterminate status="Processing..." />
 */
export default function AIGenerationProgress({
  progress = 0,
  status,
  isIndeterminate = false,
  size = 'default',
  className,
}: AIGenerationProgressProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress));
  const fillWidth = isIndeterminate ? 100 : clampedProgress;

  return (
    <div className={clsx('w-full', className)}>
      {/* Status Text */}
      {status && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-thynkr-blue font-medium text-xs uppercase tracking-wider">
            {status}
          </span>
          {!isIndeterminate && (
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              {Math.round(clampedProgress)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div
        className={clsx(
          'w-full overflow-hidden rounded-full',
          'bg-slate-100 dark:bg-slate-800',
          size === 'slim' ? 'h-2' : 'h-3'
        )}
      >
        {/* Fill Bar with Shimmer */}
        <div
          className={clsx(
            'h-full rounded-full relative overflow-hidden',
            'bg-gradient-aurora',
            'transition-all duration-300 ease-out'
          )}
          style={{ width: `${fillWidth}%` }}
        >
          {/* Shimmer Overlay */}
          <div
            className={clsx(
              'absolute inset-0',
              'bg-gradient-to-r from-transparent via-white/30 to-transparent',
              'animate-shimmer'
            )}
          />
        </div>
      </div>
    </div>
  );
}
