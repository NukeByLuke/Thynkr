/**
 * Login Page - Thea-inspired clean minimal design
 * Zod validation, toast notifications, OAuth integration
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '@/features/auth/OAuthButtons';

// Zod schema for login validation
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type FormErrors = Partial<Record<keyof LoginFormData, string>>;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateField = (field: keyof LoginFormData, value: string): string | undefined => {
    try {
      loginSchema.shape[field].parse(value);
      return undefined;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0]?.message;
      }
      return undefined;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: validateField('email', value) }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: validateField('password', value) }));
    }
  };

  const handleBlur = (field: keyof LoginFormData) => {
    const value = field === 'email' ? email : password;
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = loginSchema.safeParse({ email, password });
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await login({ email, password });
      toast.success('Welcome back!', { duration: 2000 });
      // Fade transition to dashboard
      navigate('/home');
    } catch (err: any) {
      toast.error('Invalid credentials. Please try again.', {
        duration: 4000,
        style: {
          background: '#FEF2F2',
          color: '#DC2626',
          border: '1px solid #FECACA',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseStyles = `
    w-full px-4 py-3 border transition-all duration-200 focus:outline-none
    bg-white text-gray-900 rounded-xl
  `;

  const getInputStyles = (hasError: boolean) => ({
    borderColor: hasError ? '#EF4444' : '#E5E7EB',
    boxShadow: hasError ? '0 0 0 2px rgba(239, 68, 68, 0.1)' : 'none',
  });

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
        {/* OAuth Buttons - appear first */}
        <div className="space-y-3 mb-4">
          <GoogleSignInButton />
          <AppleSignInButton />
        </div>

        <OAuthDivider />

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={() => handleBlur('email')}
              placeholder="Email"
              aria-label="Email address"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              autoComplete="email"
              className={inputBaseStyles}
              style={getInputStyles(!!errors.email)}
              onFocus={(e) => {
                if (!errors.email) {
                  e.target.style.borderColor = '#06B6D4';
                  e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
                }
              }}
            />
            {errors.email && (
              <motion.p
                id="email-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-sm text-red-500"
                role="alert"
              >
                {errors.email}
              </motion.p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={() => handleBlur('password')}
              placeholder="Password"
              aria-label="Password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              autoComplete="current-password"
              className={inputBaseStyles}
              style={getInputStyles(!!errors.password)}
              onFocus={(e) => {
                if (!errors.password) {
                  e.target.style.borderColor = '#06B6D4';
                  e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
                }
              }}
            />
            {errors.password && (
              <motion.p
                id="password-error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 text-sm text-red-500"
                role="alert"
              >
                {errors.password}
              </motion.p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 border-gray-300 text-cyan-500 focus:ring-cyan-500/20 rounded"
                aria-label="Remember me"
              />
              <span className="text-sm text-gray-500">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-gray-500 hover:text-gray-700 hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA */}
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={!isLoading ? { scale: 1.01 } : undefined}
            whileTap={!isLoading ? { scale: 0.99 } : undefined}
            aria-label={isLoading ? 'Signing in...' : 'Sign in to your account'}
            className="w-full h-12 flex items-center justify-center gap-2 text-white font-medium rounded-full transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#06B6D4' }}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </motion.button>
        </form>
      </AuthLayout>
    </>
  );
}
