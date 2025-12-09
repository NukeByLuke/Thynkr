/**
 * Login Page
 * User authentication with email and password, redirects to study page on success.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
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

      <div className="flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Welcome Back
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
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

            <div className="mt-6">
              <div className="text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Don't have an account? </span>
                <Link
                  to="/register"
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
