/**
 * Login Page - Thea-inspired clean minimal design
 * Zod validation, toast notifications, OAuth integration
 * Full light/dark mode support
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { OAuthButtons, OAuthDivider } from '@/features/auth/OAuthButtons';

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
        return err.issues[0]?.message;
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
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof LoginFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
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
      navigate('/study');
    } catch (err: any) {
      // Extract error message from various possible locations
      const errorMessage = 
        err?.response?.data?.error ||  // Axios error response
        err?.response?.data?.message || // Alternative format
        err?.message ||                 // Direct error message
        'Login failed';
      
      if (errorMessage.includes('Invalid credentials')) {
        toast.error('Invalid email or password. Please check your credentials and try again.', { duration: 4000 });
      } else if (errorMessage.includes('OAuth') || errorMessage.includes('Google')) {
        toast.error('This account uses Google Sign-In. Please click "Continue with Google" above.', { duration: 5000 });
      } else if (errorMessage.includes('User not found') || errorMessage.includes('not found')) {
        toast.error('No account found with this email. Please check your email or sign up.', { duration: 4000 });
      } else {
        toast.error(errorMessage, { duration: 4000 });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseStyles = `
    w-full px-4 py-3 border rounded-xl transition-colors
    bg-slate-50 dark:bg-slate-700 
    text-slate-900 dark:text-white 
    border-slate-200 dark:border-slate-600 
    placeholder-slate-400 dark:placeholder-slate-400
    focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
  `;

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
        {/* OAuth Buttons - Grid layout */}
        <OAuthButtons />

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
              className={`${inputBaseStyles} ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
            {errors.email && (
              <p
                id="email-error"
                className="mt-1.5 text-sm text-red-500"
                role="alert"
              >
                {errors.email}
              </p>
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
              className={`${inputBaseStyles} ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
            {errors.password && (
              <p
                id="password-error"
                className="mt-1.5 text-sm text-red-500"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-cyan-500 rounded bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-500 focus:ring-cyan-500/20"
                aria-label="Remember me"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            aria-label={isLoading ? 'Signing in...' : 'Sign in to your account'}
            className="w-full h-12 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
          </button>
        </form>
      </AuthLayout>
    </>
  );
}
