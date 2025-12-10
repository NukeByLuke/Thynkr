/**
 * AuthLayout - Thea-inspired clean 2-column layout for login/signup pages
 * Left: Centered brand panel with logo, tagline, and footer links
 * Right: White floating form card with tabs inside
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
    <div className="light min-h-screen flex" style={{ backgroundColor: '#F8FAFC' }} data-theme="light">
      {/* Left Brand Panel - Deep indigo, full height on desktop */}
      <motion.div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-10 xl:p-12"
        style={{ backgroundColor: '#1E1B4B' }}
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Top - Logo with brand name */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: '#06B6D4' }}
          >
            T
          </div>
          <span className="text-white text-xl font-medium tracking-tight">Thynkr</span>
        </div>

        {/* Center - Tagline */}
        <div className="flex flex-col">
          <h1 className="text-4xl xl:text-5xl font-light text-white tracking-tight leading-tight mb-4">
            <span className="italic">Unlock your</span>
            <br />
            <span style={{ color: '#06B6D4' }} className="italic">learning potential</span>
          </h1>
          
          <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-base font-light max-w-[280px]">
            Smart study tools powered by AI to help you learn faster and retain more.
          </p>
        </div>

        {/* Footer Links */}
        <nav className="flex items-center gap-6">
          <Link
            to="/about"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            className="hover:text-white text-sm transition-colors duration-200"
          >
            About
          </Link>
          <Link
            to="/contact"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            className="hover:text-white text-sm transition-colors duration-200"
          >
            Contact
          </Link>
          <Link
            to="/terms"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            className="hover:text-white text-sm transition-colors duration-200"
          >
            Terms
          </Link>
        </nav>
      </motion.div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Mobile Logo - Only visible on mobile */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: '#1E1B4B' }}
            >
              T
            </div>
            <span style={{ color: '#1E1B4B' }} className="text-lg font-semibold tracking-tight">Thynkr</span>
          </div>

          {/* White Form Card */}
          <div 
            className="rounded-2xl p-8 shadow-sm"
            style={{ backgroundColor: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            {/* Auth Tabs - Inside card */}
            <div className="flex mb-6 rounded-xl p-1" style={{ backgroundColor: '#F1F5F9' }}>
              <Link
                to="/login"
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-center transition-all duration-200"
                style={isLogin 
                  ? { backgroundColor: '#FFFFFF', color: '#1E1B4B', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                  : { backgroundColor: 'transparent', color: '#64748B' }
                }
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg text-center transition-all duration-200"
                style={!isLogin 
                  ? { backgroundColor: '#FFFFFF', color: '#1E1B4B', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }
                  : { backgroundColor: 'transparent', color: '#64748B' }
                }
              >
                Sign Up
              </Link>
            </div>

            {/* Form Content */}
            {children}
          </div>

          {/* Terms - Below card */}
          <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: '#94A3B8' }}>
            By continuing, you agree to Thynkr's{' '}
            <Link to="/terms" style={{ color: '#64748B' }} className="hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" style={{ color: '#64748B' }} className="hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
