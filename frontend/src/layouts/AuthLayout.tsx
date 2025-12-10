/**
 * AuthLayout - Thea-style 2-column layout for login/signup pages
 * Left: Brand panel with logo, tagline, and footer links
 * Right: Form content with tabs
 */

import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '@/components/ThemeToggle';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex theme-transition">
      {/* Left Brand Panel */}
      <motion.div
        className="hidden lg:flex lg:w-[45%] xl:w-[40%] bg-slate-900 dark:bg-slate-800 rounded-r-[3rem] flex-col justify-between p-10 xl:p-14 relative overflow-hidden"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-accent-500/10 pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Thynkr</span>
          </Link>
        </div>

        {/* Tagline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            The best AI
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              study tool
            </span>
          </h1>
          <p className="text-white/70 text-lg max-w-sm">
            Smart study tools powered by AI to help you learn faster and retain more.
          </p>
        </div>

        {/* Footer Links */}
        <nav className="relative z-10 flex items-center gap-6">
          <Link
            to="/about"
            className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
          >
            About
          </Link>
          <Link
            to="/testimonials"
            className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
          >
            Testimonials
          </Link>
          <Link
            to="/contact"
            className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200"
          >
            Contact
          </Link>
        </nav>
      </motion.div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-20">
          <ThemeToggle size="sm" />
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex justify-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Thynkr</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:px-12 xl:px-20">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Auth Tabs */}
            <div className="flex mb-8 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <Link
                to="/login"
                className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition-all duration-200 ${
                  isLogin
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className={`flex-1 py-3 text-center text-sm font-semibold rounded-lg transition-all duration-200 ${
                  !isLogin
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                Sign up
              </Link>
            </div>

            {children}

            {/* Terms */}
            <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
              By signing in you agree to Thynkr's{' '}
              <Link to="/terms" className="text-slate-700 dark:text-slate-300 hover:underline">
                terms of service
              </Link>
              ,{' '}
              <Link to="/privacy" className="text-slate-700 dark:text-slate-300 hover:underline">
                privacy policy
              </Link>
              , and cookie usage.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
