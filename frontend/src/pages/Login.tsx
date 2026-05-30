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
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    w-full px-4 py-3 border-2 rounded-[2px] transition-colors text-[16px] sm:text-base
    bg-white dark:bg-slate-900
    text-slate-900 dark:text-white 
    border-fuchsia-200 dark:border-cyan-500/30
    placeholder-slate-400 dark:placeholder-slate-500
    focus:outline-none focus:border-fuchsia-500 dark:focus:border-cyan-300 focus:ring-0
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
        <div className="mb-4 md:min-h-[90px] pb-4 border-b-2 border-fuchsia-200 dark:border-cyan-500/25">
          <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-700 dark:text-cyan-300/80">
            Welcome Back
          </p>
          <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">
            Sign in to continue your study flow
          </h1>
        </div>

        <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-gradient-to-br from-fuchsia-50 via-white to-orange-50 dark:from-cyan-500/10 dark:via-slate-900 dark:to-violet-500/10 p-3 sm:p-4">
          {/* OAuth Buttons - Grid layout */}
          <OAuthButtons />

          <OAuthDivider />

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 sm:space-y-4 rounded-[2px] border-2 border-fuchsia-100 dark:border-cyan-500/20 bg-white/70 dark:bg-slate-950/35 p-3 sm:p-4">
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
                className="mt-1.5 text-xs sm:text-sm text-red-500"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur('password')}
                placeholder="Password"
                aria-label="Password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                autoComplete="current-password"
                className={`${inputBaseStyles} pr-11 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 p-1 text-slate-400 transition-colors hover:text-fuchsia-600 dark:text-slate-500 dark:hover:text-cyan-300 focus:outline-none"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="mt-1.5 text-xs sm:text-sm text-red-500"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 cursor-pointer w-full sm:w-auto">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-fuchsia-600 dark:text-cyan-400 rounded-[2px] bg-white dark:bg-slate-900 border-2 border-fuchsia-200 dark:border-cyan-500/30 focus:ring-0"
                aria-label="Remember me"
              />
              <span className="text-sm text-slate-600 dark:text-slate-300">Remember me</span>
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-fuchsia-600 dark:hover:text-cyan-300 transition-colors self-start sm:self-auto"
            >
              Forgot password?
            </Link>
          </div>

          {/* Primary CTA */}
          <button
            type="submit"
            disabled={isLoading}
            aria-label={isLoading ? 'Signing in...' : 'Sign in to your account'}
            className="w-full h-12 flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 dark:from-cyan-500 dark:via-blue-500 dark:to-violet-500 text-white font-semibold rounded-[2px] border-2 border-fuchsia-700 dark:border-cyan-300 transition-colors duration-200 hover:brightness-105 disabled:opacity-70 disabled:cursor-not-allowed"
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
        </div>
      </AuthLayout>
    </>
  );
}
