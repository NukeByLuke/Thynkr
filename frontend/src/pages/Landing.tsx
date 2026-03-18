import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Check, Quote, Sparkles, Upload, Zap, ChevronDown } from 'lucide-react';

// UI Components
import Button from '@/components/ui/Button';

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
    initials: 'NS',
  },
  {
    quote:
      'The best part is continuity. My flashcards and quiz come from the exact same source, so I stay in context.',
    role: 'Engineering undergrad',
    initials: 'EU',
  },
  {
    quote:
      'When I am tired, this helps me still get a complete study session done instead of skipping it entirely.',
    role: 'Working adult learner',
    initials: 'WL',
  },
];

const stats = [
  { value: '10,000+', label: 'Study packs created' },
  { value: '50,000+', label: 'Hours saved' },
  { value: '95%', label: 'Student satisfaction' },
];

const faqs = [
  {
    question: 'How does Thynkr process my materials?',
    answer:
      'Simply upload your PDFs, slides, or notes. Our AI instantly analyzes the content and generates comprehensive study tools tailored to your material.',
  },
  {
    question: 'What file types do you support?',
    answer:
      'We support PDF, DOCX, PPT, images, and text files. Our platform automatically extracts and processes the content from any format.',
  },
  {
    question: 'Can I customize the study tools?',
    answer:
      'Yes! You can edit summaries, adjust flashcard content, and customize quiz difficulty to match your learning needs.',
  },
  {
    question: 'Is my data private and secure?',
    answer:
      'Absolutely. We use enterprise-grade encryption and never share your study materials. Your data is entirely yours.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

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

      <main id="main-content" className="overflow-hidden">
        {/* Hero Section - Professional and clean */}
        <section className="relative pt-24 pb-32 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-8"
              >
                <Sparkles className="h-4 w-4 text-purple-600 dark:text-blue-400" />
                Intelligent Study Assistant
              </motion.div>

              {/* Main Headline - Serif-inspired with sophistication */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-6xl lg:text-6xl font-bold leading-tight text-slate-900 dark:text-white mb-6 tracking-tight"
              >
                Study <span className="text-purple-700 dark:text-blue-400">intelligently</span> with
                AI
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
              >
                Transform any course material into personalized summaries, flashcards, and quizzes.
                Save hours each week while learning more effectively.
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-lg px-8 text-base"
                  isLoading={isNavigating}
                  onClick={() => handleCTAClick('/register')}
                  aria-label="Get started with Thynkr for free"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-lg px-8 text-base"
                  onClick={() =>
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Learn More
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span>No card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span>10,000+ students</span>
                </div>
              </motion.div>
            </div>

            {/* Hero Visual - Refined product showcase */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-20 max-w-4xl mx-auto"
            >
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xl">
                <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <div className="text-center p-8">
                    <Brain className="h-16 w-16 mx-auto mb-3 text-purple-600 dark:text-blue-400" />
                    <p className="text-slate-500 dark:text-slate-500">Demo video coming soon</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex justify-center mt-12"
            >
              <ChevronDown className="h-5 w-5 text-slate-400" />
            </motion.div>
          </div>
        </section>

        {/* Stats Section - Refined */}
        <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/30 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Real impact from real users
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12 text-center">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-5xl font-bold text-purple-700 dark:text-blue-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Professional cards */}
        <section className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Powerful features for effective learning
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                Everything you need to transform your study experience
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
                    <div className="p-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-blue-400 mb-5">
                        <Icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works Section - Enhanced with colors */}
        <section id="how-it-works" className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Three simple steps
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Get started with Thynkr in minutes
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {studyFlow.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative group"
                >
                  <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-purple-300 dark:hover:border-blue-600 transition-all duration-300 h-full">
                    {/* Step number with gradient background */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 border-2 border-purple-200 dark:border-purple-800 mb-6">
                      <span className="text-2xl font-bold text-purple-700 dark:text-blue-400">
                        {step.step}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {step.detail || step.description}
                    </p>

                    {/* Connector line for desktop */}
                    {index < studyFlow.length - 1 && (
                      <div className="hidden md:block absolute -right-6 top-1/2 transform -translate-y-1/2 w-12 h-1 bg-gradient-to-r from-purple-200 to-transparent dark:from-purple-800 dark:to-transparent" />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                What students are saying
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Real feedback from learners using Thynkr
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 bg-white dark:bg-slate-900/50"
                >
                  <Quote className="h-6 w-6 text-purple-400 dark:text-blue-500 mb-4" />
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed mb-6 text-sm italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm font-semibold text-purple-700 dark:text-blue-400">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Companies & Institutions Section */}
        <section className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Trusted by learning institutions
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Schools and universities transforming student learning outcomes
              </p>
            </div>

            {/* Featured Partner - Red Deer Polytechnic */}
            <div className="mb-16 p-8 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-slate-950">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="h-24 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Logo Placeholder</p>
                      <p className="text-xs text-slate-400">Red Deer Polytechnic</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    Red Deer Polytechnic
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Partnering with Thynkr to enhance student learning outcomes across programs and disciplines.
                  </p>
                  <div className="flex gap-4 text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-medium">📍 Red Deer, Alberta</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Institutions Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300"
                >
                  <div className="h-16 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-4">
                    <p className="text-xs text-slate-400 text-center">Add institution logo</p>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                    Institution {i} - Add details
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 px-6 bg-white dark:bg-slate-950">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Frequently asked questions
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400">
                Everything you need to know about Thynkr
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors duration-300 text-left"
                  >
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {faq.question}
                    </span>
                    <motion.div
                      animate={{ rotate: expandedFAQ === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: expandedFAQ === index ? 'auto' : 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden border-t border-slate-200 dark:border-slate-800"
                  >
                    <p className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                Ready to study smarter?
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-10">
                Join thousands of students who are transforming their learning with AI
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-lg px-8"
                  isLoading={isNavigating}
                  onClick={() => handleCTAClick('/register')}
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-lg px-8"
                  onClick={() => handleCTAClick('/pricing')}
                >
                  View Pricing
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span>Free forever plan</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span>No card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
