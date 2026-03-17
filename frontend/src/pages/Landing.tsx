import { Helmet } from 'react-helmet-async';
import Button from '@/components/ui/Button';
import { ArrowRight, Check } from 'lucide-react';

const studyFlow = [
  {
    step: '01',
    title: 'Upload your material once',
    detail: 'Drop in slides, notes, transcripts, or long readings in one place.',
  },
  {
    step: '02',
    title: 'Get a clean summary fast',
    detail: 'Thynkr turns dense text into short, structured takeaways you can actually review.',
  },
  {
    step: '03',
    title: 'Practice without context switching',
    detail: 'Use flashcards and quizzes based on the same source so your study flow stays coherent.',
  },
];

const summaryOutcomes = [
  'Core concepts distilled into plain language',
  'Key points organized in a consistent structure',
  'Quick review format for busy or low-energy days',
  'Follow-up practice from the same source material',
];

const calmPrinciples = [
  'No noisy dashboards. Just the next step.',
  'Simple UI with clear hierarchy and readable spacing.',
  'Built for overwhelm, not only for perfect study days.',
];

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Thynkr | Study Smarter with AI</title>
        <meta
          name="description"
          content="Thynkr turns overwhelming reading into clear, digestible summaries, flashcards, and quizzes so studying feels manageable again."
        />
      </Helmet>

      <section className="bg-white pb-12 pt-16 dark:bg-slate-950 md:pb-14 md:pt-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            If reading feels overwhelming, start here
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
            Turn heavy reading into clear, easy-to-digest summaries.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
            Thynkr helps you move from "I cannot get through this" to "I understand what matters" by converting long material into concise summaries, flashcards, and quizzes that are easier to review.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" onClick={() => (window.location.href = '/register')}>
              Start free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => (window.location.href = '/login')}>
              I already have an account
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-500" />
              Works with notes, slides, and transcripts
            </span>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-950 md:py-14">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">How it works</h2>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            A simple three-step flow designed for low-friction studying.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {studyFlow.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-950"
              >
                <p className="text-xs font-semibold tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  STEP {item.step}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 dark:bg-slate-950 md:py-14">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="grid gap-6 md:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">What you get after each upload</h3>
              <ul className="mt-5 space-y-3">
                {summaryOutcomes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Why it feels lighter to use</h3>
              <ul className="mt-5 space-y-3">
                {calmPrinciples.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white pb-16 pt-12 dark:border-slate-800 dark:bg-slate-950 md:pb-20 md:pt-14">
        <div className="mx-auto max-w-5xl px-6 lg:px-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950 sm:p-8">
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white md:text-4xl">
              Study with less stress and more clarity.
            </h2>
            <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
              Start free and turn your next difficult reading session into something clear, structured, and finishable.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" onClick={() => (window.location.href = '/register')}>
                Create free account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => (window.location.href = '/pricing')}>
                View plans
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
