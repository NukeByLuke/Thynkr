/**
 * Login Page - Thea-inspired clean minimal design
 * Soft inputs, primary accent button, clean layout
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '@/features/auth/OAuthButtons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In - Thynkr</title>
        <meta
          name="description"
          content="Sign in to your Thynkr account to access premium content and AI-powered study tools"
        />
      </Helmet>

      <AuthLayout>
        {/* OAuth Buttons */}
        <div className="space-y-3 mb-4">
          <GoogleSignInButton />
          <AppleSignInButton />
        </div>

        <OAuthDivider />

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="px-4 py-3 text-sm border"
                style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA', color: '#DC2626', borderRadius: '8px' }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 border transition-all focus:outline-none"
              style={{ 
                backgroundColor: '#FFFFFF', 
                color: '#1F2937', 
                borderColor: '#E5E7EB',
                borderRadius: '12px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#06B6D4';
                e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-4 py-3 border transition-all focus:outline-none"
              style={{ 
                backgroundColor: '#FFFFFF', 
                color: '#1F2937', 
                borderColor: '#E5E7EB',
                borderRadius: '12px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#06B6D4';
                e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#E5E7EB';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 border-gray-300 text-cyan-500 focus:ring-cyan-500/20"
                style={{ borderRadius: '4px' }}
              />
              <span className="text-sm" style={{ color: '#64748B' }}>Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium hover:underline"
              style={{ color: '#64748B' }}
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 px-4 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{ backgroundColor: '#06B6D4', borderRadius: '9999px' }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </AuthLayout>
    </>
  );
}
