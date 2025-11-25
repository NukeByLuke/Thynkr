import { Helmet } from 'react-helmet-async';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { Check } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['Access to free content', 'Community access', 'Basic support'],
      cta: 'Get Started',
      href: '/register',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      features: [
        'Everything in Free',
        'Access to Pro content',
        'Priority support',
        'Monthly webinars',
        'Downloadable resources',
      ],
      cta: 'Upgrade to Pro',
      href: '/register',
      highlighted: true,
    },
    {
      name: 'Premium',
      price: '$49',
      period: '/month',
      features: [
        'Everything in Pro',
        'Access to Premium content',
        '1-on-1 consultations',
        'Early access to new features',
        'Custom learning paths',
        'Certificate of completion',
      ],
      cta: 'Upgrade to Premium',
      href: '/register',
      highlighted: false,
    },
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - Thynkr</title>
        <meta name="description" content="Choose the perfect Thynkr plan for your needs. Free, Pro, and Premium tiers available" />
      </Helmet>

      <div className="bg-gray-50 dark:bg-gray-900 py-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">Choose the plan that's right for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${
                  plan.highlighted 
                    ? 'ring-2 ring-primary-600 dark:ring-primary-500 shadow-xl dark:bg-gray-800' 
                    : 'dark:bg-gray-800'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 right-0 -translate-y-1/2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Popular
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  fullWidth
                  onClick={() => (window.location.href = plan.href)}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
