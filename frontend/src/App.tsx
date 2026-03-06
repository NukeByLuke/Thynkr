/**
 * Thynkr Application Root
 * Main routing, authentication, and theme configuration for the React SPA.
 * Optimized with preloadable code-splitting for better performance
 */

import { Suspense, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { LayoutProvider, useLayout } from './contexts/LayoutContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AudioPlayerProvider } from './contexts/AudioPlayerContext';
import ProtectedRoute from '@/features/auth/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import GlobalLoadingBar from '@/components/ui/GlobalLoadingBar';
import BackgroundShapes from '@/components/ui/BackgroundShapes';
import {
  Login, Register, AuthCallback, OAuthCallback, ForgotPassword, VerifyEmail, 
  ResetPassword, Pricing, Account, Admin, Study, ImmersiveStudy, Files, 
  Settings, HelpCenter, Courses, MyCourseDetail, StudyModePage, Achievements, 
  PublicAchievements, NotFound, Privacy, Terms, Cookies, About, Contact, 
  Testimonials, Roadmap
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
  
  const location = useLocation();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();

  /**
   * GLOBAL NAVIGATION SAFETY NET
   * Resets layout state on every route change to prevent "zombie view" bugs
   * where a page's custom layout state persists after navigation
   */
  useEffect(() => {
    // Reset to default layout state on every route change
    // This ensures no page can "trap" the user in a custom layout
    setHideSidebar(false);
    setCustomHeaderContent(null);
  }, [location.pathname, setHideSidebar, setCustomHeaderContent]);

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

  return (
    <>
      {/* Global ambient background shapes */}
      <BackgroundShapes />
      
      <GlobalLoadingBar />
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
            {/* Home route - redirects to login or study based on auth */}
            <Route path="/" element={<HomeRoute />} />
            
            {/* Auth routes - no layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Public routes with PublicLayout (navbar) */}
            <Route element={<PublicLayout />}>
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/u/:username" element={<PublicAchievements />} />
              
              {/* Legal pages */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/cookies" element={<Cookies />} />
              
              {/* Public marketing pages */}
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/testimonials" element={<Testimonials />} />
              <Route path="/roadmap" element={<Roadmap />} />
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
            <Route path="/help" element={<HelpCenter />} />
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
            <Route
              path="/courses/:id/study"
              element={
                <ProtectedRoute requiredRole="STANDARD">
                  <StudyModePage />
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
  return (
    <AuthProvider>
      <NavigationProvider>
        <ThemeProvider>
          <NotificationProvider>
            <LayoutProvider>
              <AudioPlayerProvider>
                <Toaster 
                  position="top-center"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: 'var(--toast-bg, #333)',
                      color: 'var(--toast-color, #fff)',
                    },
                  }}
                />
                <AppContent />
              </AudioPlayerProvider>
            </LayoutProvider>
          </NotificationProvider>
        </ThemeProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}

export default App;
