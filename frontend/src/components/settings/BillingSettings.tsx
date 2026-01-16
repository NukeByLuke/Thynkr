import { CreditCard, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function BillingSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const planInfo = {
    BASIC: { name: 'Basic', description: 'Essential features for casual learners' },
    STANDARD: { name: 'Standard', description: 'Advanced tools for serious students' },
    PREMIUM: { name: 'Premium', description: 'Unlimited access to all AI features' },
    ADMIN: { name: 'Admin', description: 'Full system access' },
  };

  const currentPlan = planInfo[user?.role as keyof typeof planInfo] || planInfo.BASIC;

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Subscription</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Manage your subscription plan and billing details.
        </p>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {currentPlan.name} Plan
              </h3>
              {user?.role !== 'BASIC' && (
                <span className="bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 text-xs px-2 py-0.5 rounded-full font-medium border border-brand-200 dark:border-brand-500/30">
                  Active
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {currentPlan.description}
            </p>
          </div>
          
          <div className="shrink-0">
             <Button 
                onClick={() => navigate('/pricing')}
                variant={user?.role === 'BASIC' ? 'primary' : 'outline'}
              >
                {user?.role === 'BASIC' ? 'Upgrade Plan' : 'Change Plan'}
             </Button>
          </div>
        </div>
      </section>

      {user?.role !== 'BASIC' && (
        <>
          <hr className="border-slate-200 dark:border-white/10" />
          
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Payment Method</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Update your payment card and billing address.
            </p>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">Stripe Secure Payment</h4>
                    <p className="text-xs text-slate-500">Managed via Stripe Customer Portal</p>
                  </div>
               </div>
               <Button variant="ghost" size="sm" onClick={() => window.open('https://billing.stripe.com/p/login/test', '_blank')} className="gap-2">
                 Manage <ExternalLink className="w-3 h-3" />
               </Button>
            </div>
          </section>
          
          <hr className="border-slate-200 dark:border-white/10" />

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">Billing History</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Download past invoices and receipts.
            </p>

            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Invoices are emailed to you automatically. <br/>
                    Check your email or the Stripe portal for history.
                </p>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
