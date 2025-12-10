/**
 * AuthLayout - Clean two-column layout for auth pages
 * No navbar, rounded-2xl corners, soft shadow
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
      className="light min-h-screen flex items-center justify-center px-8 py-8"
      style={{ backgroundColor: '#F1F5F9' }}
      data-theme="light"
    >
      {/* Centered Card Container */}
      <motion.div
        className="w-full max-w-[960px] flex flex-col lg:flex-row overflow-hidden rounded-2xl"
        style={{ 
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Left Brand Panel */}
        <div 
          className="lg:w-[45%] flex flex-col items-center justify-between p-8 lg:p-10 min-h-[180px] lg:min-h-[560px]"
          style={{ backgroundColor: '#1E1B4B' }}
        >
          {/* Spacer for top */}
          <div className="hidden lg:block" />

          {/* Center - Logo and Tagline */}
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-6">
              <svg 
                width="80" 
                height="80" 
                viewBox="0 0 120 120" 
                fill="none" 
                className="hidden lg:block"
              >
                {/* Minimal icon */}
                <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
                <path 
                  d="M60 25 L75 50 L60 95 L45 50 Z" 
                  fill="white" 
                  opacity="0.9"
                />
                <circle cx="60" cy="55" r="8" fill="#A78BFA" />
              </svg>
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2">
                <div 
                  className="w-10 h-10 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: '#06B6D4', borderRadius: '8px' }}
                >
                  T
                </div>
                <span className="text-white text-2xl font-semibold">Thynkr</span>
              </div>
            </div>

            {/* Brand Name - Desktop */}
            <h1 className="hidden lg:block text-4xl font-light text-white tracking-tight mb-4">
              Thynkr
            </h1>

            {/* Tagline */}
            <p 
              className="text-base font-light italic"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              unlock your learning potential
            </p>
          </div>

          {/* Footer Links */}
          <nav className="flex items-center justify-center gap-8 mt-8 lg:mt-0">
            <Link
              to="/about"
              className="text-xs font-medium hover:underline transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              About
            </Link>
            <Link
              to="/testimonials"
              className="text-xs font-medium hover:underline transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              className="text-xs font-medium hover:underline transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Contact
            </Link>
          </nav>
        </div>

        {/* Right Form Panel */}
        <div 
          className="lg:w-[55%] p-8 lg:p-10 flex flex-col"
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Auth Tabs */}
          <div 
            className="flex mb-8 p-1"
            style={{ backgroundColor: '#F3F4F6', borderRadius: '8px' }}
          >
            <Link
              to="/login"
              className="flex-1 py-2.5 text-sm font-medium text-center transition-all duration-200"
              style={isLogin 
                ? { backgroundColor: '#1F2937', color: '#FFFFFF', borderRadius: '6px' }
                : { backgroundColor: 'transparent', color: '#6B7280' }
              }
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="flex-1 py-2.5 text-sm font-medium text-center transition-all duration-200"
              style={!isLogin 
                ? { backgroundColor: '#1F2937', color: '#FFFFFF', borderRadius: '6px' }
                : { backgroundColor: 'transparent', color: '#6B7280' }
              }
            >
              Sign up
            </Link>
          </div>

          {/* Form Content */}
          <div className="flex-1">
            {children}
          </div>

          {/* Terms - At bottom */}
          <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: '#9CA3AF' }}>
            By signing in you agree to Thynkr's{' '}
            <Link to="/terms" className="underline hover:no-underline" style={{ color: '#6B7280' }}>
              terms of service
            </Link>
            ,{' '}
            <Link to="/privacy" className="underline hover:no-underline" style={{ color: '#6B7280' }}>
              privacy policy
            </Link>
            , and cookie usage.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
