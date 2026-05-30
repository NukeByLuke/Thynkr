/**
 * AuthLayout - Two-Panel Split Layout
 * Left panel: Branding with logo and tagline
 * Right panel: Auth form (login/signup) with tabs
 * Centered on screen, no entry animations
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import ThynkrTabs from '@/components/ThynkrTabs';
import Logo from '@/components/Logo';

const loginBackdrop = '/SL-110822-53740-17.jpg';

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * BrandingPanel - Left side with logo and tagline
 */
function BrandingPanel({ isDark }: { isDark: boolean }) {
  return (
    <div className={`hidden md:flex flex-col items-center justify-between w-[420px] relative overflow-hidden rounded-l-[2px] border-r-2 p-10 transition-colors duration-150 ${
      isDark 
        ? 'bg-white/12 text-white border-cyan-500/20' 
        : 'bg-white/18 text-slate-900 border-fuchsia-200/60'
    }`}>

      {/* Logo and Brand */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Thynkr Logo */}
        <div className="mb-8">
          <img
            src={isDark ? '/brand/brain-dark.png' : '/brand/brain-light.png'}
            alt="THYNKR"
            loading="eager"
            fetchPriority="high"
            className="w-80 h-80 object-contain drop-shadow-[0_14px_30px_rgba(0,0,0,0.12)]"
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

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <div
      className="relative min-h-app w-full flex items-center justify-center overflow-hidden px-3 py-4 sm:p-4 transition-colors duration-150"
      style={{
        backgroundImage: `linear-gradient(${isDark ? '135deg' : '135deg'}, ${isDark ? 'rgba(2,6,23,0.58)' : 'rgba(255,255,255,0.20)'}, ${isDark ? 'rgba(37,99,235,0.16)' : 'rgba(244,114,182,0.14)'}), url(${loginBackdrop})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className={`pointer-events-none absolute inset-0 ${isDark ? 'bg-gradient-to-r from-cyan-950/20 via-transparent to-violet-950/25' : 'bg-gradient-to-r from-fuchsia-100/10 via-transparent to-sky-100/12'}`} />

      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="sm" />
      </div>

      {/* Two-Panel Container */}
      <div className={`relative z-10 flex max-h-[calc(100dvh-1.5rem)] md:max-h-none md:h-[620px] rounded-[2px] overflow-hidden max-w-[900px] w-full border-2 shadow-[0_18px_48px_-18px_rgba(15,23,42,0.35)] ${
        isDark
          ? 'border-cyan-500/25 bg-slate-950/45 backdrop-blur-md'
          : 'border-fuchsia-200/80 bg-white/60 backdrop-blur-md'
      }`}>
        {/* Left Panel - Branding */}
        <BrandingPanel isDark={isDark} />

        {/* Right Panel - Form */}
        <div 
          className={`flex-1 h-full overflow-y-auto p-4 sm:p-8 md:p-10 transition-colors duration-150 scrollbar-hide ${
            isDark 
              ? 'bg-slate-950/78 border-l-2 border-cyan-500/20' 
              : 'bg-white/82 border-l-2 border-fuchsia-100'
          }`}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
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
