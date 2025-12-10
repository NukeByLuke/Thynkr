/**
 * Register Page - Thea-inspired clean minimal design
 * Simple, warm, and homey with clean inputs and clear CTAs
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '@/components/OAuthButtons';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      const details = err.response?.data?.details;

      if (details && Array.isArray(details)) {
        setError(`${errorMessage}: ${details.map((d: any) => d.message).join(', ')}`);
      } else if (errorMessage.includes('Username or email already in use')) {
        setError('This username and email are already registered. Please use different credentials or sign in.');
      } else if (errorMessage.includes('Email already in use')) {
        setError('This email is already registered. Please use a different email or sign in.');
      } else if (errorMessage.includes('Username already taken')) {
        setError('This username is already taken. Please choose a different username.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - Thynkr</title>
        <meta
          name="description"
          content="Create your free Thynkr account and start accessing premium AI-powered study tools"
        />
      </Helmet>

      <AuthLayout>
        {/* OAuth Buttons */}
        <div className="space-y-3 mb-4">
          <GoogleSignInButton label="Sign up with Google" />
          <AppleSignInButton label="Sign up with Apple" />
        </div>

        <OAuthDivider />

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">First Name</label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
              />
            </div>
            <div>
              <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
              />
            </div>
          </div>

          <div>
            <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">Email</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
            />
          </div>

          <div>
            <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">Username</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
            />
            <p style={{ color: '#94a3b8' }} className="mt-1 text-xs">
              3-30 characters, letters, numbers, underscores, and hyphens only
            </p>
          </div>

          <div>
            <label style={{ color: '#374151' }} className="block text-sm font-medium mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{ backgroundColor: '#FEF9C3', color: '#1e293b', borderColor: '#e2e8f0' }}
              className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all border"
            />
            <p style={{ color: '#94a3b8' }} className="mt-1 text-xs">
              At least 8 characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          {/* Primary CTA - Purple for Register */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor: '#A78BFA' }}
            className="w-full py-3.5 px-4 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Creating account...' : 'Create free account'}
          </button>

          {/* Secondary CTA - Blue for Sign In */}
          <Link
            to="/login"
            style={{ backgroundColor: '#3B82F6' }}
            className="block w-full py-3.5 px-4 text-white font-medium rounded-xl text-center hover:opacity-90 transition-opacity"
          >
            Sign in instead
          </Link>
        </form>
      </AuthLayout>
    </>
  );
}
