import { Outlet, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-5 border-b border-slate-200/10">
        <Logo variant="full" animated={false} />
        <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
          <Link to="/pricing" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
            Pricing
          </Link>
          {isAuthenticated ? (
            <Link
              to="/study"
              className="ml-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-400 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-100 transition">
                Login
              </Link>
              <Link
                to="/register"
                className="ml-2 px-5 py-2.5 bg-gradient-to-r from-brand-500 to-accent-400 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
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
