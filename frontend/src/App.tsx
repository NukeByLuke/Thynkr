import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';
import PreviewGate from './components/PreviewGate';

// Lazy load pages for code splitting
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Account = lazy(() => import('./pages/Account'));
const Admin = lazy(() => import('./pages/Admin'));
const Study = lazy(() => import('./pages/Study'));
const Files = lazy(() => import('./pages/Files'));
const Settings = lazy(() => import('./pages/Settings'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const AdminCourses = lazy(() => import('./pages/AdminCourses'));
const NotFound = lazy(() => import('./pages/NotFound'));

function AppContent() {
  // Make toast styles adapt to theme for visual consistency
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
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:slug" element={<CourseDetail />} />

            {/* Protected routes */}
            <Route
              path="/study"
              element={
                <ProtectedRoute>
                  <Study />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminCourses />
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
      try { localStorage.setItem('thynkr_preview_gate', 'passed'); } catch {}
    }
  }, [gatePassed]);

  return (
    <AuthProvider>
      <ThemeProvider>
        {!gatePassed && previewPassword ? (
          <PreviewGate onSuccess={() => setGatePassed(true)} />
        ) : (
          <AppContent />
        )}
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
