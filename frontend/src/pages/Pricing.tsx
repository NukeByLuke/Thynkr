import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { Check, X, Sparkles, Zap, Crown, ArrowRight, TrendingUp, Brain, Bolt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

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

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState<string | null>(null);
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
        { text: '5 file uploads per month', included: true },
        { text: '50 AI requests per month', included: true },
        { text: 'Private courses', included: false },
        { text: 'AI Tutor Chat', included: false },
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
        { text: 'Private courses with share links', included: true },
        { text: '50 file uploads per month', included: true },
        { text: '500 AI requests per month', included: true },
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
      description: 'Transform how you learn with unlimited AI and personal tutoring',
      monthlyPrice: 9.99,
      yearlyMonthlyPrice: 8.33,
      icon: <Crown className="w-6 h-6" />,
      stripePriceMonthly: STRIPE_PRICES.premium.monthly,
      stripePriceYearly: STRIPE_PRICES.premium.yearly,
      features: [
        { text: 'Everything in Standard', included: true, highlight: true },
        { text: 'Public course publishing', included: true },
        { text: 'Unlimited file uploads', included: true },
        { text: 'Unlimited AI requests', included: true },
        { text: 'Priority support', included: true },
        { text: 'Early access to new features', included: true },
        { text: 'Advanced study analytics', included: true },
        { text: 'Custom course branding', included: true },
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

      <div className="py-24 min-h-screen relative">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-50/50 to-transparent dark:via-slate-900/50 pointer-events-none" />
        <div className="absolute top-20 left-20 w-80 h-80 bg-gradient-to-br from-brand-400/15 to-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-accent-400/15 to-accent-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-8 lg:px-16 relative">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
              Invest in Your <span className="gradient-text">Success</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-100 mb-3 leading-relaxed">
              Choose the plan that fits your learning goals — upgrade anytime.
            </p>
            <p className="text-base text-slate-500 dark:text-slate-200 mb-10">
              Every plan includes AI-powered study tools.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-2 rounded-2xl shadow-soft border border-white/20 dark:border-white/10">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-[background-color,box-shadow,transform] duration-200 active:scale-95 ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow-brand'
                    : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-[background-color,box-shadow,transform] duration-200 active:scale-95 flex items-center gap-2 ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-glow-brand'
                    : 'text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-700/50'
                }`}
              >
                Yearly
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    billingCycle === 'yearly'
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  Save ~17%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
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

              // Format price with proper decimals
              const formatPrice = (p: number) => {
                return p % 1 === 0 ? p.toString() : p.toFixed(2);
              };

              // Define card styles based on plan type
              const getCardStyles = () => {
                if (isCurrent) {
                  return 'ring-2 ring-emerald-500/50 dark:ring-emerald-400/50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-soft-xl';
                }
                if (plan.id === 'standard') {
                  return 'ring-2 ring-brand-500/50 dark:ring-brand-400/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-glow-brand md:scale-105 z-10';
                }
                if (plan.id === 'premium') {
                  return 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-soft-xl hover:shadow-glow-accent';
                }
                return 'bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-soft-lg';
              };

              // Define badge for each plan
              const getBadge = () => {
                if (isCurrent) {
                  return (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                      Current Plan
                    </div>
                  );
                }
                if (plan.id === 'standard') {
                  return (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                      ⭐ Most Popular
                    </div>
                  );
                }
                if (plan.id === 'premium') {
                  return (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-accent-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg whitespace-nowrap">
                      👑 Most Powerful
                    </div>
                  );
                }
                return null;
              };

              // Icon background styles
              const getIconStyles = () => {
                if (plan.id === 'standard') {
                  return 'bg-gradient-to-br from-primary-100 to-blue-100 dark:from-primary-900/50 dark:to-blue-900/50 text-primary-600 dark:text-primary-400';
                }
                if (plan.id === 'premium') {
                  return 'bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/50 dark:to-accent-900/50 text-brand-600 dark:text-brand-400';
                }
                return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
              };

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col p-8 lg:p-10 rounded-3xl border border-white/20 dark:border-slate-700/30 transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-2 ${getCardStyles()}`}
                >
                  {getBadge()}

                  {/* Plan Header */}
                  <div className="text-center mb-6 pt-2">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 shadow-sm ${getIconStyles()}`}
                    >
                      {plan.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-100 leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing with animation */}
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1 transition-all duration-150">
                      <span className="text-5xl font-bold text-slate-900 dark:text-white">
                        ${formatPrice(price)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-100 font-medium">/mo</span>
                    </div>
                    <div className="h-12 flex flex-col justify-center">
                      {billingCycle === 'yearly' && plan.monthlyPrice > 0 ? (
                        <div className="space-y-0.5 animate-fade-in">
                          <p className="text-sm text-slate-600 dark:text-slate-100">
                            ${yearlyTotal.toFixed(2)} billed yearly
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            Save ${yearlySavings}/year
                          </p>
                        </div>
                      ) : plan.monthlyPrice === 0 ? (
                        <p className="text-sm text-slate-600 dark:text-slate-100 font-medium">
                          Free forever
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-200">Billed monthly</p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        {feature.included ? (
                          <div
                            className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                              feature.highlight
                                ? 'bg-primary-100 dark:bg-primary-900/50'
                                : 'bg-green-100 dark:bg-green-900/50'
                            }`}
                          >
                            <Check
                              className={`w-3 h-3 ${
                                feature.highlight
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-green-600 dark:text-green-400'
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            <X className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          </div>
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? 'text-slate-700 dark:text-slate-100'
                              : 'text-slate-500 dark:text-slate-200'
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
                      plan.id === 'premium'
                        ? 'primary'
                        : plan.id === 'standard'
                          ? 'primary'
                          : 'secondary'
                    }
                    fullWidth
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrent || isLoading === plan.id}
                    className={`mt-auto py-3 text-base font-semibold transition-all duration-200 ${
                      isCurrent ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
                    } ${plan.id === 'premium' ? 'bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 border-0 text-white' : ''} ${plan.id === 'basic' ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-0' : ''}`}
                  >
                    {isLoading === plan.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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

                  {/* Microcopy */}
                  <p className="mt-3 text-xs text-center text-slate-500 dark:text-slate-100">
                    {plan.id === 'basic' ? 'No credit card required.' : 'Cancel anytime.'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Why Upgrade Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
                Why Upgrade?
              </span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {/* Faster Learning */}
              <div className="text-center group p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border border-white/20 dark:border-slate-700/30 hover:shadow-soft-xl transition-all duration-150 ease-out">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-4 group-hover:scale-110 transition-transform duration-150">
                  <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  📈 Faster Learning
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-100 leading-relaxed">
                  AI-powered tools help you learn more in less time with personalized study
                  materials.
                </p>
              </div>

              {/* Smarter Notes */}
              <div className="text-center group p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border border-white/20 dark:border-slate-700/30 hover:shadow-soft-xl transition-all duration-150 ease-out">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 mb-4 group-hover:scale-110 transition-transform duration-150">
                  <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  🧠 Smarter Notes
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-100 leading-relaxed">
                  Transform your notes into flashcards, summaries, and quizzes automatically.
                </p>
              </div>

              {/* More Power */}
              <div className="text-center group p-6 rounded-3xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-lg border border-white/20 dark:border-slate-700/30 hover:shadow-soft-xl transition-all duration-150 ease-out">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-accent-100 dark:from-brand-900/30 dark:to-accent-900/30 mb-4 group-hover:scale-110 transition-transform duration-150">
                  <Bolt className="w-8 h-8 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  ⚡ More Power
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-100 leading-relaxed">
                  Unlimited uploads, AI requests, and exclusive features to supercharge your
                  studies.
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-12 text-center">
              <Button
                variant="primary"
                onClick={() =>
                  !isAuthenticated
                    ? navigate('/register')
                    : document
                        .querySelector('.grid.md\\:grid-cols-3')
                        ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="px-8 py-3 text-base font-semibold hover:scale-105 transition-transform duration-200"
              >
                Join thousands of students using Thynkr
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </Button>
            </div>
          </div>

          {/* FAQ or Additional Info */}
          <div className="mt-16 text-center">
            <p className="text-slate-600 dark:text-slate-100 mb-4">
              All plans include a 7-day money-back guarantee. Cancel anytime.
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-200">
              Questions? Contact us at{' '}
              <a
                href="mailto:support@thynkr.com"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                support@thynkr.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
