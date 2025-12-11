import { CreditCard, Crown, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function BillingSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const planInfo = {
    BASIC: { name: 'Basic', color: 'slate', icon: '✨' },
    STANDARD: { name: 'Standard', color: 'blue', icon: '⚡' },
    PREMIUM: { name: 'Premium', color: 'brand', icon: '👑' },
  };

  const currentPlan = planInfo[user?.role as keyof typeof planInfo] || planInfo.BASIC;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Current Plan
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          Manage your subscription and billing information
        </p>

        <div className="bg-gradient-to-br from-brand-50 to-accent-50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-lg p-6 border border-brand-200 dark:border-brand-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">{currentPlan.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {currentPlan.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Active Plan</p>
              </div>
            </div>
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>

          {user?.role === 'BASIC' && (
            <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
              Upgrade to unlock unlimited AI requests, private courses, and advanced features.
            </p>
          )}

          <button
            onClick={() => navigate('/pricing')}
            className="w-full px-4 py-2 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg hover:from-brand-700 hover:to-accent-700 transition-all font-medium"
          >
            {user?.role === 'BASIC' ? 'Upgrade Plan' : 'Change Plan'}
          </button>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Billing History
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
          View your past invoices and payment history
        </p>

        <div className="text-center py-12">
          <CreditCard className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {user?.role === 'BASIC'
              ? 'No billing history yet. Upgrade to a paid plan to see your invoices here.'
              : 'Your billing history will appear here.'}
          </p>
        </div>
      </div>

      {/* Payment Method */}
      {user?.role !== 'BASIC' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Payment Method
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Manage your payment methods and billing information
          </p>

          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Payment methods are managed through Stripe. Click below to update your payment
              information.
            </p>
            <button className="mt-4 px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Manage Payment Methods
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
