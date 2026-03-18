import BrandLoader from './BrandLoader';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

export default function LoadingSpinner({ size = 'md', fullScreen = false, message }: LoadingSpinnerProps) {
  const dimensions = {
    sm: 18,
    md: 34,
    lg: 52,
  };

  const spinner = (
    <BrandLoader dimension={dimensions[size]} />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-app">
        <div className="text-center flex flex-col items-center">
          {spinner}
          {message && (
            <p className="mt-4 text-slate-500 dark:text-slate-400 text-sm">
              {message}
            </p>
          )}
          {!message && <span className="sr-only">Loading</span>}
        </div>
      </div>
    );
  }

  return spinner;
}
