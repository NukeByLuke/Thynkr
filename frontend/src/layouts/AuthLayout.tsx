/**
 * AuthLayout - Thea-style minimal two-column layout
 * Left: branding panel with logo and tagline
 * Right: authentication form with tabs
 */

import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: '#F9FAFB', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Centered Card Container - max 900px, evenly split */}
      <motion.div
        className="w-full max-w-[900px] flex flex-col lg:flex-row overflow-hidden rounded-2xl"
        style={{ 
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Left Brand Panel - 50% width */}
        <div 
          className="lg:w-1/2 flex flex-col items-center justify-between p-8 lg:p-12 min-h-[200px] lg:min-h-[580px]"
          style={{ backgroundColor: '#1E1B4B' }}
        >
          {/* Spacer for vertical centering */}
          <div className="hidden lg:block flex-1" />

          {/* Center - Logo and Tagline */}
          <div className="flex flex-col items-center text-center">
            {/* Logo - 120x120 max */}
            <div className="mb-8">
              <svg 
                width="120" 
                height="120" 
                viewBox="0 0 120 120" 
                fill="none" 
                className="hidden lg:block"
              >
                {/* Minimal geometric logo */}
                <circle cx="60" cy="60" r="54" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
                <circle cx="60" cy="60" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" fill="none" />
                {/* Central diamond shape */}
                <path 
                  d="M60 20 L80 60 L60 100 L40 60 Z" 
                  fill="white" 
                  opacity="0.95"
                />
                {/* Accent dot */}
                <circle cx="60" cy="60" r="10" fill="#06B6D4" />
              </svg>
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-3">
                <div 
                  className="w-12 h-12 flex items-center justify-center text-white font-bold text-xl rounded-xl"
                  style={{ backgroundColor: '#06B6D4' }}
                >
                  T
                </div>
                <span className="text-white text-2xl font-semibold tracking-tight">Thynkr</span>
              </div>
            </div>

            {/* Brand Name - Desktop */}
            <h1 
              className="hidden lg:block text-4xl font-semibold text-white tracking-tight mb-3"
              style={{ lineHeight: '1.2' }}
            >
              Thynkr
            </h1>

            {/* Tagline */}
            <p 
              className="text-base font-normal"
              style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' }}
            >
              Unlock your learning potential.
            </p>
          </div>

          {/* Spacer + Footer Links */}
          <div className="hidden lg:flex flex-1 flex-col justify-end">
            <nav className="flex items-center justify-center gap-6 pt-8">
              <Link
                to="/about"
                className="text-xs font-medium hover:text-white transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                About
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <Link
                to="/testimonials"
                className="text-xs font-medium hover:text-white transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Testimonials
              </Link>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
              <Link
                to="/contact"
                className="text-xs font-medium hover:text-white transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.5)' }}
              >
                Contact
              </Link>
            </nav>
          </div>

          {/* Mobile footer links */}
          <nav className="lg:hidden flex items-center justify-center gap-4 mt-6">
            <Link
              to="/about"
              className="text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              About
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <Link
              to="/testimonials"
              className="text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Testimonials
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
            <Link
              to="/contact"
              className="text-xs font-medium"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Right Form Panel - 50% width, 48px padding */}
        <div 
          className="lg:w-1/2 p-8 lg:p-12 flex flex-col"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Auth Tabs - top aligned */}
          <div 
            className="flex mb-8 p-1 rounded-xl"
            style={{ backgroundColor: '#F3F4F6', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <Link
              to="/login"
              className="flex-1 py-2.5 text-sm font-medium text-center transition-all duration-200 rounded-lg"
              style={isLogin 
                ? { backgroundColor: '#FFFFFF', color: '#1F2937', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { backgroundColor: 'transparent', color: '#6B7280' }
              }
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="flex-1 py-2.5 text-sm font-medium text-center transition-all duration-200 rounded-lg"
              style={!isLogin 
                ? { backgroundColor: '#FFFFFF', color: '#1F2937', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                : { backgroundColor: 'transparent', color: '#6B7280' }
              }
            >
              Sign Up
            </Link>
          </div>

          {/* Form Content - max-w-[380px] centered */}
          <div className="flex-1 w-full max-w-[380px] mx-auto">
            {children}
          </div>

          {/* Terms - At bottom */}
          <p className="mt-8 text-center text-xs leading-relaxed max-w-[380px] mx-auto" style={{ color: '#9CA3AF' }}>
            By continuing you agree to Thynkr's{' '}
            <Link to="/terms" className="underline hover:no-underline transition-colors" style={{ color: '#6B7280' }}>
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:no-underline transition-colors" style={{ color: '#6B7280' }}>
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </motion.div>
    </div>
  );
}
