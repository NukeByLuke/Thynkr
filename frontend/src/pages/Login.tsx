/**
 * Login Page - Thea-inspired clean minimal design
 * Simple, warm, and homey with clean inputs and clear CTAs
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '@/components/OAuthButtons';

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
                style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}
                className="px-4 py-3 rounded-lg text-sm border"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
              className="w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
            />
          </div>

          <div>
            <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
              className="w-full px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500/20"
              />
              <span style={{ color: '#64748b' }} className="text-sm">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              style={{ color: '#3B82F6' }}
              className="text-sm font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA - Blue */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: '#3B82F6' }}
            className="w-full py-3.5 px-4 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* Secondary CTA - Purple for Register */}
          <Link
            to="/register"
            style={{ backgroundColor: '#C4B5FD', color: '#5B21B6' }}
            className="block w-full py-3.5 px-4 font-medium rounded-xl text-center hover:opacity-90 transition-opacity"
          >
            Create a free account
          </Link>
        </form>
      </AuthLayout>
    </>
  );
}
