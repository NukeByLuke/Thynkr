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
function BrandingPanel() {
  return (
    <div className="hidden md:flex flex-col items-center justify-between w-[420px] bg-slate-950 relative overflow-hidden rounded-l-3xl p-10 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,58,237,0.15),rgba(15,23,42,0))]" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      {/* Logo and Brand */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        {/* Thynkr Logo */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-500 w-64 h-64">
          <Logo variant="symbol" theme="dark" size="lg" className="w-full h-full drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]" />
        </div>
        
        {/* Brand Name */}
        <h1 className="text-5xl font-bold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
          Thynkr
        </h1>
        
        {/* Tagline */}
        <p className="text-slate-400 text-lg text-center max-w-[280px] leading-relaxed">
          Transform your learning with intelligent AI tutoring
        </p>
      </div>

      {/* Footer Links */}
      <nav className="relative z-10 flex items-center gap-8 text-sm font-medium">
        <Link
          to="/about"
          className="text-slate-400 hover:text-white transition-colors"
        >
          About
        </Link>
        <Link
          to="/testimonials"
          className="text-slate-400 hover:text-white transition-colors"
        >
          Testimonials
        </Link>
        <Link
          to="/contact"
          className="text-slate-400 hover:text-white transition-colors"
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
        <BrandingPanel />

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
