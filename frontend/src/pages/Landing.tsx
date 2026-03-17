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
} from 'lucide-react';

// UI Components
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import GlassCard from '@/components/ui/GlassCard';
import GradientText from '@/components/ui/GradientText';
import BackgroundShapes from '@/components/ui/BackgroundShapes';

const studyFlow = [
  {
    step: '01',
    title: 'Drop your course files in one place',
    detail: 'Upload chapters, lecture slides, and rough notes without needing to clean them first.',
    icon: Upload,
    visualTitle: 'Source stack ready',
    visualRows: ['chapter-08-reading.pdf', 'lecture-slides-week5.pptx', 'messy-midterm-notes.docx'],
  },
  {
    step: '02',
    title: 'Get a "what matters tonight" summary',
    detail: 'Thynkr pulls key ideas and simplifies dense language into a focused game plan.',
    icon: FileText,
    visualTitle: 'Summary output',
    visualRows: [
      '6 key points extracted',
      '3 confusing terms simplified',
      '2 examples rewritten clearly',
    ],
  },
  {
    step: '03',
    title: 'Practice with source-linked flashcards and quizzes',
    detail: 'Study from the same source context so you stop re-reading and start retaining.',
    icon: Brain,
    visualTitle: 'Practice set generated',
    visualRows: [
      '12 flashcards linked to source',
      '8-question quiz with feedback',
      'Weak areas highlighted automatically',
    ],
  },
];

const benefits = [
  'Free to start, no credit card',
  'Save 5+ hours per week',
  '15-minute study sessions',
];

const stats = [
  { value: '10,000+', label: 'Study packs created', icon: Brain },
  { value: '50,000+', label: 'Hours saved', icon: Clock },
  { value: '95%', label: 'Student satisfaction', icon: Heart },
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

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
        <title>Thynkr | Turn Reading into 15-Minute Study Plans</title>
        <meta
          name="description"
          content="Transform overwhelming course reading into focused study packs with AI-generated summaries, flashcards, and quizzes. Save 5+ hours per week."
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
        {/* Hero Section */}
        <div className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-b from-rose-50 via-orange-50/70 to-stone-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
          <BackgroundShapes />

          <div className="relative w-full">
            <div className="max-w-6xl mx-auto px-6 py-20">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="grid lg:grid-cols-2 gap-12 items-center"
              >
                {/* Left: Content */}
                <motion.div variants={itemVariants}>
                  {/* Badge */}
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200/60 dark:border-cyan-500/30 bg-white/90 dark:bg-slate-900/70 backdrop-blur-sm px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                  >
                    <Sparkles className="h-4 w-4 text-brand-600 dark:text-cyan-400" />
                    Hate reading? Start here
                  </motion.span>

                  {/* Headline with gradient emphasis */}
                  <h1
                    id="hero-heading"
                    className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-stone-900 dark:text-white"
                  >
                    Turn tonight&apos;s overwhelming reading into a clear{' '}
                    <GradientText className="text-4xl md:text-5xl lg:text-6xl">
                      15-minute study plan
                    </GradientText>
                  </h1>

                  {/* Subheadline */}
                  <p className="mt-6 text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                    When studying feels way too hard, Thynkr reads first and gives you focused summaries,
                    flashcards, and quizzes from the exact material you uploaded.
                  </p>

                  {/* CTAs */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 flex flex-col sm:flex-row gap-4"
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      className="rounded-full"
                      isLoading={isNavigating}
                      onClick={() => handleCTAClick('/register')}
                      aria-label="Create your free study pack and start learning"
                    >
                      Create my free study pack
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="rounded-full"
                      onClick={() =>
                        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                      }
                    >
                      See how it works
                    </Button>
                  </motion.div>

                  {/* Benefits checklist */}
                  <ul className="mt-8 space-y-3">
                    {benefits.map((benefit, index) => (
                      <motion.li
                        key={benefit}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className="flex items-center gap-3 text-slate-700 dark:text-slate-300"
                      >
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" aria-hidden="true" />
                        <span>{benefit}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Right: Premium Preview */}
                <motion.div variants={itemVariants}>
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Before → After
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-fuchsia-600 via-rose-500 to-orange-500 dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400 px-3 py-1 text-xs font-bold text-white">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-5">
                      <article className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/80">
                        <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-slate-400">
                          Before
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                          62 pages of readings, 3 slide decks, and no idea where to start.
                        </p>
                      </article>

                      <article className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4 dark:border-emerald-600/30 dark:bg-emerald-900/10">
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                          After
                        </p>
                        <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-100">
                          6 key ideas, 12 flashcards, and 1 focused quiz for tonight.
                        </p>
                      </article>
                    </div>

                    <div className="mt-4 grid gap-2 text-xs text-slate-600 dark:text-slate-300 sm:grid-cols-3">
                      <p className="rounded-xl border border-stone-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/85">
                        62 pages uploaded
                      </p>
                      <p className="rounded-xl border border-stone-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/85">
                        11-minute summary
                      </p>
                      <p className="rounded-xl border border-stone-200 bg-white/85 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/85">
                        Quiz ready instantly
                      </p>
                    </div>
                  </GlassCard>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="py-24 bg-gradient-to-b from-transparent to-slate-50/50 dark:to-slate-900/30 border-t border-stone-200/80 dark:border-slate-800/90"
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center max-w-2xl mx-auto mb-16"
            >
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                How it works
              </p>
              <h2
                id="how-it-works-heading"
                className="text-3xl md:text-4xl font-bold text-stone-900 dark:text-white"
              >
                From chaos to clarity in <GradientText>three simple steps</GradientText>
              </h2>
            </motion.div>

            <div className="space-y-12">
              {studyFlow.map((step, index) => {
                const isReversed = index % 2 === 1;
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: isReversed ? 30 : -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5 }}
                  >
                    <GlassCard
                      variant="hover"
                      className={`grid lg:grid-cols-2 gap-8 items-center p-8 ${
                        isReversed ? 'lg:grid-flow-dense' : ''
                      }`}
                    >
                      <div className={isReversed ? 'lg:col-start-2' : ''}>
                        <span className="inline-block text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-cyan-400 mb-2">
                          Step {step.step}
                        </span>
                        <h3 className="text-2xl font-semibold mb-3 text-stone-900 dark:text-white">
                          {step.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>

                      <motion.div
                        className={isReversed ? 'lg:col-start-1 lg:row-start-1' : ''}
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <Card variant="elevated" padding="md" className="bg-white dark:bg-slate-900">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-200">
                              <Icon className="h-5 w-5" />
                            </span>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {step.visualTitle}
                            </p>
                          </div>

                          <div className="mt-4 space-y-2">
                            {step.visualRows.map((row) => (
                              <div
                                key={row}
                                className="rounded-lg border border-stone-200/80 bg-stone-50/70 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                              >
                                {row}
                              </div>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section
          aria-labelledby="testimonials-heading"
          className="py-24 bg-slate-50/50 dark:bg-slate-900/20"
        >
          <div className="max-w-6xl mx-auto px-6">
            <motion.h2
              id="testimonials-heading"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-center mb-12 text-stone-900 dark:text-white"
            >
              Loved by students who needed to study <GradientText>faster</GradientText>
            </motion.h2>

            <motion.div
              className="grid md:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 },
                },
              }}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <Card hover padding="lg" variant="glass" className="h-full flex flex-col">
                    <Quote className="h-8 w-8 text-brand-500 dark:text-cyan-400 mb-4" aria-hidden="true" />
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed flex-1 mb-4">
                      {testimonial.quote}
                    </p>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {testimonial.role}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          aria-labelledby="stats-heading"
          className="py-24 relative overflow-hidden border-y border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-900/50"
        >
          <BackgroundShapes />

          <div className="max-w-6xl mx-auto px-6 relative">
            <h2 id="stats-heading" className="sr-only">
              Platform Statistics
            </h2>

            <motion.div
              className="grid md:grid-cols-3 gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.2 },
                },
              }}
            >
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <motion.div
                    key={stat.label}
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      visible: { opacity: 1, scale: 1 },
                    }}
                  >
                    <GlassCard variant="hover" className="text-center p-8">
                      <Icon className="h-10 w-10 mx-auto mb-4 text-brand-600 dark:text-cyan-400" aria-hidden="true" />
                      <p className="text-4xl font-bold bg-gradient-to-r from-fuchsia-600 via-rose-500 to-orange-500 dark:from-cyan-400 dark:via-blue-400 dark:to-violet-400 bg-clip-text text-transparent">
                        {stat.value}
                      </p>
                      <p className="mt-2 text-slate-600 dark:text-slate-300">{stat.label}</p>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section
          aria-labelledby="final-cta-heading"
          className="py-24 bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-900/50"
        >
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2
                id="final-cta-heading"
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-stone-900 dark:text-white"
              >
                Ready to transform how you study?
              </h2>
              <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are studying smarter, not harder. Get started for free in less
                than 30 seconds.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-full"
                  isLoading={isNavigating}
                  onClick={() => handleCTAClick('/register')}
                  aria-label="Start your free account in 30 seconds"
                >
                  Start free in 30 seconds
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => handleCTAClick('/login')}
                  aria-label="Log in to your existing account"
                >
                  I already have an account
                </Button>
              </div>

              {/* Feature badges */}
              <ul className="mt-8 flex flex-wrap gap-4 justify-center text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  No credit card required
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Free forever plan
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Cancel anytime
                </li>
              </ul>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
