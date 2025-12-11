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

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * BrandingPanel - Left side with logo and tagline
 */
function BrandingPanel() {
  return (
    <div className="hidden md:flex flex-col items-center justify-between w-[420px] bg-slate-900 rounded-l-3xl p-10 text-white">
      {/* Logo and Brand */}
      <div className="flex-1 flex flex-col items-center justify-center">
        {/* Thynkr Logo Icon */}
        <div className="mb-6">
          <div className="h-24 w-24 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <span className="text-white font-bold text-4xl">T</span>
          </div>
        </div>
        
        {/* Brand Name */}
        <h1 className="text-4xl font-bold tracking-tight mb-4">Thynkr</h1>
        
        {/* Tagline */}
        <p className="text-slate-400 text-lg text-center">
          the best ai study tool
        </p>
      </div>

      {/* Footer Links */}
      <nav className="flex items-center gap-8 text-sm">
        <Link
          to="/about"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          About
        </Link>
        <Link
          to="/testimonials"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          Testimonials
        </Link>
        <Link
          to="/contact"
          className="text-cyan-400 hover:text-cyan-300 transition-colors"
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
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-300 ${
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
          className={`flex-1 p-8 sm:p-10 transition-colors duration-300 ${
            isDark 
              ? 'bg-slate-800' 
              : 'bg-white'
          }`}
        >
          {/* Mobile Logo - Only shown on small screens */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-6">
            <div className="h-8 w-8 rounded-lg bg-cyan-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">T</span>
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">Thynkr</span>
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
