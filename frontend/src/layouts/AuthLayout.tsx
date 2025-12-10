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
    <div className="min-h-screen bg-[#E8EDF3] flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row gap-6 lg:gap-0">
        
        {/* Left Brand Panel - Deep indigo with rounded corners */}
        <motion.div
          className="lg:w-[420px] xl:w-[460px] bg-[#1E1B4B] rounded-3xl flex flex-col items-center justify-between p-8 lg:p-12 min-h-[500px] lg:min-h-[600px]"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Spacer for centering */}
          <div />

          {/* Logo and Tagline - Centered */}
          <div className="flex flex-col items-center text-center">
            {/* Logo Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 relative">
                {/* Decorative sparkles */}
                <svg className="absolute -top-2 -right-1 w-4 h-4 text-pink-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                <svg className="absolute bottom-2 right-0 w-3 h-3 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                </svg>
                {/* Main logo - stylized T with feather */}
                <svg viewBox="0 0 80 80" fill="none" className="w-full h-full">
                  <path 
                    d="M40 10C40 10 55 25 55 45C55 55 48 65 40 70C32 65 25 55 25 45C25 25 40 10 40 10Z" 
                    stroke="white" 
                    strokeWidth="3" 
                    fill="none"
                  />
                  <path 
                    d="M40 20L40 55" 
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />
                  <path 
                    d="M32 30L48 30" 
                    stroke="white" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            
            {/* Brand Name */}
            <h1 className="text-5xl lg:text-6xl font-light text-white tracking-tight mb-6">
              Thynkr
            </h1>
            
            {/* Tagline */}
            <p className="text-white/60 text-lg font-light">
              turning study time into free time
            </p>
          </div>

          {/* Footer Links */}
          <nav className="flex items-center gap-8">
            <Link
              to="/about"
              className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-2"
            >
              About
            </Link>
            <Link
              to="/testimonials"
              className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-2"
            >
              Testimonials
            </Link>
            <Link
              to="/contact"
              className="text-white/60 hover:text-white text-sm font-medium transition-colors duration-200 underline underline-offset-2"
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
          <div className="flex mb-6 bg-[#D4DCE8] rounded-full p-1 w-fit">
            <Link
              to="/login"
              className={`px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                isLogin
                  ? 'bg-[#1E1B4B] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className={`px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ${
                !isLogin
                  ? 'bg-[#1E1B4B] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign up
            </Link>
          </div>

          {/* Form Content */}
          <div className="w-full max-w-[380px]">
            {children}

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed">
              By signing in you agree to Thynkr's{' '}
              <Link to="/terms" className="text-slate-700 hover:underline">
                terms of service
              </Link>
              ,{' '}
              <Link to="/privacy" className="text-slate-700 hover:underline">
                privacy policy
              </Link>
              ,
              <br />
              and cookie usage.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
