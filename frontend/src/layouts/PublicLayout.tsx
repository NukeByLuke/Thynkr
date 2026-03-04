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
        <div className="flex justify-between items-center px-4 sm:px-8 lg:px-16 py-3 sm:py-4 max-w-6xl mx-auto gap-2 sm:gap-4">
          <Logo variant="full" animated={false} />
          <nav className="flex items-center gap-2 sm:gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link 
              to="/pricing" 
              className="hidden sm:inline hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/pricing"
              aria-label="Pricing"
              className="sm:hidden w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 flex items-center justify-center text-slate-700 dark:text-slate-200"
            >
              <CircleDollarSign className="w-5 h-5" />
            </Link>
            {isAuthenticated ? (
              <>
                <ThemeToggle size="sm" />
                <Link
                  to="/study"
                  className="px-4 sm:px-6 py-2 sm:py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full font-medium transition-colors"
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
