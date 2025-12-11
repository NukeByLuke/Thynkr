/**
 * AuthCallback - Handles OAuth redirects from Google/Apple
 * Processes token or error from URL params and redirects accordingly
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Skeleton Dashboard - Shown while verifying token
 * Reduces layout shift during OAuth callback processing
 */
function SkeletonDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation Skeleton */}
      <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6">
        <div className="w-32 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        <div className="ml-auto flex items-center gap-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          <div className="w-24 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="w-64 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
          <div className="w-96 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse mb-4" />
              <div className="w-20 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700"
            >
              <div className="w-40 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                    <div className="flex-1">
                      <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                      <div className="w-2/3 h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <svg
          className="animate-spin h-5 w-5 text-cyan-500"
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
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Signing you in...
        </span>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetchUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Prevent duplicate processing (React StrictMode runs effects twice)
    let hasProcessed = false;
    
    const processCallback = async () => {
      if (hasProcessed) return;
      hasProcessed = true;
      
      const token = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      // Handle error case
      if (error) {
        toast.error('Login failed. Please try again.', {
          duration: 4000,
          icon: '❌',
        });
        navigate('/login', { replace: true });
        return;
      }

      // Handle token case
      if (token) {
        try {
          // Store tokens in localStorage
          localStorage.setItem('accessToken', token);
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }

          // Refetch user to update global auth state
          await refetchUser();

          // Success toast
          toast.success('Welcome back!', {
            duration: 3000,
            icon: '👋',
          });

          // Redirect to study page (main app)
          navigate('/study', { replace: true });
        } catch (err) {
          console.error('Failed to process OAuth callback:', err);
          
          // Clear any stored tokens on error
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          
          toast.error('Something went wrong. Please try again.', {
            duration: 4000,
            icon: '⚠️',
          });
          navigate('/login', { replace: true });
        }
      } else {
        // No token or error - something went wrong
        toast.error('Invalid callback. Please try again.', {
          duration: 4000,
          icon: '⚠️',
        });
        navigate('/login', { replace: true });
      }

      setIsProcessing(false);
    };

    processCallback();
  }, [searchParams, navigate, refetchUser]);

  // Show skeleton dashboard while processing
  if (isProcessing) {
    return <SkeletonDashboard />;
  }

  // This should never render as we redirect in all cases
  return null;
}
