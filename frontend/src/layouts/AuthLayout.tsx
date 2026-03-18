/**
 * AuthLayout - Two-Panel Split Layout
 * Left panel: Branding with logo and tagline
 * Right panel: Auth form (login/signup) with tabs
 * Centered on screen, no entry animations
 */

import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import ThynkrTabs from '@/components/ThynkrTabs';
import Logo from '@/components/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * BrandingPanel - Left side with logo and tagline
 */
function BrandingPanel({ isDark }: { isDark: boolean }) {
  return (
    <div className={`hidden md:flex flex-col items-center justify-between w-[420px] relative overflow-hidden rounded-l-3xl p-10 transition-colors duration-150 ${
      isDark 
        ? 'bg-midnight-violet/20 text-white' 
        : 'bg-gradient-to-br from-stone-100 to-stone-200 text-stone-900'
    }`}>
      {/* Background Effects - Sunrise & Midnight */}
      <div className={`absolute inset-0 ${
        isDark 
          ? 'bg-[radial-gradient(circle_at_50%_120%,rgba(91,33,182,0.2),rgba(2,6,23,0))]'
          : 'bg-[radial-gradient(circle_at_50%_120%,rgba(236,72,153,0.12),rgba(253,251,247,0))]'
      }`} />
      <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
        isDark ? 'bg-midnight-cyan/10' : 'bg-sunrise-orange/15'
      }`} />
      <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 ${
        isDark ? 'bg-midnight-blue/10' : 'bg-sunrise-fuchsia/15'
      }`} />
      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, ${isDark ? 'white' : 'black'} 1px, transparent 1px)`,
          backgroundSize: '16px 16px',
        }}
      />

      {/* Logo and Brand */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Thynkr Logo */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500">
          <img
            src={isDark ? '/brand/brain-dark.png' : '/brand/brain-light.png'}
            alt="THYNKR"
            loading="eager"
            fetchPriority="high"
            className={`w-80 h-80 object-contain ${
              isDark 
                ? 'drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]' 
                : 'drop-shadow-[0_0_20px_rgba(124,58,237,0.3)] scale-105'
            }`}
          />
        </div>
        
        {/* Brand Wordmark */}
        <img
          src={isDark ? '/brand/wordmark-dark.png' : '/brand/wordmark-light.png'}
          alt="THYNKR"
          loading="eager"
          fetchPriority="high"
          className="h-16 object-contain"
        />

        {/* Testimonial Quote */}
        <blockquote className={`mt-8 text-center max-w-[280px] ${
          isDark ? 'text-stone-400' : 'text-stone-500'
        }`}>
          <p className="text-sm italic leading-relaxed">
            "Thynkr completely transformed how I study. AI-generated flashcards save me hours."
          </p>
          <footer className={`mt-3 text-xs font-medium ${
            isDark ? 'text-stone-500' : 'text-stone-400'
          }`}>
            — A happy student
          </footer>
        </blockquote>
      </div>

      {/* Footer Links */}
      <nav className="relative z-10 flex items-center gap-8 text-sm font-medium">
        <Link
          to="/about"
          className={`transition-colors ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          About
        </Link>
        <Link
          to="/testimonials"
          className={`transition-colors ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Testimonials
        </Link>
        <Link
          to="/contact"
          className={`transition-colors ${
            isDark ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'
          }`}
        >
          Contact
        </Link>
      </nav>
    </div>
  );
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`relative min-h-app w-full flex items-center justify-center overflow-hidden px-3 py-4 sm:p-4 transition-colors duration-150 ${
        isDark 
          ? 'bg-slate-950'
          : 'bg-slate-100'
      }`}
    >
      <div className={`pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-cyan-400/20' : 'bg-brand-300/30'}`} />
      <div className={`pointer-events-none absolute -bottom-36 -right-24 h-80 w-80 rounded-full blur-3xl ${isDark ? 'bg-violet-400/20' : 'bg-orange-300/30'}`} />

      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="sm" />
      </div>

      {/* Two-Panel Container */}
      <div className={`relative z-10 flex max-h-[calc(100dvh-1.5rem)] md:max-h-none md:h-[620px] rounded-2xl sm:rounded-3xl overflow-y-auto overflow-x-hidden max-w-[900px] w-full ${
        isDark
          ? 'shadow-[0_30px_70px_-16px_rgba(0,0,0,0.65)] ring-1 ring-cyan-400/20'
          : 'shadow-[0_24px_64px_-18px_rgba(236,72,153,0.35)] ring-1 ring-brand-100/90'
      }`}>
        {/* Left Panel - Branding */}
        <BrandingPanel isDark={isDark} />

        {/* Right Panel - Form */}
        <div 
          className={`flex-1 p-4 sm:p-8 md:p-10 transition-colors duration-150 ${
            isDark 
              ? 'bg-gradient-to-b from-slate-900 to-slate-800' 
              : 'bg-gradient-to-b from-white via-white to-brand-50/25'
          }`}
        >
          {/* Mobile Logo - Only shown on small screens */}
          <div className="md:hidden flex items-center justify-center mb-4 sm:mb-6">
            <Logo variant="full" size="md" />
          </div>

          <p className={`md:hidden text-center text-[11px] uppercase tracking-[0.18em] mb-3 ${isDark ? 'text-cyan-300/80' : 'text-brand-700/80'}`}>
            AI-Powered Study Platform
          </p>

          {/* Auth Tabs */}
          <ThynkrTabs className="mb-5 sm:mb-8" />

          {/* Form Content - This is what changes between login/signup */}
          <div className="w-full md:min-h-[520px]">
            {children}
          </div>

          {/* Terms Footer */}
          <p className={`mt-6 sm:mt-8 text-center text-xs leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            By signing in you agree to{' '}
            <Link 
              to="/terms" 
              className="text-brand-600 dark:text-cyan-400 hover:underline"
            >
              Thynkr's terms of service
            </Link>
            ,{' '}
            <Link 
              to="/privacy" 
              className="text-brand-600 dark:text-cyan-400 hover:underline"
            >
              privacy policy
            </Link>
            ,
            <br />
            and{' '}
            <Link 
              to="/cookies" 
              className="text-brand-600 dark:text-cyan-400 hover:underline"
            >
              cookie usage
            </Link>
            .
          </p>

          {/* Mobile quick links (desktop links live in branding panel) */}
          <nav className="mt-4 md:hidden flex items-center justify-center gap-5 text-xs">
            <Link
              to="/about"
              className={isDark ? 'text-slate-400 hover:text-white transition-colors' : 'text-slate-500 hover:text-slate-900 transition-colors'}
            >
              About
            </Link>
            <Link
              to="/testimonials"
              className={isDark ? 'text-slate-400 hover:text-white transition-colors' : 'text-slate-500 hover:text-slate-900 transition-colors'}
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              className={isDark ? 'text-slate-400 hover:text-white transition-colors' : 'text-slate-500 hover:text-slate-900 transition-colors'}
            >
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
