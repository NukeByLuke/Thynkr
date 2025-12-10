/**
 * OAuth Button Components
 * Thea.study-inspired OAuth buttons for Google and Apple sign-in
 */

import { motion } from 'framer-motion';

interface OAuthButtonProps {
  onClick?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Google Sign-In Button
 * White background with colored Google logo, subtle border
 */
export function GoogleSignInButton({ onClick, isLoading, disabled, label = 'Sign in with Google' }: OAuthButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Redirect to backend OAuth endpoint
      window.location.href = `${API_URL}/auth/google`;
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isLoading || disabled}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}

/**
 * Apple Sign-In Button
 * Black background with white Apple logo
 */
export function AppleSignInButton({ onClick, isLoading, disabled, label = 'Sign in with Apple' }: OAuthButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Redirect to backend OAuth endpoint
      window.location.href = `${API_URL}/auth/apple`;
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isLoading || disabled}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-black border border-black rounded-xl text-sm font-medium text-white hover:bg-gray-900 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <LoadingSpinner light />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}

/**
 * OAuth Divider
 * "or" divider between OAuth buttons and email form
 */
export function OAuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-gray-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-medium">or</span>
      </div>
    </div>
  );
}

/**
 * Small loading spinner for buttons
 */
function LoadingSpinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 ${light ? 'text-white' : 'text-slate-600'}`}
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
