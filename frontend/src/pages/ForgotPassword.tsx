import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import Logo from '@/components/Logo';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/auth/password-reset/request', { email });
      setSuccess(true);
      toast.success('Check your email for reset instructions');
    } catch (error: any) {
      // Don't reveal if email exists for security
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-app flex items-center justify-center bg-gradient-to-br from-sunrise-pink/10 via-white to-sunrise-orange/10 dark:from-midnight-violet/10 dark:via-slate-950 dark:to-midnight-cyan/10 p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <Logo variant="full" size="xl" className="justify-center mb-4" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-10 border border-slate-200/50 dark:border-midnight-blue/30">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
                Check Your Email 📧
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-4">
                If an account exists with <span className="font-semibold text-slate-800 dark:text-white">{email}</span>, you'll receive password reset instructions shortly.
              </p>
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-900 dark:text-blue-200 flex items-center justify-center gap-2">
                  <span className="text-lg">💡</span>
                  <span>Check your spam folder if you don't see it within a few minutes</span>
                </p>
              </div>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sunrise-pink to-sunrise-orange dark:from-midnight-cyan dark:to-midnight-violet text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-app flex items-center justify-center bg-gradient-to-br from-sunrise-pink/10 via-white to-sunrise-orange/10 dark:from-midnight-violet/10 dark:via-slate-950 dark:to-midnight-cyan/10 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo variant="full" size="xl" className="justify-center mb-4" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-midnight-blue/30">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ textIndent: '2rem' }}
                  className="relative z-0 w-full pl-4 pr-4 py-3 border border-slate-300 dark:border-midnight-blue/30 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sunrise-pink dark:focus:ring-midnight-cyan focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
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
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-sunrise-pink dark:hover:text-midnight-cyan transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
