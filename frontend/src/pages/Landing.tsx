import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Check,
  Clock,
  FileText,
  Heart,
  Quote,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';

// UI Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const features = [
  {
    icon: Upload,
    title: 'Upload Any Material',
    description: 'PDFs, slides, notes, or recordings—we process them all instantly.',
  },
  {
    icon: Brain,
    title: 'AI-Generated Study Tools',
    description: 'Get summaries, flashcards, and quizzes tailored to your content.',
  },
  {
    icon: Zap,
    title: 'Save Hours Every Week',
    description: 'Focus on learning, not organizing. Study smarter, not harder.',
  },
];

const studyFlow = [
  {
    step: '01',
    title: 'Upload your materials',
    detail: 'Drop in your PDFs, slides, or notes. No organization required.',
  },
  {
    step: '02',
    title: 'AI generates your study pack',
    detail: 'Get summaries, flashcards, and quizzes in minutes.',
  },
  {
    step: '03',
    title: 'Study and retain more',
    description: 'Practice with AI-powered tools built from your own material.',
  },
];

const testimonials = [
  {
    quote:
      'I finally stopped re-reading the same paragraph for an hour. The summary gives me a starting point right away.',
    role: 'First-year nursing student',
  },
  {
    quote:
      'The best part is continuity. My flashcards and quiz come from the exact same source, so I stay in context.',
    role: 'Engineering undergrad',
  },
  {
    quote:
      'When I am tired, this helps me still get a complete study session done instead of skipping it entirely.',
    role: 'Working adult learner',
  },
];

const stats = [
  { value: '10,000+', label: 'Study packs created' },
  { value: '50,000+', label: 'Hours saved' },
  { value: '95%', label: 'Student satisfaction' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCTAClick = (route: string) => {
    setIsNavigating(true);
    navigate(route);
  };

  return (
    <>
      <Helmet>
        <title>Thynkr | AI-Powered Study Tools for Smarter Learning</title>
        <meta
          name="description"
          content="Transform your course materials into AI-generated summaries, flashcards, and quizzes. Save hours every week with Thynkr."
        />
      </Helmet>

      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg"
      >
        Skip to main content
      </a>

      <main id="main-content">
        {/* Hero Section - Clean and professional */}
        <section className="relative pt-20 pb-32 px-6 overflow-hidden bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-brand-200/50 dark:border-cyan-500/20 bg-brand-50/50 dark:bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-brand-700 dark:text-cyan-300 mb-8"
              >
                <Sparkles className="h-4 w-4" />
                AI-Powered Study Assistant
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-slate-900 dark:text-white mb-6"
              >
                Study smarter with{' '}
                <span className="bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                  AI-generated
                </span>{' '}
                study tools
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-3xl mx-auto"
              >
                Upload your course materials and get instant summaries, flashcards, and quizzes.
                Save 5+ hours every week.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full px-8 text-lg"
                  isLoading={isNavigating}
                  onClick={() => handleCTAClick('/register')}
                  aria-label="Get started with Thynkr for free"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full px-8 text-lg"
                  onClick={() =>
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  See How It Works
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  Free to start
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" />
                  10,000+ students
                </div>
              </motion.div>
            </div>

            {/* Hero Visual - Product screenshot placeholder */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-16 max-w-5xl mx-auto"
            >
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-brand-500 dark:text-cyan-400" />
                    <p className="text-slate-600 dark:text-slate-400">Product demo video coming soon</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl font-bold bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-500 dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Everything you need to study effectively
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Powerful AI tools that adapt to your learning style
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card padding="lg" className="h-full text-center hover:shadow-lg transition-shadow duration-300">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-cyan-500/10 dark:to-blue-500/10 text-brand-600 dark:text-cyan-400 mb-6">
                        <Icon className="h-7 w-7" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">{feature.description}</p>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                How Thynkr works
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300">
                Get started in three simple steps
              </p>
            </div>

            <div className="space-y-16">
              {studyFlow.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="flex flex-col md:flex-row gap-8 items-center"
                >
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-block text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-cyan-400 mb-3">
                      Step {step.step}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-lg text-slate-600 dark:text-slate-300">{step.detail}</p>
                  </div>
                  <div className="flex-1">
                    <div className="aspect-square rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <div className="text-6xl font-bold text-slate-300 dark:text-slate-700">
                        {step.step}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Loved by students everywhere
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card padding="lg" className="h-full">
                    <Quote className="h-8 w-8 text-brand-500 dark:text-cyan-400 mb-4" />
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed mb-6">
                      "{testimonial.quote}"
                    </p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {testimonial.role}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
              Ready to transform your study routine?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-10">
              Join thousands of students who are learning smarter with Thynkr
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                size="lg"
                className="rounded-full px-8 text-lg"
                isLoading={isNavigating}
                onClick={() => handleCTAClick('/register')}
              >
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="rounded-full px-8 text-lg"
                onClick={() => handleCTAClick('/pricing')}
              >
                View Pricing
              </Button>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Free forever plan
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
