import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import Footer from '@/components/layout/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Menu, X } from 'lucide-react';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-app flex flex-col bg-white dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-pink-100/80 bg-white/90 backdrop-blur-xl dark:border-cyan-900/40 dark:bg-slate-950/90">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <div className="flex-shrink-0">
              <Link to="/" className="block">
                <Logo variant="full" animated={false} className="h-8" />
              </Link>
            </div>

            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                to="/"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-pink-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                Home
              </Link>
              <a
                href="/#how-it-works"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-pink-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                How it Works
              </a>
              <a
                href="/#features"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-pink-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                Features
              </a>
              <Link
                to="/pricing"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-pink-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                Pricing
              </Link>
              <a
                href="/#faq"
                className="text-sm font-medium text-slate-700 transition-colors hover:text-pink-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                FAQ
              </a>
            </nav>

            <div className="hidden lg:flex items-center space-x-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <Link
                  to="/study"
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-105 dark:from-cyan-600 dark:via-violet-600 dark:to-blue-600"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-pink-700 dark:text-slate-300 dark:hover:text-cyan-300"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:brightness-105 dark:from-cyan-600 dark:via-violet-600 dark:to-blue-600"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 lg:hidden">
              <ThemeToggle size="sm" />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-700 transition-colors hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-pink-100/80 bg-white/95 lg:hidden dark:border-cyan-900/40 dark:bg-slate-950/95">
            <div className="space-y-1 px-4 pb-4 pt-2">
              <Link
                to="/"
                className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <a
                href="/#how-it-works"
                className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                How it Works
              </a>
              <a
                href="/#features"
                className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <Link
                to="/pricing"
                className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <a
                href="/#faq"
                className="block rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-pink-50 dark:text-slate-300 dark:hover:bg-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <Link
                    to="/study"
                    className="block w-full rounded-lg bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 px-4 py-3 text-center text-base font-semibold text-white transition-all duration-200 hover:brightness-105 dark:from-cyan-600 dark:via-violet-600 dark:to-blue-600"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="block w-full rounded-lg border border-pink-200 px-4 py-3 text-center text-base font-medium text-slate-700 transition-colors hover:bg-pink-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full rounded-lg bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 px-4 py-3 text-center text-base font-semibold text-white transition-all duration-200 hover:brightness-105 dark:from-cyan-600 dark:via-violet-600 dark:to-blue-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className={`flex-1 ${isAuthenticated ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0' : ''}`}>
        <Outlet />
      </main>

      <Footer />

      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
}
