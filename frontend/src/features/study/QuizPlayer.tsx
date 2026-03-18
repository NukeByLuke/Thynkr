/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Zap,
  Volume2,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
  Shuffle,
  ShieldCheck,
  ArrowRightLeft,
  TimerReset,
} from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { playCorrectAnswerDing } from '@/utils/quizSounds';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

interface QuizPlayerProps {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  fileId?: string;
  onGenerateQuiz?: (difficulty: string, numQuestions: number) => void;
  isGenerating?: boolean;
  onSubmit: (answers: Record<string, string>, timeSpentSeconds?: number, questionTimings?: Record<string, number>) => Promise<any>;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type TimeLimit = 'endless' | '5m' | '10m' | '15m' | '20m';
type FeedbackMode = 'instant' | 'end';
type NavigationMode = 'free' | 'locked';
type AttemptPreset = 'practice' | 'exam' | 'custom';

interface QuizSettings {
  difficulty: Difficulty;
  timeLimit: TimeLimit;
  feedbackMode: FeedbackMode;
  navigationMode: NavigationMode;
  shuffleQuestions: boolean;
}

const normalizeOptionText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const timeLimitToSeconds = (value: TimeLimit): number | null => {
  if (value === 'endless') return null;
  return parseInt(value, 10) * 60;
};

const shuffleOnce = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const canonicalizeQuestion = (question: QuizQuestion, index: number): QuizQuestion => {
  const seen = new Set<string>();
  const cleanedOptions = (Array.isArray(question.options) ? question.options : [])
    .map((option) => normalizeOptionText(String(option || '')))
    .filter((option) => {
      if (!option) return false;
      const key = option.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const normalizedCorrect = normalizeOptionText(String(question.correctAnswer || ''));
  const matchedCorrect = cleanedOptions.find(
    (option) => option.toLowerCase() === normalizedCorrect.toLowerCase()
  );

  const finalCorrect = matchedCorrect || normalizedCorrect || cleanedOptions[0] || '';
  const hasCorrectOption = cleanedOptions.some(
    (option) => option.toLowerCase() === finalCorrect.toLowerCase()
  );

  const options = hasCorrectOption
    ? cleanedOptions
    : finalCorrect
      ? [finalCorrect, ...cleanedOptions]
      : cleanedOptions;

  return {
    ...question,
    id: question.id || `q-${index}`,
    options,
    correctAnswer: finalCorrect,
  };
};

const getQuestionTitleScaleClass = (questionText: string): string => {
  const normalizedLength = questionText.replace(/\s+/g, ' ').trim().length;

  if (normalizedLength > 280) {
    return 'text-[1rem] sm:text-[1.12rem] md:text-[1.25rem]';
  }

  if (normalizedLength > 200) {
    return 'text-[1.05rem] sm:text-[1.22rem] md:text-[1.38rem]';
  }

  if (normalizedLength > 140) {
    return 'text-[1.12rem] sm:text-[1.4rem] md:text-[1.56rem]';
  }

  return 'text-[1.2rem] sm:text-[1.55rem] md:text-[1.75rem]';
};

export default function QuizPlayer({ title, questions, fileId, onGenerateQuiz, isGenerating, onSubmit }: QuizPlayerProps) {
  const sanitizedQuestions = useMemo(
    () => questions.map((question, index) => canonicalizeQuestion(question, index)),
    [questions]
  );

  // TTS hook for audio playback - tracks which item is currently playing
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const { isPlaying, isLoading: isTTSLoading, toggle: toggleTTS, stop: stopTTS } = useTTS({
    onPlayStart: () => {},
    onPlayEnd: () => setPlayingItem(null),
  });

  // Pre-test config state
  const [showSettings, setShowSettings] = useState(true);
  const [preset, setPreset] = useState<AttemptPreset>('practice');
  const [waitingForGeneration, setWaitingForGeneration] = useState(false);
  const [generationCycleStarted, setGenerationCycleStarted] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'medium',
    timeLimit: 'endless',
    feedbackMode: 'instant',
    navigationMode: 'free',
    shuffleQuestions: false,
  });
  const [numQuestions, setNumQuestions] = useState(10);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [reviewMode, setReviewMode] = useState(false);

  // New state for delayed feedback
  const [isRevealed, setIsRevealed] = useState(false);

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  // Track actual time spent (in seconds)
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);

  // Track per-question timing using ref (for mutable data)
  const questionStartTimes = useRef<Record<string, number>>({});
  const [questionTimings, setQuestionTimings] = useState<Record<string, number>>({});

  // Use ref to prevent double-submission without adding to dependency array
  const isSubmittingRef = useRef(false);

  // Local error state for inline feedback
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const initializeQuizSession = useCallback(
    (baseQuestions: QuizQuestion[]) => {
      const orderedQuestions = settings.shuffleQuestions ? shuffleOnce(baseQuestions) : [...baseQuestions];
      const initialTime = timeLimitToSeconds(settings.timeLimit);

      setQuizQuestions(orderedQuestions);
      setCurrentIndex(0);
      setAnswers({});
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      setIsSubmitted(false);
      setResults(null);
      setReviewMode(false);
      setIsRevealed(false);
      setQuestionTimings({});
      questionStartTimes.current = {};
      setSubmissionError(null);

      setTimeRemaining(initialTime);
      setTimerActive(initialTime !== null);
      setQuizStartTime(Date.now());
      setShowSettings(false);
    },
    [settings.shuffleQuestions, settings.timeLimit]
  );

  useEffect(() => {
    if (waitingForGeneration && isGenerating) {
      setGenerationCycleStarted(true);
    }
  }, [waitingForGeneration, isGenerating]);

  useEffect(() => {
    if (
      !waitingForGeneration ||
      !generationCycleStarted ||
      isGenerating ||
      sanitizedQuestions.length === 0
    ) {
      return;
    }

    initializeQuizSession(sanitizedQuestions);
    setWaitingForGeneration(false);
    setGenerationCycleStarted(false);
  }, [
    waitingForGeneration,
    generationCycleStarted,
    isGenerating,
    sanitizedQuestions,
    initializeQuizSession,
  ]);

  useEffect(() => {
    if (
      !waitingForGeneration ||
      !generationCycleStarted ||
      isGenerating ||
      sanitizedQuestions.length > 0
    ) {
      return;
    }

    // Allow a short settle window for parent state to propagate generated questions.
    const settleTimer = setTimeout(() => {
      setWaitingForGeneration(false);
      setGenerationCycleStarted(false);
    }, 2500);

    return () => clearTimeout(settleTimer);
  }, [waitingForGeneration, generationCycleStarted, isGenerating, sanitizedQuestions.length]);

  const requiresRevealStep = settings.feedbackMode === 'instant';
  const currentQuestion = quizQuestions[currentIndex];
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const hasSelectedAnswer = !!userAnswer;
  const questionTitleScaleClass = useMemo(
    () => getQuestionTitleScaleClass(currentQuestion?.question || ''),
    [currentQuestion?.question]
  );

  const canReveal =
    !!currentQuestion &&
    !isSubmitted &&
    requiresRevealStep &&
    !isRevealed &&
    hasSelectedAnswer;
  const canNext =
    !!currentQuestion &&
    !isSubmitted &&
    currentIndex < quizQuestions.length - 1 &&
    hasSelectedAnswer &&
    (!requiresRevealStep || isRevealed);
  const canSubmit =
    !!currentQuestion &&
    !isSubmitted &&
    currentIndex === quizQuestions.length - 1 &&
    hasSelectedAnswer &&
    (!requiresRevealStep || isRevealed);
  const canGoBackDuringAttempt =
    !isSubmitted && settings.navigationMode === 'free' && currentIndex > 0;
  const canReviewNavigate = isSubmitted && reviewMode;

  // Track timing when question changes
  useEffect(() => {
    const question = quizQuestions[currentIndex];
    if (question && !isSubmitted && !showSettings) {
      // Start timing for this question
      questionStartTimes.current[question.id] = Date.now();
    }
  }, [currentIndex, isSubmitted, quizQuestions, showSettings]);

  const handleSubmit = useCallback(async () => {
    // Prevent double-submission using both ref AND state
    if (isSubmittingRef.current || isSubmitted) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setTimerActive(false);
    setSubmissionError(null);

    try {
      // Calculate total time spent
      const timeSpentSeconds = quizStartTime
        ? Math.floor((Date.now() - quizStartTime) / 1000)
        : 0;

      // Pass time spent and per-question timings to backend
      const result = await onSubmit(answers, timeSpentSeconds, questionTimings);
      setResults(result);
      setIsSubmitted(true);

      if (settings.feedbackMode === 'end') {
        const correctCount = quizQuestions.reduce((count, question) => {
          return answers[question.id] === question.correctAnswer ? count + 1 : count;
        }, 0);

        if (correctCount > 0) {
          playCorrectAnswerDing();
        }
      }

      // Success - keep isSubmittingRef locked so no retries
    } catch (error: unknown) {
      // Handle specific error types with user-friendly messages
      const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
      const status = axiosError?.response?.status;
      const errorMessage = axiosError?.response?.data?.error;

      if (status === 429 || errorMessage?.toLowerCase().includes('duplicate')) {
        setSubmissionError('You already submitted this quiz recently. Please wait before trying again.');
      } else if (status === 400) {
        setSubmissionError('You are submitting too fast. Please review your answers for a moment.');
      } else {
        setSubmissionError('Failed to submit quiz. Please try again.');
      }

      // On error, allow retry after a brief delay to prevent spam
      setTimeout(() => {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }, 2000); // 2 second cooldown before allowing retry
    }
  }, [
    answers,
    onSubmit,
    quizStartTime,
    questionTimings,
    isSubmitted,
    settings.feedbackMode,
    quizQuestions,
  ]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || !timerActive) return;

    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, timerActive]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleStartQuiz = useCallback(() => {
    if (isGenerating) return;

    if (onGenerateQuiz && fileId) {
      // Trigger quiz generation with current settings
      setWaitingForGeneration(true);
      setGenerationCycleStarted(false);
      setSubmissionError(null);
      onGenerateQuiz(settings.difficulty, numQuestions);
    } else {
      if (sanitizedQuestions.length === 0) return;
      initializeQuizSession(sanitizedQuestions);
    }
  }, [
    isGenerating,
    onGenerateQuiz,
    fileId,
    settings.difficulty,
    numQuestions,
    sanitizedQuestions,
    initializeQuizSession,
  ]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (!currentQuestion || isSubmitted) return;
    if (requiresRevealStep && isRevealed) return;

    setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: option,
    }));

    // Clear any previous submission error when user changes answer
    setSubmissionError(null);

    // Record timing for this question
    const startTime = questionStartTimes.current[currentQuestion.id];
    if (startTime) {
      const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds
      setQuestionTimings((timings) => ({
          ...timings,
          [currentQuestion.id]: timeSpent,
      }));
    }
  }, [isSubmitted, isRevealed, currentQuestion, requiresRevealStep]);

  const handleRevealAnswer = useCallback(() => {
    if (!currentQuestion || !userAnswer) return;

    if (userAnswer === currentQuestion.correctAnswer) {
      playCorrectAnswerDing();
    }

    setIsRevealed(true);
  }, [currentQuestion, userAnswer]);

  const handleNext = useCallback(() => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
    }
  }, [currentIndex, quizQuestions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsRevealed(false);
    }
  }, [currentIndex]);

  const applyPreset = useCallback((nextPreset: Exclude<AttemptPreset, 'custom'>) => {
    setPreset(nextPreset);

    if (nextPreset === 'practice') {
      setSettings({
        difficulty: 'medium',
        timeLimit: 'endless',
        feedbackMode: 'instant',
        navigationMode: 'free',
        shuffleQuestions: false,
      });
      setNumQuestions(10);
      return;
    }

    setSettings({
      difficulty: 'hard',
      timeLimit: '15m',
      feedbackMode: 'end',
      navigationMode: 'locked',
      shuffleQuestions: true,
    });
    setNumQuestions(20);
  }, []);

  const updateSettings = useCallback((next: Partial<QuizSettings>) => {
    setPreset('custom');
    setSettings((prev) => ({
      ...prev,
      ...next,
    }));
  }, []);

  const handleRestart = useCallback(() => {
    stopTTS();

    setCurrentIndex(0);
    setAnswers({});
    setQuizQuestions([]);
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setIsSubmitted(false);
    setResults(null);
    setShowSettings(true);
    setTimeRemaining(null);
    setTimerActive(false);
    setIsRevealed(false);
    setQuizStartTime(null);
    setReviewMode(false);
    setQuestionTimings({});
    questionStartTimes.current = {};
    setSubmissionError(null);
    setWaitingForGeneration(false);
    setGenerationCycleStarted(false);
  }, [stopTTS]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // If no questions provided yet, or pre-test setup is open
  if (showSettings) {
    const canStart = (onGenerateQuiz && fileId) || sanitizedQuestions.length > 0;

    return (
      <div className="max-w-5xl mx-auto px-2 sm:px-0">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-xl shadow-slate-200/40 dark:shadow-black/30">
          <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
          <div className="absolute -bottom-20 -left-12 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/10" />

          <div className="relative z-10 p-5 sm:p-8 lg:p-9 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Test Builder
                </p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                  Set Up Your Quiz Session
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5">
                  Choose a mode, tune the constraints, and start with a clear game plan.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Pre-Quiz Configuration
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => applyPreset('practice')}
                disabled={isGenerating || waitingForGeneration}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  preset === 'practice'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold">Practice</span>
                </div>
                <p className="text-xs opacity-90">Instant feedback, no timer pressure, and flexible navigation.</p>
              </button>

              <button
                onClick={() => applyPreset('exam')}
                disabled={isGenerating || waitingForGeneration}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  preset === 'exam'
                    ? 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500/70 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'border-slate-200 bg-white/80 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <TimerReset className="w-4 h-4" />
                  <span className="font-semibold">Exam</span>
                </div>
                <p className="text-xs opacity-90">Timed run, shuffled questions, and answer review at the end.</p>
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                    <motion.button
                      key={level}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateSettings({ difficulty: level })}
                      disabled={isGenerating || waitingForGeneration}
                      className={`rounded-xl py-2.5 text-sm font-semibold border transition-colors ${
                        settings.difficulty === level
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      } disabled:opacity-50`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-4">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  Number of Questions
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      setPreset('custom');
                      setNumQuestions((prev) => Math.max(10, prev - 5));
                    }}
                    disabled={isGenerating || waitingForGeneration || numQuestions <= 10}
                    className="w-10 h-10 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-20 text-center text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {numQuestions}
                  </span>
                  <button
                    onClick={() => {
                      setPreset('custom');
                      setNumQuestions((prev) => Math.min(25, prev + 5));
                    }}
                    disabled={isGenerating || waitingForGeneration || numQuestions >= 25}
                    className="w-10 h-10 rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-xl font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">10-25 questions</p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Time Limit
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {(['endless', '5m', '10m', '15m', '20m'] as TimeLimit[]).map((time) => (
                    <motion.button
                      key={time}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateSettings({ timeLimit: time })}
                      disabled={isGenerating || waitingForGeneration}
                      className={`rounded-xl py-2 text-xs sm:text-sm font-semibold border transition-colors ${
                        settings.timeLimit === time
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      } disabled:opacity-50`}
                    >
                      {time === 'endless' ? 'None' : time}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-4 space-y-3">
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-white mb-2 block">
                    Answer Feedback
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSettings({ feedbackMode: 'instant' })}
                      disabled={isGenerating || waitingForGeneration}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold border transition-colors ${
                        settings.feedbackMode === 'instant'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      Instant
                    </button>
                    <button
                      onClick={() => updateSettings({ feedbackMode: 'end' })}
                      disabled={isGenerating || waitingForGeneration}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold border transition-colors ${
                        settings.feedbackMode === 'end'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-500/70 dark:bg-amber-500/10 dark:text-amber-200'
                          : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      At End
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({ navigationMode: settings.navigationMode === 'free' ? 'locked' : 'free' })}
                    disabled={isGenerating || waitingForGeneration}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      settings.navigationMode === 'free'
                        ? 'border-cyan-400 bg-cyan-50 text-cyan-800 dark:border-cyan-500/60 dark:bg-cyan-500/10 dark:text-cyan-200'
                        : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    {settings.navigationMode === 'free' ? 'Backtracking On' : 'Backtracking Off'}
                  </button>

                  <button
                    onClick={() => updateSettings({ shuffleQuestions: !settings.shuffleQuestions })}
                    disabled={isGenerating || waitingForGeneration}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      settings.shuffleQuestions
                        ? 'border-violet-400 bg-violet-50 text-violet-800 dark:border-violet-500/60 dark:bg-violet-500/10 dark:text-violet-200'
                        : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-white/15 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    {settings.shuffleQuestions ? 'Shuffled' : 'Fixed Order'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {preset === 'custom' ? 'Custom setup' : `${preset.charAt(0).toUpperCase() + preset.slice(1)} setup`}:
                <span className="font-normal text-slate-600 dark:text-slate-300">
                  {' '}
                  {numQuestions} questions, {settings.difficulty} difficulty,{' '}
                  {settings.timeLimit === 'endless' ? 'no timer' : settings.timeLimit}, {settings.feedbackMode === 'end' ? 'answers reviewed at end' : 'instant answer reveal'}.
                </span>
              </p>
            </div>

            <motion.button
              whileHover={{ scale: !canStart || isGenerating || waitingForGeneration ? 1 : 1.01 }}
              whileTap={{ scale: !canStart || isGenerating || waitingForGeneration ? 1 : 0.98 }}
              onClick={handleStartQuiz}
              disabled={!canStart || isGenerating || waitingForGeneration}
              className="w-full rounded-2xl px-6 py-3.5 text-base font-semibold text-white bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 dark:text-slate-900 hover:from-slate-800 hover:to-slate-600 dark:hover:from-slate-100 dark:hover:to-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating || waitingForGeneration ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building your quiz...
                </span>
              ) : (
                'Start Quiz Session'
              )}
            </motion.button>

            {!canStart && (
              <p className="text-sm text-center text-slate-500 dark:text-slate-400">
                Generate quiz questions first, then come back here to configure the attempt.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="max-w-xl mx-auto px-2 sm:px-0">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-6 text-center">
          <p className="text-slate-700 dark:text-slate-300 mb-4">No quiz questions are available for this attempt.</p>
          <button
            onClick={handleRestart}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 font-medium"
          >
            Back to Settings
          </button>
        </div>
      </div>
    );
  }

  // Final score screen - show when submitted but NOT in review mode
  if (isSubmitted && results && !reviewMode) {
    const isPassing = results.percentage >= 70;

    return (
      <div className="max-w-lg mx-auto px-2 sm:px-0">
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-6 sm:p-8 text-center shadow-xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isPassing ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>
              {isPassing ? (
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quiz Complete</h2>
          </div>

          <div className="mb-5">
            <p className={`text-6xl font-bold ${isPassing ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {results.percentage}%
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {results.score}/{results.total} correct answers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/70 p-3.5 mb-5 text-sm text-slate-600 dark:text-slate-300">
            {settings.feedbackMode === 'end'
              ? 'Answer explanations are now unlocked in review mode.'
              : 'You can still enter review mode to revisit every question.'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setCurrentIndex(0);
                setReviewMode(true);
                setIsRevealed(true);
              }}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-100 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Review Answers
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRestart}
              className="px-4 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
            >
              New Setup
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-2 sm:px-0">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-3">
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Active Attempt
              </p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white break-words">{title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <Zap className="w-3.5 h-3.5" />
                {settings.difficulty}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {settings.feedbackMode === 'end' ? 'Review at end' : 'Instant review'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-900">
              Question {currentIndex + 1} of {quizQuestions.length}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {Object.keys(answers).length} / {quizQuestions.length} answered
            </span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-900 rounded-full h-2.5 border border-slate-200 dark:border-white/10 overflow-hidden">
            <div
              className="h-full bg-slate-900 dark:bg-white transition-[width] duration-200"
              style={{
                width: `${((currentIndex + 1) / quizQuestions.length) * 100}%`,
              }}
            />
          </div>

          {/* Timer Display */}
          {timeRemaining !== null && (
            <motion.div
              initial={false}
              className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold ${
                timeRemaining < 60
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : timeRemaining < 180
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-base">{formatTime(timeRemaining)}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto mb-3 max-w-5xl mx-auto w-full">
        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="relative mb-4"
          >
            <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex-1 prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p
                          className={`${questionTitleScaleClass} font-bold text-slate-900 dark:text-white mb-2.5 text-balance leading-tight`}
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-balance" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-balance" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-extrabold text-slate-900 dark:text-white" {...props} />,
                      em: ({ node, ...props }) => <em className="italic text-slate-700 dark:text-slate-300" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-2 text-slate-700 dark:text-slate-300 marker:text-brand-500 dark:marker:text-accent-400 text-lg" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-2 text-slate-700 dark:text-slate-300 marker:text-brand-500 dark:marker:text-accent-400 text-lg" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-brand-50 dark:bg-accent-900/30 text-brand-700 dark:text-accent-300 px-1.5 py-0.5 rounded-md text-base font-mono border border-brand-200 dark:border-accent-800"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className={`block bg-slate-100 dark:bg-gray-900/80 text-slate-800 dark:text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono shadow-lg border border-slate-200 dark:border-gray-700 my-4 ${className || ''}`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      blockquote: ({ node, ...props }) => (
                        <blockquote
                          className="border-l-4 border-brand-500 dark:border-accent-400 bg-brand-50 dark:bg-accent-900/10 p-4 rounded-r-lg italic text-slate-700 dark:text-slate-300 my-4 shadow-sm"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {currentQuestion.question}
                  </ReactMarkdown>
                </div>
                {/* TTS Button for Question */}
                <button
                  onClick={() => {
                    const itemId = `question-${currentQuestion.id}`;
                    if (playingItem === itemId && isPlaying) {
                      stopTTS();
                      setPlayingItem(null);
                    } else {
                      const cleanText = currentQuestion.question
                        .replace(/#{1,6}\s/g, '')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, '')
                        .replace(/`/g, '')
                        .trim();
                      setPlayingItem(itemId);
                      toggleTTS(cleanText);
                    }
                  }}
                  disabled={isTTSLoading}
                  className="flex-shrink-0 p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15 rounded-lg transition-colors disabled:opacity-50"
                  title="Read question aloud"
                >
                  {isTTSLoading && playingItem === `question-${currentQuestion.id}` ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Enhanced Option Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {currentQuestion.options.map((option, index) => {
            const isSelected = userAnswer === option;
            const isCorrectAnswer = option === currentQuestion.correctAnswer;
            const shouldRevealCorrectness = isSubmitted || (requiresRevealStep && isRevealed);
            const isCorrect = shouldRevealCorrectness && isCorrectAnswer;
            const isWrong = shouldRevealCorrectness && isSelected && !isCorrectAnswer;
            const keyLabel = ['A', 'B', 'C', 'D'][index];

            return (
              <motion.button
                key={index}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                onClick={() => handleAnswerSelect(option)}
                disabled={isSubmitted || (requiresRevealStep && isRevealed)}
                whileTap={!isSubmitted && !(requiresRevealStep && isRevealed) ? { scale: 0.98 } : {}}
                className={`group relative w-full text-left p-3.5 rounded-xl border transition-all duration-150 text-base cursor-pointer ${
                  isCorrect
                    ? 'border-emerald-400/70 dark:border-emerald-500/60 bg-emerald-50 dark:bg-emerald-500/10 text-slate-900 dark:text-slate-100'
                    : isWrong
                      ? 'border-rose-400/70 dark:border-rose-500/60 bg-rose-50 dark:bg-rose-500/10 text-slate-900 dark:text-slate-100'
                      : isSelected && !isRevealed
                        ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-900'
                } ${isSubmitted || (requiresRevealStep && isRevealed) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 pointer-events-none">
                    {/* Keyboard Shortcut Keycap */}
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 text-slate-700 dark:text-white font-bold text-sm border border-slate-300 dark:border-zinc-600 group-hover:border-brand-300 dark:group-hover:border-accent-400 transition-colors duration-150 shadow-sm">
                      {keyLabel}
                    </span>
                    <div className="font-semibold flex-1 text-[0.98rem]">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ node, ...props }) => <span className="inline" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-slate-900 dark:text-white" {...props} />,
                          em: ({ node, ...props }) => <em className="italic" {...props} />,
                          code: ({ node, ...props }) => (
                            <code className="bg-slate-200/50 dark:bg-zinc-700/50 text-brand-700 dark:text-accent-300 px-2 py-0.5 rounded text-sm font-mono border border-slate-300 dark:border-zinc-600" {...props} />
                          ),
                        }}
                      >
                        {option}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {/* TTS Speaker Button for Option */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const itemId = `option-${currentQuestion.id}-${index}`;
                      if (playingItem === itemId && isPlaying) {
                        stopTTS();
                        setPlayingItem(null);
                      } else {
                        const cleanText = option
                          .replace(/\*\*/g, '')
                          .replace(/\*/g, '')
                          .replace(/`/g, '')
                          .trim();
                        setPlayingItem(itemId);
                        toggleTTS(cleanText);
                      }
                    }}
                    disabled={isTTSLoading}
                    className="flex-shrink-0 p-1.5 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-500/20 rounded-md transition-colors disabled:opacity-50 pointer-events-auto"
                    title="Read option aloud"
                  >
                    {isTTSLoading && playingItem === `option-${currentQuestion.id}-${index}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  {shouldRevealCorrectness && (
                    <>
                      {isCorrect && (
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      {isWrong && (
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation panel */}
        <div className="mt-3">
          {(isRevealed || isSubmitted) ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-5 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-slate-500 dark:text-slate-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 dark:text-white mb-2 text-sm tracking-wide">Explanation</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-slate-700 dark:text-slate-300 text-[0.95rem] leading-7 mb-3" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-slate-900 dark:text-white" {...props} />
                      ),
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-1.5 text-slate-700 dark:text-slate-300 marker:text-slate-500 dark:marker:text-slate-400" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-1.5 text-slate-700 dark:text-slate-300 marker:text-slate-500 dark:marker:text-slate-400" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-slate-200 px-1.5 py-0.5 rounded-lg text-xs font-mono border border-slate-200 dark:border-zinc-700"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className={`block bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-xl overflow-x-auto text-xs font-mono shadow-lg border border-gray-700 my-2 ${className || ''}`}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {currentQuestion.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50/60 dark:bg-zinc-900/40 min-h-[96px] flex items-center justify-center px-4 py-5">
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                {settings.feedbackMode === 'end'
                  ? 'Explanations will unlock after submission in review mode.'
                  : 'Select an option, then reveal the answer to see the explanation.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation - Sticky Footer */}
      <div className="sticky bottom-0 z-20 flex-shrink-0 pt-3 pb-2 sm:pb-3 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 dark:to-transparent backdrop-blur-sm">
        {/* Submission Error Display */}
        {submissionError && (
          <div className="flex items-center justify-center gap-2 mb-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {canReviewNavigate ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/20 rounded-xl text-slate-700 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              Previous
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              disabled={currentIndex === quizQuestions.length - 1}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/20 rounded-xl text-slate-700 dark:text-white font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              Next
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setReviewMode(false)}
              className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors w-full sm:w-auto"
            >
              Back to Results
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 min-h-[72px]">
            {canGoBackDuringAttempt && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevious}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-xl text-slate-700 dark:text-slate-100 font-semibold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
              >
                Previous
              </motion.button>
            )}

            {canReveal && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRevealAnswer}
                className="px-6 sm:px-10 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition-colors text-base sm:text-lg w-full sm:w-auto"
              >
                Reveal Answer
              </motion.button>
            )}

            {canNext && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                className="px-6 sm:px-10 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition-colors text-base sm:text-lg w-full sm:w-auto"
              >
                Next Question
              </motion.button>
            )}

            {canSubmit && (
              <motion.button
                whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                whileTap={!isSubmitting ? { scale: 0.95 } : {}}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 sm:px-10 py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold transition-colors text-base sm:text-lg w-full sm:w-auto ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </motion.button>
            )}

            {!canReveal && !canNext && !canSubmit && (
              <div className="h-[56px] flex items-center justify-center px-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Select an answer to continue.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
