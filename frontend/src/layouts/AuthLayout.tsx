/**
 * AuthLayout - Thea.study-inspired clean two-column layout
 * Exact replica of Thea's login page design
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
      className="light min-h-screen flex items-center justify-center p-4 lg:p-8"
      style={{ backgroundColor: '#E8EEF4' }}
      data-theme="light"
    >
      {/* Centered Card Container */}
      <motion.div
        className="w-full max-w-[1000px] flex flex-col lg:flex-row rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Left Brand Panel */}
        <div 
          className="lg:w-[45%] flex flex-col items-center justify-between p-8 lg:p-12 min-h-[200px] lg:min-h-[580px]"
          style={{ backgroundColor: '#1E1B4B' }}
        >
          {/* Spacer for top */}
          <div className="hidden lg:block" />

          {/* Center - Logo and Tagline */}
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-6">
              <svg 
                width="120" 
                height="120" 
                viewBox="0 0 120 120" 
                fill="none" 
                className="hidden lg:block"
              >
                {/* Rocket/pencil icon similar to Thea */}
                <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" />
                <path 
                  d="M60 25 L75 50 L60 95 L45 50 Z" 
                  fill="white" 
                  opacity="0.9"
                />
                <circle cx="60" cy="55" r="8" fill="#06B6D4" />
              </svg>
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: '#06B6D4' }}
                >
                  T
                </div>
                <span className="text-white text-2xl font-semibold">Thynkr</span>
              </div>
            </div>

            {/* Brand Name - Desktop */}
            <h1 className="hidden lg:block text-5xl font-light text-white tracking-tight mb-4">
              Thynkr
            </h1>

            {/* Tagline */}
            <p 
              className="text-base lg:text-lg font-light italic"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              unlock your learning potential
            </p>
          </div>

          {/* Footer Links */}
          <nav className="flex items-center justify-center gap-8 mt-8 lg:mt-0">
            <Link
              to="/about"
              className="text-xs hover:underline transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              About
            </Link>
            <Link
              to="/testimonials"
              className="text-xs hover:underline transition-colors duration-200"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              className="text-xs hover:underline transition-colors duration-200"
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
          {/* Auth Tabs - Outside of scrollable area */}
          <div 
            className="flex mb-6 rounded-full p-1"
            style={{ backgroundColor: '#E5E7EB' }}
          >
            <Link
              to="/login"
              className="flex-1 px-6 py-2.5 text-sm font-medium rounded-full text-center transition-all duration-200"
              style={isLogin 
                ? { backgroundColor: '#D1D5DB', color: '#1F2937' }
                : { backgroundColor: 'transparent', color: '#6B7280' }
              }
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="flex-1 px-6 py-2.5 text-sm font-medium rounded-full text-center transition-all duration-200"
              style={!isLogin 
                ? { backgroundColor: '#D1D5DB', color: '#1F2937' }
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
