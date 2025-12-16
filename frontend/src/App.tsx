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
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PreviewGate from '@/features/courses/PreviewGate';
import GlobalLoadingBar from '@/components/ui/GlobalLoadingBar';
import { lazyWithPreload } from './utils/lazyWithPreload';

// Code-split page components with preloading for optimal bundle size
const Landing = lazyWithPreload(() => import('./pages/Landing'));
const Dashboard = lazyWithPreload(() => import('./pages/Dashboard'));
const Login = lazyWithPreload(() => import('./pages/Login'));
const Register = lazyWithPreload(() => import('./pages/Register'));
const AuthCallback = lazyWithPreload(() => import('./pages/AuthCallback'));
const OAuthCallback = AuthCallback; // Alias for /oauth-callback route
const Pricing = lazyWithPreload(() => import('./pages/Pricing'));
const Account = lazyWithPreload(() => import('./pages/Account'));
const Admin = lazyWithPreload(() => import('./pages/Admin'));
const Study = lazyWithPreload(() => import('./pages/Study'));
const ImmersiveStudy = lazyWithPreload(() => import('./pages/ImmersiveStudy'));
const Files = lazyWithPreload(() => import('./pages/Files'));
const Settings = lazyWithPreload(() => import('./pages/SettingsPage'));
const Courses = lazyWithPreload(() => import('./pages/CoursesUnified'));
const MyCourseDetail = lazyWithPreload(() => import('./pages/MyCourseDetail'));
const TutorChat = lazyWithPreload(() => import('./pages/TutorChat'));
const StudyProgress = lazyWithPreload(() => import('./pages/StudyProgress'));
const Achievements = lazyWithPreload(() => import('./pages/Achievements'));
const SavedPacks = lazyWithPreload(() => import('./pages/SavedPacks'));
const ArcadeLobby = lazyWithPreload(() => import('./pages/ArcadeLobby'));
const GamesDashboard = lazyWithPreload(() => import('./pages/GamesDashboard'));
const QuizGame = lazyWithPreload(() => import('./features/arcade/QuizGame'));
const MatchingGame = lazyWithPreload(() => import('./features/arcade/MatchingGame'));
const NotFound = lazyWithPreload(() => import('./pages/NotFound'));

/**
 * Custom hook to handle authentication-based redirects
 * Redirects authenticated users from login/register pages to dashboard
 */
function useAuthRedirects() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    // Only redirect from login/register pages, allow access to homepage (/)
    const authOnlyPages = ['/login', '/register'];
    const isOnAuthOnlyPage = authOnlyPages.includes(location.pathname);

    if (user && isOnAuthOnlyPage) {
      navigate('/dashboard', { replace: true });
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
   */
  const HomeRoute = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
      if (!isLoading && user) {
        navigate('/dashboard', { replace: true });
      }
    }, [user, isLoading, navigate]);

    if (isLoading) {
      return <LoadingSpinner fullScreen />;
    }

    return <Landing />;
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
      <GlobalLoadingBar />
      <ThemedToaster />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Auth routes - no navbar */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {/* Public routes with PublicLayout (navbar) */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/pricing" element={<Pricing />} />
            </Route>

          {/* Protected routes with DashboardLayout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >            <Route path="/dashboard" element={<Dashboard />} />            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/study" element={<Study />} />
            <Route path="/files" element={<Files />} />
            <Route path="/progress" element={<StudyProgress />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/saved-packs" element={<SavedPacks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />

            {/* Arcade - Available to all authenticated users */}
            <Route path="/arcade" element={<GamesDashboard />} />
            <Route path="/arcade/lobby" element={<ArcadeLobby />} />
            <Route path="/arcade/play/:pinCode" element={<QuizGame />} />
            <Route path="/arcade/solo/matching_rush" element={<MatchingGame />} />
            <Route path="/arcade/solo/live_quiz" element={<QuizGame />} />
            <Route path="/arcade/host/live_quiz" element={<QuizGame />} />

            {/* Tutor - Premium/Admin only */}
            <Route
              path="/tutor"
              element={
                <ProtectedRoute requiredRole="PREMIUM">
                  <TutorChat />
                </ProtectedRoute>
              }
            />

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

          {/* Immersive Study - Full-screen IDE-style layout (no DashboardLayout wrapper) */}
          <Route
            path="/immersive-study"
            element={
              <ProtectedRoute>
                <ImmersiveStudy />
              </ProtectedRoute>
            }
          />

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
          {!gatePassed && previewPassword ? (
            <PreviewGate onSuccess={() => setGatePassed(true)} />
          ) : (
            <AppContent />
          )}
        </ThemeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
