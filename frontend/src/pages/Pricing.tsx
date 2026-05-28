import { useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowRight,
  Check,
  Crown,
  FileText,
  GraduationCap,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import QuoteModal from '@/components/modals/QuoteModal';

type BillingCycle = 'monthly' | 'yearly';
type PlanId = 'basic' | 'standard' | 'premium';

type PlanFeature = {
  label: string;
  included: boolean;
  emphasis?: boolean;
};

interface Plan {
  id: PlanId;
  name: string;
  subtitle: string;
  description: string;
  icon: ReactNode;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  yearlyTotal: number;
  cta: string;
  priceIds?: {
    monthly?: string;
    yearly?: string;
  };
  features: PlanFeature[];
}

interface ComparisonRow {
  feature: string;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

const PLAN_ORDER: PlanId[] = ['basic', 'standard', 'premium'];
const ANNUAL_DISCOUNT = 17;

const BASIC_STORAGE_GB = 1;
const BASIC_AI_REQUESTS = 25;
const STANDARD_STORAGE_GB = 10;
const STANDARD_AI_REQUESTS = 500;
const BASIC_MAX_STORED_FILES = 30;
const STANDARD_MAX_STORED_FILES = 150;
const PREMIUM_MAX_STORED_FILES = 1000;

const STRIPE_PRICES = {
  standard: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STANDARD_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_STANDARD_YEARLY,
  },
  premium: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_YEARLY,
  },
};

function percentMore(base: number, target: number): number {
  if (base <= 0) return 0;
  return Math.round(((target - base) / base) * 100);
}

function formatLiftCopy(base: number, target: number, label: string): string {
  const percent = percentMore(base, target);

  if (percent >= 1000) {
    const multiplier = target / Math.max(base, 1);
    const displayMultiplier = Number.isInteger(multiplier) ? String(multiplier) : multiplier.toFixed(1);
    return `${displayMultiplier}x more ${label} than Basic`;
  }

  return `${percent}% more ${label} than Basic`;
}

const uploadLiftCopy = formatLiftCopy(BASIC_STORAGE_GB, STANDARD_STORAGE_GB, 'storage space');
const aiLiftCopy = formatLiftCopy(BASIC_AI_REQUESTS, STANDARD_AI_REQUESTS, 'AI requests');

const PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    subtitle: 'Strict free starter',
    description: 'Built to prove value fast while keeping clear monthly limits.',
    icon: <Sparkles className="h-5 w-5" />,
    monthlyPrice: 0,
    yearlyMonthlyPrice: 0,
    yearlyTotal: 0,
    cta: 'Get Started Free',
    features: [
      { label: `${BASIC_AI_REQUESTS} AI requests per month`, included: true },
        { label: `${BASIC_STORAGE_GB}GB storage capacity`, included: true },
      { label: `Up to ${BASIC_MAX_STORED_FILES} stored files total`, included: true },
      { label: 'AI summaries, notes, quizzes, and flashcards', included: true },
      { label: 'Limited text-to-speech access', included: true },
      { label: 'Email support access', included: true },
      { label: 'Private courses', included: false },
      { label: 'YouTube processing', included: false },
      { label: 'AI Tutor', included: false },
      { label: 'Public course publishing', included: false },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    subtitle: 'Best value for most students',
    description: 'High-volume study capacity with private workflows at a low monthly price.',
    icon: <Zap className="h-5 w-5" />,
    monthlyPrice: 4.99,
    yearlyMonthlyPrice: 4.17,
    yearlyTotal: 49.99,
    cta: 'Upgrade to Standard',
    priceIds: {
      monthly: STRIPE_PRICES.standard.monthly,
      yearly: STRIPE_PRICES.standard.yearly,
    },
    features: [
      { label: 'Everything in Basic', included: true, emphasis: true },
      { label: uploadLiftCopy, included: true, emphasis: true },
      { label: aiLiftCopy, included: true, emphasis: true },
      { label: `Up to ${STANDARD_MAX_STORED_FILES} stored files total`, included: true },
      { label: 'Private courses with share links', included: true },
      { label: 'Higher text-to-speech limits', included: true },
      { label: 'Email support access', included: true },
      { label: 'YouTube processing', included: false },
      { label: 'AI Tutor', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Unlimited + advanced AI',
    description: 'For power users who need unlimited throughput and premium compute features.',
    icon: <Crown className="h-5 w-5" />,
    monthlyPrice: 9.99,
    yearlyMonthlyPrice: 8.33,
    yearlyTotal: 99.99,
    cta: 'Go Premium',
    priceIds: {
      monthly: STRIPE_PRICES.premium.monthly,
      yearly: STRIPE_PRICES.premium.yearly,
    },
    features: [
      { label: 'Everything in Standard', included: true, emphasis: true },
      { label: 'Unlimited AI requests', included: true, emphasis: true },
      { label: 'Unlimited storage', included: true, emphasis: true },
      { label: 'Unlimited text-to-speech', included: true, emphasis: true },
      { label: `Up to ${PREMIUM_MAX_STORED_FILES.toLocaleString()} stored files total`, included: true },
      { label: 'AI Tutor conversations', included: true },
      { label: 'YouTube video processing', included: true },
      { label: 'Public course publishing', included: true },
      { label: 'Priority email support', included: true },
    ],
  },
];

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    feature: 'AI requests / month',
    basic: BASIC_AI_REQUESTS.toString(),
    standard: STANDARD_AI_REQUESTS.toString(),
    premium: 'Unlimited',
  },
  {
    feature: 'Storage capacity',
    basic: `${BASIC_STORAGE_GB}GB`,
    standard: `${STANDARD_STORAGE_GB}GB`,
    premium: 'Unlimited',
  },
  {
    feature: 'Max stored files',
    basic: BASIC_MAX_STORED_FILES.toString(),
    standard: STANDARD_MAX_STORED_FILES.toString(),
    premium: PREMIUM_MAX_STORED_FILES.toLocaleString(),
  },
  { feature: 'Text-to-speech', basic: 'Limited', standard: 'Higher limits', premium: 'Unlimited' },
  { feature: 'Private courses', basic: false, standard: true, premium: true },
  { feature: 'Public course publishing', basic: false, standard: false, premium: true },
  { feature: 'YouTube processing', basic: false, standard: false, premium: true },
  { feature: 'AI Tutor', basic: false, standard: false, premium: true },
  { feature: 'Support level', basic: 'Email', standard: 'Email', premium: 'Priority email' },
];

function formatPrice(price: number): string {
  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

function renderComparisonValue(value: string | boolean) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>;
  }

  return value ? (
    <Check className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
  ) : (
    <X className="mx-auto h-4 w-4 text-rose-500 dark:text-rose-400" />
  );
}

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState<PlanId | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const getUserPlanId = (): PlanId | null => {
    if (!user) return null;

    const roleMap: Record<string, PlanId> = {
      BASIC: 'basic',
      STANDARD: 'standard',
      PREMIUM: 'premium',
      FREE: 'basic',
      PRO: 'standard',
    };

    return roleMap[user.role] || 'basic';
  };

  const currentPlanId = getUserPlanId();

  const getButtonText = (plan: Plan): string => {
    if (!isAuthenticated) return plan.cta;
    if (currentPlanId === plan.id) return 'Current Plan';
    if (plan.id === 'basic') return 'Manage in Account';

    const currentIndex = PLAN_ORDER.indexOf(currentPlanId || 'basic');
    const targetIndex = PLAN_ORDER.indexOf(plan.id);

    if (targetIndex > currentIndex) return plan.cta;
    return `Switch to ${plan.name}`;
  };

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === 'basic') {
      if (!isAuthenticated) {
        navigate('/register');
        return;
      }

      navigate('/account');
      return;
    }

    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    if (currentPlanId === plan.id) {
      return;
    }

    const priceId = billingCycle === 'monthly' ? plan.priceIds?.monthly : plan.priceIds?.yearly;

    if (!priceId) {
      toast.error('Pricing configuration is missing for this plan. Please contact support.');
      return;
    }

    setIsLoading(plan.id);

    try {
      const response = await api.post('/stripe/create-checkout-session', {
        priceId,
        successUrl: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      throw new Error('Checkout URL was not returned by the server');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Pricing - Thynkr</title>
        <meta
          name="description"
          content="Professional plan pricing with strict free limits, high-value upgrades, and clear feature comparison."
        />
      </Helmet>

      <div className="min-h-app bg-slate-50 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-10">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <GraduationCap className="h-3.5 w-3.5" />
              Plans built for conversion and retention
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Choose the right plan for your study volume
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
              Free gives students a real trial with strict limits. Standard delivers major capacity gains at a low price.
              Premium unlocks high-cost compute features for users who need unlimited power.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    billingCycle === 'monthly'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('yearly')}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    billingCycle === 'yearly'
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  Yearly
                </button>
                <span className="rounded-lg bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                  Save {ANNUAL_DISCOUNT}%
                </span>
              </div>
              <Button
                variant="secondary"
                onClick={() => setShowQuoteModal(true)}
                className="inline-flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Quote
              </Button>
            </div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const isRecommended = plan.id === 'standard';
              const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyMonthlyPrice;
              const yearlySavings = plan.monthlyPrice > 0 ? plan.monthlyPrice * 12 - plan.yearlyTotal : 0;

              return (
                <article
                  key={plan.id}
                  className={`relative flex h-full flex-col rounded-3xl border p-6 shadow-sm ${
                    isCurrent
                      ? 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-900/20'
                      : isRecommended
                      ? 'border-cyan-300 bg-cyan-50/60 dark:border-cyan-500/40 dark:bg-cyan-950/20'
                      : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                      Current Plan
                    </span>
                  )}
                  {!isCurrent && isRecommended && (
                    <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                      Best Value
                    </span>
                  )}

                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h2>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {plan.subtitle}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      {plan.icon}
                    </div>
                  </div>

                  <p className="mb-5 min-h-[48px] text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {plan.description}
                  </p>

                  <div className="mb-5 border-y border-slate-200/80 py-4 dark:border-white/10">
                    <p className="flex items-end gap-1 text-slate-900 dark:text-white">
                      <span className="text-4xl font-bold leading-none">${formatPrice(displayPrice)}</span>
                      <span className="pb-1 text-sm text-slate-500 dark:text-slate-400">/month</span>
                    </p>
                    {plan.monthlyPrice === 0 ? (
                      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">Free forever. No card required.</p>
                    ) : billingCycle === 'yearly' ? (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        ${plan.yearlyTotal.toFixed(2)} billed yearly. Save ${yearlySavings.toFixed(2)} per year.
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Billed monthly. Cancel anytime.</p>
                    )}
                  </div>

                  <ul className="mb-6 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature.label} className="flex items-start gap-2.5 text-sm">
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                            feature.included
                              ? feature.emphasis
                                ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300'
                          }`}
                        >
                          {feature.included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        </span>
                        <span
                          className={`leading-6 ${
                            feature.included
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-slate-500 dark:text-slate-400'
                          } ${feature.emphasis ? 'font-semibold' : ''}`}
                        >
                          {feature.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    fullWidth
                    variant={isCurrent ? 'secondary' : plan.id === 'basic' ? 'secondary' : 'primary'}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isLoading === plan.id}
                    className={isCurrent ? 'cursor-not-allowed border-emerald-300 dark:border-emerald-700' : ''}
                  >
                    {isLoading === plan.id ? (
                      'Processing...'
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        {getButtonText(plan)}
                        {!isCurrent && plan.id !== 'basic' && <ArrowRight className="h-4 w-4" />}
                      </span>
                    )}
                  </Button>
                  <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    {plan.id === 'basic' ? 'Great for trying Thynkr.' : 'Secure Stripe checkout.'}
                  </p>
                </article>
              );
            })}
          </section>

          <section className="mt-10 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-8">
            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Full feature comparison
            </h2>
            <p className="mb-5 text-sm text-slate-600 dark:text-slate-300">
              Clear checks and limits so students know exactly what they get before they subscribe.
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr>
                    <th className="border-b border-slate-200 pb-3 pr-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Feature
                    </th>
                    <th className="border-b border-slate-200 pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Basic
                    </th>
                    <th className="border-b border-slate-200 pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Standard
                    </th>
                    <th className="border-b border-slate-200 pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-white/10 dark:text-slate-400">
                      Premium
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.feature}>
                      <td className="border-b border-slate-100 py-3 pr-4 text-sm text-slate-700 dark:border-white/5 dark:text-slate-200">
                        {row.feature}
                      </td>
                      <td className="border-b border-slate-100 py-3 text-center dark:border-white/5">
                        {renderComparisonValue(row.basic)}
                      </td>
                      <td className="border-b border-slate-100 py-3 text-center dark:border-white/5">
                        {renderComparisonValue(row.standard)}
                      </td>
                      <td className="border-b border-slate-100 py-3 text-center dark:border-white/5">
                        {renderComparisonValue(row.premium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="mt-10 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300">
            Questions about plans or billing? Contact{' '}
            <a href="mailto:support@thynkr.ca" className="font-semibold text-cyan-700 hover:underline dark:text-cyan-300">
              support@thynkr.ca
            </a>
            .
          </footer>
        </div>
      </div>
      <QuoteModal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </>
  );
}
