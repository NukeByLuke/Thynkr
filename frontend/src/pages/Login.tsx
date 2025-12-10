/**
 * Login Page
 * User authentication with email and password, redirects to study page on success.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import Input from '@/components/Input';

/**
 * Login - User authentication page component
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - Thynkr</title>
        <meta
          name="description"
          content="Sign in to your Thynkr account to access premium content and AI-powered study tools"
        />
      </Helmet>

      <div className="flex items-center justify-center py-24 px-4 relative">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-brand-400/20 to-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-br from-accent-400/20 to-accent-600/20 rounded-full blur-3xl" />
        
        <motion.div 
          className="w-full max-w-md relative"
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-glass border border-white/20 dark:border-white/10 p-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Welcome <span className="gradient-text">Back</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 px-5 py-4 rounded-2xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Sign In
              </Button>
            </form>

            <div className="mt-8">
              <div className="text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Don't have an account? </span>
                <Link
                  to="/register"
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors duration-250"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
