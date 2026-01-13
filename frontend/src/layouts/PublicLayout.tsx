import { Outlet, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import Footer from '@/components/layout/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center px-8 lg:px-16 py-4 max-w-6xl mx-auto">
          <Logo variant="full" animated={false} />
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link 
              to="/pricing" 
              className="hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>
            {isAuthenticated ? (
              <>
                <ThemeToggle size="sm" />
                <Link
                  to="/study"
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-medium transition-colors"
                >
                  Go to Study
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Login
                </Link>
                <ThemeToggle size="sm" />
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-medium transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer - Now using shared theme-aware component */}
      <Footer />
    </div>
  );
}
