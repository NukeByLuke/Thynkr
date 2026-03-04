import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import Logo from '@/components/Logo';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await api.get(`/auth/verify-email/${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login?verified=true');
      }, 2000);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.error || 'Failed to verify email');
    }
  };

  return (
    <div className="min-h-app flex items-center justify-center bg-gradient-to-br from-sunrise-pink/10 via-white to-sunrise-orange/10 dark:from-midnight-violet/10 dark:via-slate-950 dark:to-midnight-cyan/10 p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo variant="full" size="xl" className="justify-center mb-4" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-200/50 dark:border-midnight-blue/30">
          <div className="text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-sunrise-pink dark:text-midnight-cyan animate-spin" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Verifying Email...
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Please wait while we verify your email address.
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Email Verified! ✨
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {message}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500">
                  Redirecting to login...
                </p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  Verification Failed
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {message}
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-2 bg-gradient-to-r from-sunrise-pink to-sunrise-orange dark:from-midnight-cyan dark:to-midnight-violet text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Go to Login
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
