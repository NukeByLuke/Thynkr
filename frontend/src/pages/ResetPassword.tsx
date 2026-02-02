import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import Logo from '@/components/Logo';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Invalid reset link');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/password-reset/confirm', { token, password });
      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login?reset=true');
      }, 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sunrise-pink/10 via-white to-sunrise-orange/10 dark:from-midnight-violet/10 dark:via-slate-950 dark:to-midnight-cyan/10 p-4">
        <div className="max-w-md w-full text-center">
          <Logo variant="full" size="xl" className="justify-center mb-8" />
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-midnight-blue/30">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Invalid Reset Link
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-sunrise-pink to-sunrise-orange dark:from-midnight-cyan dark:to-midnight-violet text-white rounded-lg hover:shadow-lg transition-all"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sunrise-pink/10 via-white to-sunrise-orange/10 dark:from-midnight-violet/10 dark:via-slate-950 dark:to-midnight-cyan/10 p-4">
        <div className="max-w-md w-full text-center">
          <Logo variant="full" size="xl" className="justify-center mb-8" />
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-midnight-blue/30">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Password Reset! ✨
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Your password has been successfully reset.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-500">
              Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sunrise-pink/10 via-white to-sunrise-orange/10 dark:from-midnight-violet/10 dark:via-slate-950 dark:to-midnight-cyan/10 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo variant="full" size="xl" className="justify-center mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Reset Password
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Enter your new password below
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-midnight-blue/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-midnight-blue/30 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sunrise-pink dark:focus:ring-midnight-cyan focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Must be at least 8 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-midnight-blue/30 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sunrise-pink dark:focus:ring-midnight-cyan focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-gradient-to-r from-sunrise-pink to-sunrise-orange dark:from-midnight-cyan dark:to-midnight-violet text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
