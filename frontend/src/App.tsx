/**
 * Thynkr Application Root
 * Main routing, authentication, and theme configuration for the React SPA.
 */

import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { TTSProvider } from './contexts/TTSContext';
import { NavigationProvider } from './contexts/NavigationContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import PreviewGate from './components/PreviewGate';
import MiniPlayer from './components/MiniPlayer';

// Code-split page components for optimal bundle size
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Account = lazy(() => import('./pages/Account'));
const Admin = lazy(() => import('./pages/Admin'));
const Study = lazy(() => import('./pages/Study'));
const Files = lazy(() => import('./pages/Files'));
const Settings = lazy(() => import('./pages/Settings'));
const Courses = lazy(() => import('./pages/CoursesUnified'));
const MyCourseDetail = lazy(() => import('./pages/MyCourseDetail'));
const TutorChat = lazy(() => import('./pages/TutorChat'));
const StudyProgress = lazy(() => import('./pages/StudyProgress'));
const SavedPacks = lazy(() => import('./pages/SavedPacks'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Custom hook to handle authentication-based redirects
 * Redirects authenticated users from public pages to dashboard
 */
function useAuthRedirects() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const publicAuthPages = ['/login', '/register', '/'];
    const isOnPublicAuthPage = publicAuthPages.includes(location.pathname);

    if (user && isOnPublicAuthPage) {
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

  return (
    <>
      <ThemedToaster />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public routes with PublicLayout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
          </Route>

          {/* Protected routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/study" element={<Study />} />
            <Route path="/files" element={<Files />} />
            <Route path="/progress" element={<StudyProgress />} />
            <Route path="/saved-packs" element={<SavedPacks />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/account" element={<Account />} />

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

          <Route path="*" element={<NotFound />} />
        </Routes>
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
          <TTSProvider>
            {!gatePassed && previewPassword ? (
              <PreviewGate onSuccess={() => setGatePassed(true)} />
            ) : (
              <>
                <AppContent />
                <MiniPlayer />
              </>
            )}
          </TTSProvider>
        </ThemeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
