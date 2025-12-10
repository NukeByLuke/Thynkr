/**
 * Register Page - Thea-inspired clean minimal design
 * Soft inputs, primary accent button, clean layout
 * Mirrors login page for visual symmetry
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '@/components/OAuthButtons';

// Input field styling helper
const inputStyle = {
  backgroundColor: '#FFFFFF',
  color: '#1F2937',
  borderColor: '#E5E7EB',
  borderRadius: '12px'
};

const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#06B6D4';
  e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
};

const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#E5E7EB';
  e.target.style.boxShadow = 'none';
};

// Animation variants for micro-interactions
const formVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" as const }
  }
};

const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.25, ease: "easeOut" as const }
  })
};

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
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {/* OAuth Buttons */}
          <div className="space-y-3 mb-4">
            <GoogleSignInButton label="Sign up with Google" />
            <AppleSignInButton label="Sign up with Apple" />
          </div>

          <OAuthDivider />

          {/* Register Form */}
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

            {/* Name fields - side by side */}
            <motion.div 
              className="grid grid-cols-2 gap-3"
              variants={fieldVariants}
              custom={0}
              initial="hidden"
              animate="visible"
            >
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="First name"
                className="w-full px-4 py-3 border transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Last name"
                className="w-full px-4 py-3 border transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </motion.div>

            <motion.div
              variants={fieldVariants}
              custom={1}
              initial="hidden"
              animate="visible"
            >
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Email"
                required
                className="w-full px-4 py-3 border transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </motion.div>

            <motion.div
              variants={fieldVariants}
              custom={2}
              initial="hidden"
              animate="visible"
            >
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Username"
                required
                className="w-full px-4 py-3 border transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </motion.div>

            <motion.div
              variants={fieldVariants}
              custom={3}
              initial="hidden"
              animate="visible"
            >
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                required
                className="w-full px-4 py-3 border transition-all focus:outline-none"
                style={inputStyle}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <p className="mt-1.5 text-xs" style={{ color: '#9CA3AF' }}>
                At least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </motion.div>

            {/* Primary CTA */}
            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 px-4 text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              style={{ backgroundColor: '#06B6D4', borderRadius: '9999px' }}
              variants={fieldVariants}
              custom={4}
              initial="hidden"
              animate="visible"
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Creating account...' : 'Create free account'}
            </motion.button>
          </form>
        </motion.div>
      </AuthLayout>
    </>
  );
}
