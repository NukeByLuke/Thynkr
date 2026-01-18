/**
 * Thynkr Application Root
 * Main routing, authentication, and theme configuration for the React SPA.
 * Optimized with preloadable code-splitting for better performance
 */

import { Suspense, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PreviewGate from '@/features/courses/PreviewGate';
import GlobalLoadingBar from '@/components/ui/GlobalLoadingBar';
import BackgroundShapes from '@/components/ui/BackgroundShapes';
import {
  Login, Register, AuthCallback, OAuthCallback, Pricing, Account, Admin,
  Study, ImmersiveStudy, Files, Settings, Courses, MyCourseDetail,
  Achievements, PublicAchievements, NotFound
} from './routes';

/**
 * Custom hook to handle authentication-based redirects
 * Redirects authenticated users from login/register pages to study page
 */
function useAuthRedirects() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Redirect authenticated users from login/register pages to study page
    const authOnlyPages = ['/login', '/register'];
    const isOnAuthOnlyPage = authOnlyPages.includes(location.pathname);

    if (user && isOnAuthOnlyPage) {
      navigate('/study', { replace: true });
    }
  }, [user, isLoading, location.pathname, navigate]);
}

/**
 * Main application content with routing and theme-aware toasts
 */
function AppContent() {
  useAuthRedirects();

  /**
   * Home route component that redirects based on auth status
   * - If not authenticated: show login page
   * - If authenticated: redirect to study page
   */
  const HomeRoute = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (isLoading) return;
      
      if (user) {
        // Authenticated users go to study page
        navigate('/study', { replace: true });
      } else {
        // Unauthenticated users go to login page
        navigate('/login', { replace: true });
      }
    }, [user, isLoading, navigate]);

    // Show loading while checking auth status
    return <LoadingSpinner fullScreen />;
  };

  /**
   * Theme-aware toast notification component
   */
  const ThemedToaster = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    return (
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: isDark ? '#2A2A2A' : '#FFFFFF',
            color: isDark ? '#FFFFFF' : '#111827',
            border: isDark ? '1px solid #374151' : '1px solid #E5E7EB',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: isDark ? '#1F2937' : '#FFFFFF',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: isDark ? '#1F2937' : '#FFFFFF',
            },
          },
        }}
      />
    );
  };

  const location = useLocation();

  return (
    <>
      {/* Global ambient background shapes */}
      <BackgroundShapes />
      
      <GlobalLoadingBar />
      <ThemedToaster />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Home route - redirects to login or study based on auth */}
            <Route path="/" element={<HomeRoute />} />
            
            {/* Auth routes - no layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* Public routes with PublicLayout (navbar) */}
            <Route element={<PublicLayout />}>
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/u/:username" element={<PublicAchievements />} />
            </Route>

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/study" element={<Study />} />
            <Route path="/study/:fileId" element={<ImmersiveStudy />} />
            <Route path="/files" element={<Files />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />
            <Route path="/achievements" element={<Achievements />} />

            {/* Courses - Standard+ */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute requiredRole="STANDARD">
                  <Courses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:id"
              element={
                <ProtectedRoute requiredRole="STANDARD">
                  <MyCourseDetail />
                </ProtectedRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Admin />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
}

function App() {
  const previewPassword = (import.meta.env.VITE_PREVIEW_PASSWORD as string) || '';
  const [gatePassed, setGatePassed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('thynkr_preview_gate') === 'passed' || !previewPassword;
    } catch {
      return !previewPassword;
    }
  });

  useEffect(() => {
    if (gatePassed) {
      try {
        localStorage.setItem('thynkr_preview_gate', 'passed');
      } catch (error) {
        // Storage access denied - continue without persisting
      }
    }
  }, [gatePassed]);

  return (
    <AuthProvider>
      <NavigationProvider>
        <ThemeProvider>
          <NotificationProvider>
            <LayoutProvider>
              {!gatePassed && previewPassword ? (
                <PreviewGate onSuccess={() => setGatePassed(true)} />
              ) : (
                <AppContent />
              )}
            </LayoutProvider>
          </NotificationProvider>
        </ThemeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
