import { Outlet, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import Footer from '@/components/layout/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { CircleDollarSign } from 'lucide-react';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-app flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-8 sm:py-4 lg:px-16">
          <Logo variant="full" size="sm" animated={false} className="sm:hidden" />
          <Logo variant="full" animated={false} className="hidden sm:flex" />

          <nav className="flex items-center gap-1.5 sm:gap-6 text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 shrink-0">
            <Link
              to="/"
              className="hidden sm:inline transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              Home
            </Link>
            <Link 
              to="/pricing" 
              className="hidden sm:inline transition-colors hover:text-slate-900 dark:hover:text-white"
            >
              Pricing
            </Link>
            <Link
              to="/pricing"
              aria-label="Pricing"
              className="hidden min-[400px]:flex sm:hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200"
            >
              <CircleDollarSign className="h-4 w-4" />
            </Link>
            {isAuthenticated ? (
              <>
                <ThemeToggle size="sm" />
                <Link
                  to="/study"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-cyan-500 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-cyan-600 sm:px-6 sm:py-2.5"
                >
                  <span className="sm:hidden">Study</span>
                  <span className="hidden sm:inline">Go to Study</span>
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full border border-slate-200 bg-white/90 px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700/70 sm:h-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:text-sm sm:font-medium sm:text-slate-600 sm:hover:text-slate-900 sm:dark:bg-transparent sm:dark:text-slate-400 sm:dark:hover:text-white"
                >
                  Login
                </Link>
                <ThemeToggle size="sm" />
                <Link
                  to="/register"
                  className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full bg-cyan-500 px-3 sm:px-6 py-2 text-sm sm:text-base font-medium text-white transition-all duration-200 hover:bg-cyan-600"
                >
                  <span className="sm:hidden">Start Free</span>
                  <span className="hidden sm:inline">Get Started Free</span>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 ${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : ''}`}>
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

      {/* Bottom nav for authenticated users on public pages */}
      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
}
