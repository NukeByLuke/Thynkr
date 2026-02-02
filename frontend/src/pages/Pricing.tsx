import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { Check, X, Sparkles, Zap, Crown, ArrowRight, TrendingUp, Brain, Bolt, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import QuoteModal from '@/components/modals/QuoteModal';

type BillingCycle = 'monthly' | 'yearly';

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyMonthlyPrice: number;
  icon: React.ReactNode;
  features: PlanFeature[];
  cta: string;
  highlighted: boolean;
  stripePriceMonthly?: string;
  stripePriceYearly?: string;
}

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

// Debug logging
console.log('Stripe Price IDs:', {
  standard: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STANDARD_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_STANDARD_YEARLY,
  },
  premium: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_MONTHLY,
    yearly: import.meta.env.VITE_STRIPE_PRICE_PREMIUM_YEARLY,
  },
});

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const plans: Plan[] = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Start learning smarter with free AI summaries and flashcards',
      monthlyPrice: 0,
      yearlyMonthlyPrice: 0,
      icon: <Sparkles className="w-6 h-6" />,
      features: [
        { text: 'AI-generated summaries', included: true },
        { text: 'Smart flashcards', included: true },
        { text: 'Basic notes & quizzes', included: true },
        { text: 'Text-to-speech narration', included: true },
        { text: '50 AI requests per month', included: true },
        { text: '10 file uploads per month', included: true },
        { text: 'YouTube video processing', included: false },
        { text: 'Private courses', included: false },
        { text: 'Public course publishing', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      id: 'standard',
      name: 'Standard',
      description: 'Master your courses with personalized notes and faster AI tools',
      monthlyPrice: 4.99,
      yearlyMonthlyPrice: 4.17,
      icon: <Zap className="w-6 h-6" />,
      stripePriceMonthly: STRIPE_PRICES.standard.monthly,
      stripePriceYearly: STRIPE_PRICES.standard.yearly,
      features: [
        { text: 'Everything in Basic', included: true, highlight: true },
        { text: '900% more AI requests', included: true, highlight: true },
        { text: '900% more file uploads', included: true, highlight: true },
        { text: 'YouTube video processing', included: true, highlight: true },
        { text: 'Private courses with share links', included: true },
        { text: 'Enhanced text-to-speech limits', included: true },
        { text: 'Faster AI processing', included: true },
        { text: 'Email support', included: true },
        { text: 'Public course publishing', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Upgrade to Standard',
      highlighted: true,
    },
    {
      id: 'premium',
      name: 'Premium',
      description: 'Transform how you learn with unlimited AI power and advanced features',
      monthlyPrice: 9.99,
      yearlyMonthlyPrice: 8.33,
      icon: <Crown className="w-6 h-6" />,
      stripePriceMonthly: STRIPE_PRICES.premium.monthly,
      stripePriceYearly: STRIPE_PRICES.premium.yearly,
      features: [
        { text: 'Everything in Standard', included: true, highlight: true },
        { text: 'Unlimited AI requests', included: true, highlight: true },
        { text: 'Unlimited file uploads', included: true, highlight: true },
        { text: 'Unlimited YouTube processing', included: true, highlight: true },
        { text: 'Unlimited text-to-speech', included: true, highlight: true },
        { text: 'Public course publishing', included: true },
        { text: 'AI Tutor conversations', included: true },
        { text: 'Priority support', included: true },
        { text: 'Early access to new features', included: true },
      ],
      cta: 'Go Premium',
      highlighted: false,
    },
  ];

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === 'basic') {
      if (!isAuthenticated) {
        navigate('/register');
      }
      return;
    }

    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    const priceId = billingCycle === 'monthly' ? plan.stripePriceMonthly : plan.stripePriceYearly;

    if (!priceId) {
      console.error('No price ID configured for plan:', plan.id, billingCycle);
      toast.error('Configuration error: Price ID not found. Please contact support.');
      return;
    }

    setIsLoading(plan.id);

    try {
      const response = await api.post('/stripe/create-checkout-session', {
        priceId,
        successUrl: `${window.location.origin}/account?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/pricing`,
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Failed to create checkout session:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to start checkout');
    } finally {
      setIsLoading(null);
    }
  };

  const getUserPlanId = (): string | null => {
    if (!user) return null;
    const roleMap: Record<string, string> = {
      BASIC: 'basic',
      STANDARD: 'standard',
      PREMIUM: 'premium',
      // Legacy support
      FREE: 'basic',
      PRO: 'standard',
    };
    return roleMap[user.role] || 'basic';
  };

  const currentPlanId = getUserPlanId();

  const getButtonText = (plan: Plan) => {
    if (!isAuthenticated) return plan.cta;
    if (currentPlanId === plan.id) return 'Current Plan';
    if (plan.id === 'basic') return 'Downgrade';

    const planOrder = ['basic', 'standard', 'premium'];
    const currentIndex = planOrder.indexOf(currentPlanId || 'basic');
    const targetIndex = planOrder.indexOf(plan.id);

    return targetIndex > currentIndex ? plan.cta : 'Switch Plan';
  };

  const isCurrentPlan = (plan: Plan) => currentPlanId === plan.id;

  return (
    <>
      <Helmet>
        <title>Pricing - Thynkr</title>
        <meta
          name="description"
          content="Choose the perfect Thynkr plan for your learning journey. Basic, Standard, and Premium tiers with monthly and yearly billing options."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/50 to-white dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
              Invest in Your <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Success</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-2">
              Choose the plan that fits your learning goals — upgrade anytime.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Every plan includes AI-powered study tools.
            </p>
          </div>

          {/* Billing Toggle and Export Quote */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                Yearly
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    billingCycle === 'yearly'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  Save ~17%
                </span>
              </button>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowQuoteModal(true)}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Export Quote
            </Button>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
            {plans.map((plan) => {
              const price =
                billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyMonthlyPrice;
              const yearlyTotal =
                billingCycle === 'yearly'
                  ? plan.id === 'standard'
                    ? 49.99
                    : plan.id === 'premium'
                      ? 99.99
                      : 0
                  : 0;
              const yearlySavings =
                plan.monthlyPrice > 0 ? (plan.monthlyPrice * 12 - yearlyTotal).toFixed(2) : 0;
              const isCurrent = isCurrentPlan(plan);

              const formatPrice = (p: number) => {
                return p % 1 === 0 ? p.toString() : p.toFixed(2);
              };

              const getCardStyles = () => {
                if (isCurrent) {
                  return 'ring-2 ring-emerald-500/50 bg-white dark:bg-slate-800 shadow-lg';
                }
                if (plan.id === 'standard') {
                  return 'ring-2 ring-violet-500/50 bg-white dark:bg-slate-800 shadow-xl md:scale-[1.02] z-10';
                }
                return 'bg-white dark:bg-slate-800 shadow-md hover:shadow-lg';
              };

              const getBadge = () => {
                if (isCurrent) {
                  return (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg">
                      Current Plan
                    </div>
                  );
                }
                if (plan.id === 'standard') {
                  return (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg flex items-center gap-1">
                      <span>⭐</span> Most Popular
                    </div>
                  );
                }
                if (plan.id === 'premium') {
                  return (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide shadow-lg flex items-center gap-1 whitespace-nowrap">
                      <span>👑</span> Most Powerful
                    </div>
                  );
                }
                return null;
              };

              const getIconStyles = () => {
                if (plan.id === 'standard') {
                  return 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400';
                }
                if (plan.id === 'premium') {
                  return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
                }
                return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
              };

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-6 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all ${getCardStyles()}`}
                >
                  {getBadge()}

                  {/* Plan Header */}
                  <div className="text-center mb-6 pt-2">
                    <div
                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 ${getIconStyles()}`}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-slate-900 dark:text-white">
                        ${formatPrice(price)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">/mo</span>
                    </div>
                    <div className="h-10 flex flex-col justify-center mt-1">
                      {billingCycle === 'yearly' && plan.monthlyPrice > 0 ? (
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            ${yearlyTotal.toFixed(2)} billed yearly
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            Save ${yearlySavings}/year
                          </p>
                        </div>
                      ) : plan.monthlyPrice === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          Free forever
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Billed monthly</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                              feature.highlight
                                ? 'bg-violet-100 dark:bg-violet-900/30'
                                : 'bg-emerald-100 dark:bg-emerald-900/30'
                            }`}
                          >
                            <Check
                              className={`w-3 h-3 ${
                                feature.highlight
                                  ? 'text-violet-600 dark:text-violet-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mt-0.5">
                            <X className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? 'text-slate-700 dark:text-slate-200'
                              : 'text-slate-500 dark:text-slate-400'
                          } ${feature.highlight ? 'font-medium' : ''}`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    variant={
                      isCurrent
                        ? 'secondary'
                        : plan.id === 'premium' || plan.id === 'standard'
                          ? 'primary'
                          : 'secondary'
                    }
                    fullWidth
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isLoading === plan.id}
                    className={`mt-auto ${
                      isCurrent 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 cursor-not-allowed hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                        : ''
                    }`}
                  >
                    {isLoading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        {getButtonText(plan)}
                        {!isCurrent && plan.id !== 'basic' && <ArrowRight className="w-4 h-4" />}
                      </span>
                    )}
                  </Button>

                  <p className="mt-2.5 text-xs text-center text-slate-500 dark:text-slate-400">
                    {plan.id === 'basic' ? 'No credit card required.' : 'Cancel anytime.'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Why Upgrade Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Why Upgrade?
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 mb-3">
                  <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-1.5">
                  <span>📈</span> Faster Learning
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  AI-powered tools help you learn more in less time with personalized study
                  materials.
                </p>
              </div>

              <div className="text-center p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 mb-3">
                  <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-1.5">
                  <span>🧠</span> Smarter Notes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Transform your notes into flashcards, summaries, and quizzes automatically.
                </p>
              </div>

              <div className="text-center p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 mb-3">
                  <Bolt className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 flex items-center justify-center gap-1.5">
                  <span>⚡</span> More Power
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Unlimited uploads, AI requests, and exclusive features to supercharge your
                  studies.
                </p>
              </div>
            </div>

            <div className="text-center mb-12">
              <Button
                variant="primary"
                onClick={() =>
                  !isAuthenticated
                    ? navigate('/register')
                    : document
                        .querySelector('.grid.md\\:grid-cols-3')
                        ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="inline-flex items-center gap-2"
              >
                Join thousands of students using Thynkr
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center border-t border-slate-200 dark:border-slate-700 pt-8">
            <p className="text-slate-600 dark:text-slate-300 mb-2">
              All plans include a 7-day money-back guarantee. Cancel anytime.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Questions? Contact us at{' '}
              <a
                href="mailto:support@thynkr.com"
                className="text-violet-600 dark:text-violet-400 hover:underline"
              >
                support@thynkr.com
              </a>
            </p>
          </div>
        </div>
      </div>

      <QuoteModal isOpen={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </>
  );
}
