/**
 * Register Page - Polished signup flow
 * Live username validation, password strength meter, success modal
 * Full light/dark mode support
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import { OAuthButtons, OAuthDivider } from '@/features/auth/OAuthButtons';

// Zod schema for signup validation
const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
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

const strengthLabels = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
};

export default function Register() {
  const [formData, setFormData] = useState<SignupFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Password strength
  const passwordStrength = calculatePasswordStrength(formData.password);
  
  const { register } = useAuth();
  const navigate = useNavigate();

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

    setErrors({});
    setIsLoading(true);

    try {
      await register(formData);
      setShowSuccess(true);
    } catch (err: any) {
      const status = err.response?.status;
      const errorMessage = err.response?.data?.error || err.message || 'Registration failed';
      
      // Handle 409 Conflict - Email already exists
      if (status === 409) {
        setErrors((prev) => ({ ...prev, email: 'That email is already in use.' }));
        return;
      }
      
      // Handle 500 and other server errors with global toast
      if (status >= 500 || !status) {
        toast.error('Something went wrong. Please try again.', {
          duration: 4000,
          icon: '⚠️',
        });
        return;
      }
      
      // Handle other errors
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
    formData.password.length >= 8;

  const inputBaseStyles = `
    w-full px-4 py-3 border rounded-lg transition-colors
    bg-slate-50 dark:bg-slate-700 
    text-slate-900 dark:text-white 
    border-slate-200 dark:border-slate-600 
    placeholder-slate-400 dark:placeholder-slate-400
    focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20
  `;

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
        {showSuccess ? (
          /* Success Modal */
          <div className="text-center py-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/50">
              <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2 text-slate-900 dark:text-white">
              Welcome to THYNKR!
            </h2>
            
            <p className="mb-8 text-slate-500 dark:text-slate-400">
              Your account has been created successfully.
            </p>
            
            <button
              onClick={() => navigate('/study')}
              className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-full transition-colors"
            >
              Go to Study
            </button>
          </div>
        ) : (
          /* Registration Form */
          <div>
            {/* OAuth Buttons - Grid layout */}
            <OAuthButtons />

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
                    className={`${inputBaseStyles} ${errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.firstName}
                    </p>
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
                    className={`${inputBaseStyles} ${errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.lastName}
                    </p>
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
                  className={`${inputBaseStyles} ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email}
                  </p>
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
                  className={`${inputBaseStyles} ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password}
                  </p>
                )}
                  
                {/* Password Strength Meter */}
                {formData.password && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-600 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-150 ${
                            passwordStrength === 'weak' ? 'w-1/3 bg-red-500' :
                            passwordStrength === 'medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-cyan-500'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength === 'weak' ? 'text-red-500' :
                        passwordStrength === 'medium' ? 'text-amber-500' : 'text-cyan-500'
                      }`}>
                        {strengthLabels[passwordStrength]}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Primary CTA */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                aria-label={isLoading ? 'Creating account...' : 'Create free account'}
                className="w-full h-12 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-cyan-500"
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
              </button>
            </form>
          </div>
        )}
      </AuthLayout>
    </>
  );
}
