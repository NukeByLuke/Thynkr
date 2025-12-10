/**
 * AuthLayout - Thea-inspired clean 2-column layout for login/signup pages
 * Left: Centered brand panel with logo, tagline, and footer links
 * Right: Floating form card with tabs
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
    <div className="light min-h-screen bg-[#E8EDF3] flex items-center justify-center p-4 lg:p-8" data-theme="light">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row gap-6 lg:gap-0">
        
        {/* Left Brand Panel - Deep indigo with rounded corners */}
        <motion.div
          className="lg:w-[420px] xl:w-[460px] rounded-3xl flex flex-col justify-between p-8 lg:p-12 min-h-[500px] lg:min-h-[600px]"
          style={{ backgroundColor: '#1E1B4B' }}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Top - Small logo with brand name */}
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: '#06B6D4' }}
            >
              T
            </div>
            <span className="text-white text-xl font-medium">Thynkr</span>
          </div>

          {/* Center - Tagline */}
          <div className="flex flex-col">
            <h1 className="text-4xl lg:text-5xl font-light text-white tracking-tight leading-tight mb-4">
              <span className="italic">The best AI</span>
              <br />
              <span style={{ color: '#06B6D4' }} className="italic">study tool</span>
            </h1>
            
            <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-base font-light max-w-[280px]">
              Smart study tools powered by AI to help you learn faster and retain more.
            </p>
          </div>

          {/* Footer Links */}
          <nav className="flex items-center gap-8">
            <Link
              to="/about"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              className="hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-2"
            >
              About
            </Link>
            <Link
              to="/testimonials"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              className="hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-2"
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              style={{ color: 'rgba(255,255,255,0.6)' }}
              className="hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-2"
            >
              Contact
            </Link>
          </nav>
        </motion.div>

        {/* Right Form Panel - Floating card */}
        <motion.div
          className="flex-1 flex flex-col items-center lg:items-start lg:pl-8 xl:pl-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Auth Tabs - Pill style */}
          <div className="flex mb-6 rounded-full p-1 w-fit" style={{ backgroundColor: '#D4DCE8' }}>
            <Link
              to="/login"
              className="px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-200"
              style={isLogin 
                ? { backgroundColor: '#1E1B4B', color: '#ffffff' }
                : { backgroundColor: 'transparent', color: '#475569' }
              }
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-200"
              style={!isLogin 
                ? { backgroundColor: '#1E1B4B', color: '#ffffff' }
                : { backgroundColor: 'transparent', color: '#475569' }
              }
            >
              Sign up
            </Link>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-[380px]">
            {children}

            {/* Terms */}
            <p className="mt-6 text-center text-xs leading-relaxed" style={{ color: '#64748b' }}>
              By signing in you agree to Thynkr's{' '}
              <Link to="/terms" style={{ color: '#334155' }} className="hover:underline">
                terms of service
              </Link>
              ,{' '}
              <Link to="/privacy" style={{ color: '#334155' }} className="hover:underline">
                privacy policy
              </Link>
              , and cookie usage.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
