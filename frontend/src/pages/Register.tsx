/**
 * Register Page - Polished signup flow
 * Live username validation, password strength meter, success modal
 */

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { GoogleSignInButton, AppleSignInButton, OAuthDivider } from '@/features/auth/OAuthButtons';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Zod schema for signup validation
const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be at most 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;
type FormErrors = Partial<Record<keyof SignupFormData, string>>;

// Password strength calculation
type PasswordStrength = 'weak' | 'medium' | 'strong' | null;

const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) return null;
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

const strengthColors = {
  weak: { bg: '#FEE2E2', bar: '#EF4444', text: '#DC2626' },
  medium: { bg: '#FEF3C7', bar: '#F59E0B', text: '#D97706' },
  strong: { bg: '#D1FAE5', bar: '#10B981', text: '#059669' },
};

const strengthLabels = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function Register() {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const debouncedUsername = useDebounce(formData.username, 500);
  
  // Password strength
  const passwordStrength = calculatePasswordStrength(formData.password);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Check username availability
  const checkUsername = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    // Validate format first
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const response = await fetch(`${API_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      
      if (data.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch (err) {
      console.error('Username check failed:', err);
      setUsernameStatus('idle');
    }
  }, []);

  // Effect to check username when debounced value changes
  useEffect(() => {
    checkUsername(debouncedUsername);
  }, [debouncedUsername, checkUsername]);

  const validateField = (field: keyof SignupFormData, value: string): string | undefined => {
    try {
      signupSchema.shape[field].parse(value);
      return undefined;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0]?.message;
      }
      return undefined;
    }
  };

  const handleChange = (field: keyof SignupFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error on change if exists
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: keyof SignupFormData) => {
    const value = formData[field];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const result = signupSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof SignupFormData;
        if (!fieldErrors[field]) {
          fieldErrors[field] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // Check username availability
    if (usernameStatus === 'taken') {
      setErrors((prev) => ({ ...prev, username: 'Username is not available' }));
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      await register(formData);
      setShowSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      toast.error(errorMessage, {
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

  const isFormValid = 
    formData.firstName && 
    formData.lastName && 
    formData.email && 
    formData.username.length >= 3 && 
    formData.password.length >= 8 &&
    usernameStatus !== 'taken' &&
    usernameStatus !== 'checking';

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
        <title>Sign Up - Thynkr</title>
        <meta
          name="description"
          content="Create your free Thynkr account and start accessing premium AI-powered study tools"
        />
      </Helmet>

      <AuthLayout>
        <AnimatePresence mode="wait">
          {showSuccess ? (
            /* Success Modal */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#D1FAE5' }}
              >
                <Check className="w-10 h-10 text-emerald-600" />
              </motion.div>
              
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-semibold text-gray-900 mb-2"
              >
                Welcome to Thynkr!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gray-500 mb-8"
              >
                Your account has been created successfully.
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/home')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-12 text-white font-medium rounded-full transition-all"
                style={{ backgroundColor: '#06B6D4' }}
              >
                Go to Dashboard
              </motion.button>
            </motion.div>
          ) : (
            /* Registration Form */
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* OAuth Buttons */}
              <div className="space-y-3 mb-4">
                <GoogleSignInButton label="Sign up with Google" />
                <AppleSignInButton label="Sign up with Apple" />
              </div>

              <OAuthDivider />

              {/* Register Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name fields - side by side */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange('firstName')}
                      onBlur={() => handleBlur('firstName')}
                      placeholder="First name"
                      aria-label="First name"
                      aria-invalid={!!errors.firstName}
                      className={inputBaseStyles}
                      style={getInputStyles(!!errors.firstName)}
                      onFocus={(e) => {
                        if (!errors.firstName) {
                          e.target.style.borderColor = '#06B6D4';
                          e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
                        }
                      }}
                    />
                    {errors.firstName && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-500"
                      >
                        {errors.firstName}
                      </motion.p>
                    )}
                  </div>
                  <div>
                    <input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange('lastName')}
                      onBlur={() => handleBlur('lastName')}
                      placeholder="Last name"
                      aria-label="Last name"
                      aria-invalid={!!errors.lastName}
                      className={inputBaseStyles}
                      style={getInputStyles(!!errors.lastName)}
                      onFocus={(e) => {
                        if (!errors.lastName) {
                          e.target.style.borderColor = '#06B6D4';
                          e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
                        }
                      }}
                    />
                    {errors.lastName && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-xs text-red-500"
                      >
                        {errors.lastName}
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange('email')}
                    onBlur={() => handleBlur('email')}
                    placeholder="Email"
                    aria-label="Email address"
                    aria-invalid={!!errors.email}
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
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-500"
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </div>

                {/* Username with live validation */}
                <div>
                  <div className="relative">
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={handleChange('username')}
                      onBlur={() => handleBlur('username')}
                      placeholder="Username"
                      aria-label="Username"
                      aria-invalid={!!errors.username || usernameStatus === 'taken'}
                      autoComplete="username"
                      className={`${inputBaseStyles} pr-10`}
                      style={getInputStyles(!!errors.username || usernameStatus === 'taken')}
                      onFocus={(e) => {
                        if (!errors.username && usernameStatus !== 'taken') {
                          e.target.style.borderColor = '#06B6D4';
                          e.target.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.1)';
                        }
                      }}
                    />
                    {/* Username status indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && (
                        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                      )}
                      {usernameStatus === 'available' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-5 h-5 text-emerald-500" />
                        </motion.div>
                      )}
                      {usernameStatus === 'taken' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <X className="w-5 h-5 text-red-500" />
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-500"
                    >
                      {errors.username}
                    </motion.p>
                  )}
                  {usernameStatus === 'taken' && !errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-500"
                    >
                      Username is not available
                    </motion.p>
                  )}
                  {usernameStatus === 'available' && !errors.username && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-emerald-600"
                    >
                      Username is available
                    </motion.p>
                  )}
                </div>

                {/* Password with strength meter */}
                <div>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange('password')}
                    onBlur={() => handleBlur('password')}
                    placeholder="Password"
                    aria-label="Password"
                    aria-invalid={!!errors.password}
                    autoComplete="new-password"
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
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-xs text-red-500"
                    >
                      {errors.password}
                    </motion.p>
                  )}
                  
                  {/* Password Strength Meter */}
                  {formData.password && passwordStrength && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ 
                              width: passwordStrength === 'weak' ? '33%' : 
                                     passwordStrength === 'medium' ? '66%' : '100%' 
                            }}
                            className="h-full rounded-full transition-all duration-300"
                            style={{ backgroundColor: strengthColors[passwordStrength].bar }}
                          />
                        </div>
                        <span 
                          className="text-xs font-medium"
                          style={{ color: strengthColors[passwordStrength].text }}
                        >
                          {strengthLabels[passwordStrength]}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Primary CTA */}
                <motion.button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  whileHover={isFormValid && !isLoading ? { scale: 1.01 } : undefined}
                  whileTap={isFormValid && !isLoading ? { scale: 0.99 } : undefined}
                  aria-label={isLoading ? 'Creating account...' : 'Create free account'}
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
                      <span>Creating account...</span>
                    </>
                  ) : (
                    'Create free account'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </AuthLayout>
    </>
  );
}
