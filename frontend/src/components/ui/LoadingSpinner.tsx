import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false, message }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  const spinner = (
    <div
      className={clsx(
        'rounded-full border-primary-200 border-t-primary-500 [animation:spin_.65s_linear_infinite] transform-gpu will-change-transform',
        sizes[size]
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-app">
        <div className="text-center">
          {spinner}
          {message && (
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return spinner;
}
