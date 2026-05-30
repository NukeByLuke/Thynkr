import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Check,
  ChevronDown,
  Clock,
  Shield,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react';

import Button from '@/components/ui/Button';

const stats = [
  { value: '50K+', label: 'Active students', icon: Users },
  { value: '1M+', label: 'Study packs created', icon: BookOpen },
  { value: '10hrs', label: 'Saved per learner each week', icon: Clock },
  { value: '24/7', label: 'AI study support', icon: Shield },
];

const workflow = [
  {
    step: '01',
    title: 'Upload your source material',
    detail: 'Drop in PDFs, slides, class notes, or transcripts from your lectures.',
  },
  {
    step: '02',
    title: 'Generate your study system',
    detail: 'Thynkr creates summaries, quizzes, flashcards, and a tutor flow from the same source.',
  },
  {
    step: '03',
    title: 'Review with confidence',
    detail: 'Study using active recall tools designed to improve retention before exams.',
  },
];

const featureCards = [
  {
    icon: Upload,
    title: 'Universal Input',
    description: 'One workflow for lecture slides, handouts, chapters, and mixed formats.',
    tone: 'from-pink-500 to-fuchsia-500 dark:from-cyan-500 dark:to-blue-500',
  },
  {
    icon: Brain,
    title: 'Context-Aware AI',
    description: 'Answers and explanations stay grounded in your course material, not generic output.',
    tone: 'from-orange-500 to-rose-500 dark:from-violet-500 dark:to-blue-500',
  },
  {
    icon: Target,
    title: 'Exam-Oriented Practice',
    description: 'Get targeted quizzes and flashcards focused on likely test concepts.',
    tone: 'from-fuchsia-500 to-orange-500 dark:from-cyan-500 dark:to-violet-500',
  },
  {
    icon: Zap,
    title: 'Fast Session Creation',
    description: 'Create structured study sessions in minutes instead of hours of manual prep.',
    tone: 'from-rose-500 to-orange-500 dark:from-blue-500 dark:to-cyan-500',
  },
  {
    icon: TrendingUp,
    title: 'Progress Visibility',
    description: 'Track weak spots over time and focus your revision where it matters most.',
    tone: 'from-pink-500 to-orange-500 dark:from-violet-500 dark:to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Private by Design',
    description: 'Your materials stay protected with secure handling built for academic use.',
    tone: 'from-fuchsia-500 to-pink-500 dark:from-cyan-500 dark:to-violet-500',
  },
];

const useCases = [
  {
    title: 'For students balancing heavy course loads',
    description:
      'Convert dense readings into concise notes and practice sets, so you can spend more time learning and less time formatting content.',
  },
  {
    title: 'For educators building smarter review workflows',
    description:
      'Generate question sets and recap material from teaching assets to support faster class preparation.',
  },
  {
    title: 'For independent learners and certifications',
    description:
      'Structure self-study material into an organized plan with guided review and active recall practice.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Student',
    quote:
      'Thynkr cut my weekly prep time dramatically. I now start each session with clean summaries and focused quiz blocks.',
  },
  {
    name: 'Marcus Williams',
    role: 'Medical Student',
    quote:
      'The AI tutor and generated flashcards help me process large lecture sets quickly without losing depth.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Business Major',
    quote:
      'The workflow feels built for real deadlines. Upload, review, practice, and walk into exams with more confidence.',
  },
];

const faqs = [
  {
    question: 'What can I upload into Thynkr?',
    answer:
      'Thynkr supports common study formats including PDF, DOCX, PPT, images, and text-based materials.',
  },
  {
    question: 'Can I still customize generated content?',
    answer:
      'Yes. You can edit summaries, tune quiz difficulty, and refine flashcard prompts to match your study style.',
  },
  {
    question: 'Is Thynkr suitable for group or class workflows?',
    answer:
      'Yes. Many learners and educators use Thynkr to prepare shared review materials and accelerate study collaboration.',
  },
  {
    question: 'How do you handle data privacy?',
    answer:
      'Your content is processed securely. We design our platform with privacy-focused controls and do not publish your materials.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

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
          content="Turn class materials into summaries, flashcards, quizzes, and AI tutoring flows in minutes with Thynkr."
        />
      </Helmet>

      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-[2px] focus:shadow-lg"
      >
        Skip to main content
      </a>

      <main id="main-content" className="overflow-hidden bg-white dark:bg-slate-950">
        <section className="relative isolate overflow-hidden px-4 sm:px-6 lg:px-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-36 -left-16 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br from-pink-500/25 via-fuchsia-500/20 to-orange-500/20 blur-3xl dark:from-cyan-500/20 dark:via-violet-500/20 dark:to-blue-500/20" />
            <div className="absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-fuchsia-500/20 blur-3xl dark:from-blue-500/20 dark:via-violet-500/20 dark:to-cyan-500/20" />
          </div>

          <div className="relative mx-auto grid max-w-7xl items-center gap-10 py-14 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="space-y-7"
            >
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-gradient-to-r from-pink-50 to-orange-50 px-4 py-2 text-xs font-semibold text-pink-700 dark:border-cyan-500/40 dark:from-cyan-950/40 dark:to-violet-950/40 dark:text-cyan-300">
                <Award className="h-4 w-4" />
                Built for real academic workflows
              </div>

              <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
                Turn class material into a complete study system in minutes.
              </h1>

              <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
                Upload what you already have and generate high-quality summaries, flashcards, quizzes,
                and AI tutoring sessions from one unified workspace.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-[2px] px-8 shadow-md"
                  isLoading={isNavigating}
                  onClick={() => handleCTAClick('/register')}
                >
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-[2px] border-pink-300/70 hover:border-pink-400 hover:bg-pink-50 dark:border-cyan-700 dark:hover:border-cyan-500 dark:hover:bg-cyan-950/30"
                  onClick={() =>
                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  See How It Works
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                <div className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Free plan available
                </div>
                <div className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  No credit card required
                </div>
                <div className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Works on mobile and desktop
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/90 p-4 shadow-[0_24px_90px_-30px_rgba(236,72,153,0.45)] backdrop-blur dark:border-cyan-700/50 dark:bg-slate-900/90 dark:shadow-[0_24px_90px_-40px_rgba(6,182,212,0.55)] sm:p-6">
                <div className="mb-4 flex items-center gap-2 border-b border-pink-100 pb-3 dark:border-slate-700">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="ml-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                    thynkr.ca/study
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-gradient-to-br from-pink-50 to-orange-50 p-4 dark:border-cyan-800/70 dark:from-cyan-950/30 dark:to-violet-950/30">
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-pink-700 dark:bg-slate-900/60 dark:text-cyan-300">
                      <Upload className="h-3.5 w-3.5" />
                      Upload complete
                    </div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      ECON-204 Lecture Pack (36 pages)
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Summary, flashcards, and a 20-question quiz are ready.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-3 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900/80">
                      <Sparkles className="h-4 w-4 text-pink-600 dark:text-cyan-400" />
                      <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Summary</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Key ideas + structure</p>
                    </div>
                    <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-3 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900/80">
                      <Target className="h-4 w-4 text-fuchsia-600 dark:text-violet-400" />
                      <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-100">Flashcards</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Active recall set</p>
                    </div>
                    <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-3 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900/80">
                      <Brain className="h-4 w-4 text-orange-600 dark:text-blue-400" />
                      <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-100">AI Tutor</p>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Ask course-specific questions</p>
                    </div>
                  </div>

                  <div className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-gradient-to-r from-pink-50 to-fuchsia-50 p-3 dark:border-cyan-800/70 dark:from-slate-900 dark:to-slate-900">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Next best action: review Quiz Set B before tomorrow's exam.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-pink-100/80 bg-gradient-to-br from-pink-50/70 via-white to-orange-50/60 px-4 py-10 dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white px-5 py-5 dark:border-cyan-800/70 dark:bg-slate-900"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[2px] bg-gradient-to-br from-pink-500 to-orange-500 text-white dark:from-cyan-500 dark:to-violet-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-pink-50 px-4 py-2 text-xs font-semibold text-pink-700 dark:border-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-300">
                <Sparkles className="h-4 w-4" />
                Workflow
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Professional study output from a simple 3-step flow.
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Designed to reduce prep friction and keep learners focused on understanding, not formatting.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {workflow.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="relative rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-6 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-500 text-sm font-bold text-white dark:from-cyan-500 dark:to-violet-500">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Built for modern study performance.
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Every feature is optimized to move learners from information overload to exam-ready clarity.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featureCards.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.42, delay: index * 0.05 }}
                    className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-6 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900"
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[2px] bg-gradient-to-br ${feature.tone} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {feature.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-gradient-to-br from-pink-50 via-white to-orange-50 p-6 dark:border-cyan-800/70 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-pink-700 dark:bg-cyan-950/40 dark:text-cyan-300">
                <TrendingUp className="h-4 w-4" />
                Who uses Thynkr
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Flexible enough for any serious learner.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                From undergrad courses to certification prep, Thynkr adapts to different learning environments while keeping one clear process.
              </p>
            </div>

            <div className="space-y-4">
              {useCases.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-4 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900"
                >
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Trusted by students across demanding programs.
              </h2>
              <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
                Learners use Thynkr to move faster without sacrificing depth or accuracy.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {testimonials.map((item, index) => (
                <motion.article
                  key={item.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-6 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900"
                >
                  <div className="mb-4 flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">"{item.quote}"</p>
                  <div className="mt-5 border-t border-pink-100 pt-4 dark:border-slate-700">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="mx-auto max-w-4xl rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-white/88 p-6 dark:bg-slate-900/88 backdrop-blur-smborder-cyan-800/70 dark:bg-slate-900 sm:p-8">
            <div className="mb-7">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Frequently asked questions
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Quick answers before you start your first study session.
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = expandedFaqIndex === index;
                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25"
                  >
                    <button
                      onClick={() => setExpandedFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between bg-white px-4 py-4 text-left dark:bg-slate-900"
                    >
                      <span className="pr-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {faq.question}
                      </span>
                      <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      </motion.span>
                    </button>

                    <motion.div
                      initial={false}
                      animate={{ height: isOpen ? 'auto' : 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-pink-100 px-4 py-4 text-sm leading-relaxed text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl rounded-[2px] border-2 border-fuchsia-200 dark:border-cyan-500/25 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-orange-500 px-6 py-10 text-center text-white shadow-[0_20px_80px_-30px_rgba(236,72,153,0.6)] dark:from-cyan-600 dark:via-violet-600 dark:to-blue-600 sm:px-10 sm:py-14">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to make your next study session your strongest one?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/90 sm:text-base">
              Create your workspace, upload your materials, and get a complete AI-powered study stack in minutes.
            </p>

            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-[2px] border border-white/40 bg-white text-pink-700 hover:bg-white/90 dark:text-cyan-700"
                isLoading={isNavigating}
                onClick={() => handleCTAClick('/register')}
              >
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-[2px] border-white/60 text-white hover:bg-white/15 dark:text-white"
                onClick={() => handleCTAClick('/pricing')}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
