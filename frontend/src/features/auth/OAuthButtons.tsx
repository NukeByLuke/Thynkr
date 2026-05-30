/**
 * OAuth Button Components
 * Thynkr-style OAuth buttons with robust redirect handling
 * Vertical stack layout for centered card design
 */

import { useState } from 'react';

/**
 * Loading Spinner for OAuth buttons
 */
function LoadingSpinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={`animate-spin h-5 w-5 ${light ? 'text-white dark:text-black' : 'text-slate-600'}`}
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

/**
 * Google OAuth Button
 * Redirects to backend /auth/google endpoint
 */
function GoogleButton() {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isRedirecting) return;
    setIsRedirecting(true);
    
    // Small delay to prevent rapid redirect loops
    setTimeout(() => {
      // Use relative URL - nginx proxies /auth/ to backend
      window.location.replace('/auth/google');
    }, 100);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRedirecting}
      aria-label="Sign in with Google"
      className="w-full flex items-center justify-center gap-3 h-12 rounded-[2px] border-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed bg-white dark:bg-slate-900 border-fuchsia-200 dark:border-cyan-500/25 text-slate-700 dark:text-white font-medium hover:bg-fuchsia-50 dark:hover:bg-slate-800 hover:border-fuchsia-300 dark:hover:border-cyan-300"
    >
      {isRedirecting ? (
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
          <span className="text-sm">Continue with Google</span>
        </>
      )}
    </button>
  );
}

/**
 * OAuthButtons - Google sign-in button
 * Vertical stack layout for centered card design
 */
export function OAuthButtons() {
  return (
    <div className="w-full">
      <GoogleButton />
    </div>
  );
}

/**
 * OAuth Divider
 * "Or continue with" separator between OAuth buttons and email form
 */
export function OAuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t-2 border-fuchsia-200 dark:border-cyan-500/25" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="px-2 bg-white dark:bg-slate-900 text-fuchsia-700 dark:text-cyan-300 tracking-[0.18em] border border-fuchsia-200 dark:border-cyan-500/25 rounded-[2px]">
          or
        </span>
      </div>
    </div>
  );
}

// Legacy exports for backwards compatibility
export const GoogleSignInButton = GoogleButton;
