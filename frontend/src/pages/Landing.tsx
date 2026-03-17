import { Helmet } from 'react-helmet-async';
import Button from '@/components/ui/Button';
import { ArrowRight, Check } from 'lucide-react';

const studyFlow = [
  {
    step: '01',
    title: 'Collect everything in one place',
    detail: 'Upload chapters, lecture slides, notes, and transcripts in a single workspace.',
  },
  {
    step: '02',
    title: 'Generate concise summaries',
    detail: 'Convert dense reading into short, structured takeaways that are easier to retain.',
  },
  {
    step: '03',
    title: 'Review with flashcards and quizzes',
    detail: 'Practice from the same source context so studying feels focused instead of fragmented.',
  },
];

const clarityPoints = [
  'Readable summaries in plain language',
  'Clear key points without extra noise',
  'Flashcards and quizzes linked to the same material',
  'A calmer workflow for heavy reading weeks',
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

      <div className="bg-[#FAFAFA] dark:bg-slate-950">
        <section className="pb-12 pt-16 md:pb-14 md:pt-20">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Built for overwhelming reading loads
                </p>
                <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl lg:text-6xl">
                  Turn heavy reading into clear, easy-to-digest study packs.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
                  When chapters pile up and focus is low, Thynkr helps you break long material into concise summaries, flashcards, and quizzes you can actually finish.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    size="lg"
                    className="!rounded-full !bg-brand-600 !from-brand-600 !via-brand-600 !to-brand-600 !shadow-[0_14px_28px_rgba(192,38,211,0.22)] hover:!-translate-y-0.5 hover:!from-brand-700 hover:!via-brand-700 hover:!to-brand-700"
                    onClick={() => (window.location.href = '/register')}
                  >
                    Start free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="!rounded-full !border-stone-300 !bg-white/80 hover:!bg-white dark:!border-slate-700 dark:!bg-slate-900/70"
                    onClick={() => (window.location.href = '/login')}
                  >
                    I already have an account
                  </Button>
                </div>

                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500" />
                    No credit card required
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-emerald-500" />
                    Upload notes, PDFs, and lecture slides
                  </span>
                </div>
              </div>

              <div className="mx-auto w-full max-w-[520px]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Product UI Preview
                </p>
                <div className="relative mt-3 h-[350px] sm:h-[390px]">
                  <article className="absolute left-0 top-9 w-[78%] rounded-2xl border border-stone-200/90 bg-white/88 p-5 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:border-slate-700/80 dark:bg-slate-900/80">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Summary
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">Chapter 4 in 6 key points</h3>
                    <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                        Main idea and definitions pulled first
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                        Examples simplified into plain language
                      </li>
                    </ul>
                  </article>

                  <article className="absolute right-0 top-0 w-[60%] rounded-2xl border border-stone-200/90 bg-white/92 p-4 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:border-slate-700/80 dark:bg-slate-900/82">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Flashcard
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
                      Q: What does opportunity cost measure?
                    </p>
                    <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                      A: The value of the best alternative you did not choose.
                    </div>
                  </article>

                  <article className="absolute bottom-0 right-4 w-[70%] rounded-2xl border border-stone-200/90 bg-white/92 p-4 backdrop-blur-md shadow-[0_20px_40px_rgba(0,0,0,0.04)] dark:border-slate-700/80 dark:bg-slate-900/84">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                      Quiz
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">
                      Which statement is most accurate?
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-brand-700 dark:border-brand-700 dark:bg-brand-900/30 dark:text-brand-200">
                        Correct: Scarcity exists even with growth.
                      </p>
                      <p className="rounded-lg border border-stone-200 px-3 py-2 dark:border-slate-700">
                        Review explanation and source line
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-stone-200/80 py-12 dark:border-slate-800/90 md:py-14">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="grid gap-4 md:grid-cols-3">
              {studyFlow.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-stone-200 bg-white/80 p-5 dark:border-slate-700 dark:bg-slate-900/45"
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

        <section className="py-12 md:py-14">
          <div className="mx-auto max-w-6xl px-6 lg:px-10">
            <div className="grid gap-6 md:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-xl border border-stone-200 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/45">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white md:text-3xl">
                  Designed to feel calm, even during crunch time.
                </h2>
                <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                  Thynkr keeps the interface intentionally clean so you can move from reading to understanding without fighting the tool.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {clarityPoints.map((point) => (
                    <p key={point} className="inline-flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{point}</span>
                    </p>
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-stone-200 bg-white/80 p-6 dark:border-slate-700 dark:bg-slate-900/45">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Start where you are</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  You do not need perfect focus or perfect notes. Upload what you have, get a clear starting point, and build momentum one session at a time.
                </p>

                <div className="mt-6 flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="!rounded-full !bg-brand-600 !from-brand-600 !via-brand-600 !to-brand-600 hover:!from-brand-700 hover:!via-brand-700 hover:!to-brand-700"
                    onClick={() => (window.location.href = '/register')}
                  >
                    Create free account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="!rounded-full !border-stone-300 !bg-white/80 hover:!bg-white dark:!border-slate-700 dark:!bg-slate-900/70"
                    onClick={() => (window.location.href = '/pricing')}
                  >
                    View plans
                  </Button>
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
