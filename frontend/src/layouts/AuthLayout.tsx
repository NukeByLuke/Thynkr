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

      {/* Logo and Brand */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Thynkr Logo */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500 w-64 h-64">
          <Logo variant="symbol" size="lg" className={`w-full h-full ${
            isDark 
              ? 'drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]' 
              : 'drop-shadow-[0_0_20px_rgba(124,58,237,0.3)]'
          }`} />
        </div>
        
        {/* Brand Name - Sunrise & Midnight gradient */}
        <h1 className={`text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent ${
          isDark 
            ? 'bg-gradient-to-b from-stone-50 to-stone-400'
            : 'bg-gradient-to-b from-stone-800 to-stone-600'
        }`}>
          THYNKR
        </h1>
        
        {/* Tagline */}
        <p className={`text-lg text-center max-w-[280px] leading-relaxed ${
          isDark ? 'text-stone-300' : 'text-stone-600'
        }`}>
          Transform your learning with intelligent AI study tools
        </p>
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
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-150 ${
        isDark 
          ? 'bg-slate-950'
          : 'bg-slate-100'
      }`}
    >
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle size="sm" />
      </div>

      {/* Two-Panel Container */}
      <div className="flex rounded-3xl overflow-hidden shadow-2xl max-w-[900px] w-full">
        {/* Left Panel - Branding */}
        <BrandingPanel isDark={isDark} />

        {/* Right Panel - Form */}
        <div 
          className={`flex-1 p-8 sm:p-10 transition-colors duration-150 ${
            isDark 
              ? 'bg-slate-800' 
              : 'bg-white'
          }`}
        >
          {/* Mobile Logo - Only shown on small screens */}
          <div className="md:hidden flex items-center justify-center mb-6">
            <Logo variant="full" size="md" />
          </div>

          {/* Auth Tabs */}
          <ThynkrTabs className="mb-8" />

          {/* Form Content - This is what changes between login/signup */}
          <div className="w-full">
            {children}
          </div>

          {/* Terms Footer */}
          <p className={`mt-8 text-center text-xs leading-relaxed ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            By signing in you agree to{' '}
            <Link 
              to="/terms" 
              className="text-cyan-500 hover:underline"
            >
              Thynkr's terms of service
            </Link>
            ,{' '}
            <Link 
              to="/privacy" 
              className="text-cyan-500 hover:underline"
            >
              privacy policy
            </Link>
            ,
            <br />
            and{' '}
            <Link 
              to="/cookies" 
              className="text-cyan-500 hover:underline"
            >
              cookie usage
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
