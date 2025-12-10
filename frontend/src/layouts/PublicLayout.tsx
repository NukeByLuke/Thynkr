import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import Footer from '@/components/Footer';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with glassmorphism */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-white/10"
      >
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <Logo variant="full" animated={false} />
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <Link 
              to="/pricing" 
              className="hover:text-slate-900 dark:hover:text-white transition-colors duration-250"
            >
              Pricing
            </Link>
            {isAuthenticated ? (
              <>
                <ThemeToggle size="sm" />
                <Link
                  to="/study"
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-2xl font-semibold shadow-soft hover:shadow-glow-brand transition-all duration-300"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-250"
                >
                  Login
                </Link>
                <ThemeToggle size="sm" />
                <Link
                  to="/register"
                  className="px-6 py-2.5 bg-gradient-to-r from-brand-500 to-accent-500 text-white rounded-2xl font-semibold shadow-soft hover:shadow-glow-brand transition-all duration-300"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer - Now using shared theme-aware component */}
      <Footer />
    </div>
  );
}
