import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/Button';
import Input from '@/components/Input';

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
      navigate('/');
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

      <div className="flex items-center justify-center py-24 px-4 relative">
        {/* Background decorations */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-brand-400/20 to-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-gradient-to-br from-accent-400/20 to-accent-600/20 rounded-full blur-3xl" />
        
        <motion.div 
          className="w-full max-w-md relative"
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-glass border border-white/20 dark:border-white/10 p-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Get <span className="gradient-text">Started</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400">Create your free account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-sm border border-red-200/50 dark:border-red-800/50 text-red-600 dark:text-red-400 px-5 py-4 rounded-2xl text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>

              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
              />

              <Input
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="johndoe"
                helperText="3-30 characters, letters, numbers, underscores, and hyphens only"
                required
              />

              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                required
              />

              <Button type="submit" fullWidth isLoading={isLoading}>
                Create Account
              </Button>
            </form>

            <div className="mt-8">
              <div className="text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                </span>
                <Link
                  to="/login"
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold transition-colors duration-250"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
