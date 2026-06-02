/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Volume2,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { playCorrectAnswerDing } from '@/utils/quizSounds';
import { isQuizAnswerCorrect as evaluateQuizAnswer } from '@/utils/quizAnswerUtils';

type QuizQuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';

interface QuizImprovementTips {
  summary: string;
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
  questionType?: QuizQuestionType;
}

interface QuizSubmitResult {
  score: number;
  total: number;
  percentage: number;
  improvementTips?: QuizImprovementTips;
  improvementTipsSource?: 'ai' | 'rule-based';
  aiTipsEligible?: boolean;
  aiTipsUpgradeMessage?: string;
}

interface QuizPlayerProps {
  quizId: string;
  title: string;
  questions: QuizQuestion[];
  fileId?: string;
  onGenerateQuiz?: (
    difficulty: string,
    numQuestions: number,
    questionTypes: QuizQuestionType[]
  ) => void;
  isGenerating?: boolean;
  onSubmit: (
    answers: Record<string, string>,
    timeSpentSeconds?: number,
    questionTimings?: Record<string, number>,
    usedQuestions?: QuizQuestion[]
  ) => Promise<QuizSubmitResult | Record<string, unknown>>;
}

type TimeLimit = 'endless' | '5m' | '10m' | '15m' | '20m';
type FeedbackMode = 'instant' | 'end';
type NavigationMode = 'free' | 'locked';
type AttemptPreset = 'practice' | 'exam' | 'custom';

interface QuizSettings {
  timeLimit: TimeLimit;
  feedbackMode: FeedbackMode;
  navigationMode: NavigationMode;
}

const QUESTION_TYPE_OPTIONS: Array<{
  value: QuizQuestionType;
  label: string;
  description: string;
}> = [
  {
    value: 'MULTIPLE_CHOICE',
    label: 'Multiple Choice',
    description: '4 options, one best answer.',
  },
  {
    value: 'TRUE_FALSE',
    label: 'True / False',
    description: 'Fast fact checks and conceptual contrasts.',
  },
  {
    value: 'FILL_IN_THE_BLANK',
    label: 'Fill in the Blank',
    description: 'Recall exact terms without options.',
  },
];

const QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  TRUE_FALSE: 'True / False',
  FILL_IN_THE_BLANK: 'Fill in the Blank',
};

const normalizeOptionText = (value: string): string => value.replace(/\s+/g, ' ').trim();

const normalizeQuestionType = (value: unknown): QuizQuestionType | null => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (normalized === 'MULTIPLE_CHOICE' || normalized === 'MCQ' || normalized === 'MULTIPLECHOICE') {
    return 'MULTIPLE_CHOICE';
  }

  if (normalized === 'TRUE_FALSE' || normalized === 'TRUEFALSE' || normalized === 'TF') {
    return 'TRUE_FALSE';
  }

  if (
    normalized === 'FILL_IN_THE_BLANK' ||
    normalized === 'FILL_BLANK' ||
    normalized === 'FILLINTHEBLANK' ||
    normalized === 'SHORT_ANSWER' ||
    normalized === 'BLANK'
  ) {
    return 'FILL_IN_THE_BLANK';
  }

  return null;
};

const inferQuestionType = (question: QuizQuestion, cleanedOptions: string[]): QuizQuestionType => {
  const explicit = normalizeQuestionType(question.questionType);
  if (explicit) {
    return explicit;
  }

  if (cleanedOptions.length === 2) {
    const tfKey = cleanedOptions
      .map((option) => option.toLowerCase())
      .sort()
      .join('|');
    if (tfKey === 'false|true') {
      return 'TRUE_FALSE';
    }
  }

  if (cleanedOptions.length === 0 || /_{3,}/.test(question.question || '') || /\bblank\b/i.test(question.question || '')) {
    return 'FILL_IN_THE_BLANK';
  }

  return 'MULTIPLE_CHOICE';
};

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

  const questionType = inferQuestionType(question, cleanedOptions);

  if (questionType === 'FILL_IN_THE_BLANK') {
    return {
      ...question,
      id: question.id || `q-${index}`,
      questionType,
      options: [],
      correctAnswer: normalizeOptionText(String(question.correctAnswer || '')),
    };
  }

  if (questionType === 'TRUE_FALSE') {
    const trueFalseOptions = ['True', 'False'];
    const normalizedCorrect = normalizeOptionText(String(question.correctAnswer || ''));
    const loweredCorrect = normalizedCorrect.toLowerCase();
    const finalCorrect =
      loweredCorrect === 'true' || loweredCorrect === 'yes' || loweredCorrect === '1'
        ? 'True'
        : loweredCorrect === 'false' || loweredCorrect === 'no' || loweredCorrect === '0'
        ? 'False'
        : normalizedCorrect === 'True' || normalizedCorrect === 'False'
        ? normalizedCorrect
        : 'True';

    return {
      ...question,
      id: question.id || `q-${index}`,
      questionType,
      options: trueFalseOptions,
      correctAnswer: finalCorrect,
    };
  }

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
    questionType,
    options,
    correctAnswer: finalCorrect,
  };
};

const getQuestionTitleClass = (questionText: string): string => {
  const normalizedLength = questionText.replace(/\s+/g, ' ').trim().length;

  if (normalizedLength >= 220) {
    return 'text-[0.95rem] sm:text-[1.02rem] md:text-[1.08rem] lg:text-[1.14rem] leading-[1.35]';
  }

  if (normalizedLength >= 170) {
    return 'text-[1rem] sm:text-[1.08rem] md:text-[1.16rem] lg:text-[1.24rem] leading-[1.33]';
  }

  if (normalizedLength >= 130) {
    return 'text-[1.04rem] sm:text-[1.14rem] md:text-[1.24rem] lg:text-[1.34rem] leading-[1.3]';
  }

  if (normalizedLength >= 95) {
    return 'text-[1.08rem] sm:text-[1.2rem] md:text-[1.32rem] lg:text-[1.44rem] leading-[1.28]';
  }

  if (normalizedLength >= 70) {
    return 'text-[1.12rem] sm:text-[1.28rem] md:text-[1.42rem] lg:text-[1.58rem] leading-[1.24]';
  }

  return 'text-[1.18rem] sm:text-[1.4rem] md:text-[1.6rem] lg:text-[1.8rem] leading-[1.18]';
};

const buildFallbackImprovementTips = (input: {
  score: number;
  total: number;
  questions: QuizQuestion[];
  answers: Record<string, string>;
}): QuizImprovementTips => {
  const total = Math.max(1, input.total || 0);
  const score = Math.max(0, input.score || 0);
  const percentage = Math.round((score / total) * 100);

  const missedQuestions = input.questions.filter(
    (question) => !evaluateQuizAnswer(input.answers[question.id], question)
  );

  const missedTypeCounts = {
    MULTIPLE_CHOICE: 0,
    TRUE_FALSE: 0,
    FILL_IN_THE_BLANK: 0,
  } as Record<QuizQuestionType, number>;

  missedQuestions.forEach((question) => {
    const type = question.questionType || inferQuestionType(question, question.options || []);
    missedTypeCounts[type] += 1;
  });

  const topWeakType = (Object.keys(missedTypeCounts) as QuizQuestionType[]).sort(
    (a, b) => missedTypeCounts[b] - missedTypeCounts[a]
  )[0];

  const typeTip: Record<QuizQuestionType, string> = {
    MULTIPLE_CHOICE: 'Practice eliminating distractors by identifying why each wrong option is incorrect.',
    TRUE_FALSE: 'Pay attention to absolute language like "always" or "never" in true/false statements.',
    FILL_IN_THE_BLANK: 'Use active recall: answer from memory first, then verify with notes.',
  };

  return {
    summary:
      percentage >= 75
        ? 'Strong result overall. Focus on the few concepts you missed to reach mastery.'
        : 'Good progress. Targeted review of missed concepts will improve your next attempt quickly.',
    strengths: [
      percentage >= 75
        ? 'You demonstrated solid understanding across most quiz concepts.'
        : 'You completed the quiz and identified where to focus next.',
      'You now have clear feedback to guide your next study session.',
    ],
    improvements:
      missedQuestions.length > 0
        ? [
            typeTip[topWeakType],
            'Review each missed question and explain the correct answer in your own words.',
          ]
        : ['Keep practicing mixed question formats to maintain retention.'],
    nextSteps: [
      'Retake this quiz in 24 hours to reinforce memory through spaced repetition.',
      'Create a short mistake log with concept, error pattern, and corrected reasoning.',
    ],
  };
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
    timeLimit: 'endless',
    feedbackMode: 'instant',
    navigationMode: 'free',
  });
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedQuestionTypes, setSelectedQuestionTypes] = useState<QuizQuestionType[]>([
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'FILL_IN_THE_BLANK',
  ]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<QuizSubmitResult | Record<string, unknown> | null>(null);
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
      const orderedQuestions = shuffleOnce(baseQuestions);
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
    [settings.timeLimit]
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
  const currentQuestionType: QuizQuestionType = currentQuestion
    ? currentQuestion.questionType || inferQuestionType(currentQuestion, currentQuestion.options || [])
    : 'MULTIPLE_CHOICE';
  const hasSelectedAnswer = !!String(userAnswer || '').trim();
  const isCurrentAnswerCorrect =
    !!currentQuestion && evaluateQuizAnswer(userAnswer, currentQuestion);
  let questionText = currentQuestion?.question || '';
  
  // Guard against AI returning a full sentence without a blank
  if (currentQuestionType === 'FILL_IN_THE_BLANK' && currentQuestion?.correctAnswer) {
    if (!questionText.includes('_')) {
      const primaryAnswer = currentQuestion.correctAnswer.split('|')[0];
      const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapeRegExp(primaryAnswer)}\\b`, 'i');
      if (regex.test(questionText)) {
        questionText = questionText.replace(regex, '__________');
      } else {
        questionText += " __________.";
      }
    }
  }

  const questionTitleClass = useMemo(
    () => getQuestionTitleClass(questionText),
    [questionText]
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
    !isSubmitted &&
    settings.navigationMode === 'free' &&
    settings.feedbackMode !== 'instant' &&
    currentIndex > 0;
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
      const result = await onSubmit(answers, timeSpentSeconds, questionTimings, quizQuestions);
      setResults(result);
      setIsSubmitted(true);

      if (settings.feedbackMode === 'end') {
        const correctCount = quizQuestions.reduce((count, question) => {
          return evaluateQuizAnswer(answers[question.id], question) ? count + 1 : count;
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
    if (onGenerateQuiz && fileId && selectedQuestionTypes.length === 0) {
      setSubmissionError('Select at least one question format to build your quiz.');
      return;
    }

    if (onGenerateQuiz && fileId) {
      // Trigger quiz generation with current settings
      setWaitingForGeneration(true);
      setGenerationCycleStarted(false);
      setSubmissionError(null);
      onGenerateQuiz('medium', numQuestions, selectedQuestionTypes);
    } else {
      if (sanitizedQuestions.length === 0) return;
      initializeQuizSession(sanitizedQuestions);
    }
  }, [
    isGenerating,
    onGenerateQuiz,
    fileId,
    numQuestions,
    selectedQuestionTypes,
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

    if (evaluateQuizAnswer(userAnswer, currentQuestion)) {
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
    setSelectedQuestionTypes(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_THE_BLANK']);

    if (nextPreset === 'practice') {
      setSettings({
        timeLimit: 'endless',
        feedbackMode: 'instant',
        navigationMode: 'free',
      });
      setNumQuestions(10);
      return;
    }

    setSettings({
      timeLimit: '15m',
      feedbackMode: 'end',
      navigationMode: 'locked',
    });
    setNumQuestions(25);
  }, []);

  const updateSettings = useCallback((next: Partial<QuizSettings>) => {
    setPreset('custom');
    setSettings((prev) => ({
      ...prev,
      ...next,
    }));
  }, []);

  const toggleQuestionType = useCallback((questionType: QuizQuestionType) => {
    setPreset('custom');
    setSelectedQuestionTypes((prev) => {
      if (prev.includes(questionType)) {
        return prev.filter((value) => value !== questionType);
      }
      return [...prev, questionType];
    });
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
    const canStart = onGenerateQuiz && fileId
      ? selectedQuestionTypes.length > 0
      : sanitizedQuestions.length > 0;

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
                  Pick a starting preset, then fine-tune your run. Manual adjustments automatically switch
                  this session to Custom mode.
                </p>
              </div>
              <div className="shrink-0 whitespace-nowrap inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {preset === 'custom' ? 'Custom Configuration Active' : 'Preset Configuration Active'}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => applyPreset('practice')}
                disabled={isGenerating || waitingForGeneration}
                className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                  preset === 'practice'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/70 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="font-semibold">Practice</span>
                  </div>
                  {preset === 'practice' && (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Learn mode with instant correctness checks, visible explanations, and no timer pressure.
                </p>
                <p className="text-[11px] mt-2 font-medium opacity-75">
                  Best for: building confidence and catching mistakes quickly.
                </p>
              </button>

              <button
                onClick={() => applyPreset('exam')}
                disabled={isGenerating || waitingForGeneration}
                className={`rounded-2xl border-2 p-4 text-left transition-colors ${
                  preset === 'exam'
                    ? 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-500/70 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'border-slate-200 bg-white/90 text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <TimerReset className="w-4 h-4" />
                    <span className="font-semibold">Exam</span>
                  </div>
                  {preset === 'exam' && (
                    <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  Test mode with a timer, locked backtracking, and full review after submission.
                </p>
                <p className="text-[11px] mt-2 font-medium opacity-75">
                  Best for: realistic exam simulation under pressure.
                </p>
              </button>
            </div>

            {preset === 'custom' && (
              <div className="rounded-2xl border border-brand-200/80 dark:border-accent-500/30 bg-brand-50/70 dark:bg-accent-500/10 px-4 py-2.5">
                <p className="text-xs sm:text-sm font-medium text-brand-800 dark:text-accent-200">
                  Custom mode is active. Your setting changes override Practice and Exam defaults.
                </p>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-3.5">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Number of Questions
                </label>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setPreset('custom');
                      setNumQuestions((prev) => Math.max(10, prev - 5));
                    }}
                    disabled={isGenerating || waitingForGeneration || numQuestions <= 10}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="w-14 text-center text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {numQuestions}
                  </span>
                  <button
                    onClick={() => {
                      setPreset('custom');
                      setNumQuestions((prev) => Math.min(40, prev + 5));
                    }}
                    disabled={isGenerating || waitingForGeneration || numQuestions >= 40}
                    className="w-9 h-9 rounded-lg border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-800 text-lg font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-1.5">
                  10-40 questions. Higher counts broaden topic coverage.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 p-4">
                <label className="flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white mb-2.5">
                  <span>Question Types</span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {selectedQuestionTypes.length} selected
                  </span>
                </label>
                <div className="grid gap-2">
                  {QUESTION_TYPE_OPTIONS.map((typeOption) => {
                    const isActive = selectedQuestionTypes.includes(typeOption.value);
                    return (
                      <button
                        key={typeOption.value}
                        onClick={() => toggleQuestionType(typeOption.value)}
                        disabled={isGenerating || waitingForGeneration}
                        className={`rounded-xl border-2 px-3 py-2 text-left transition-colors ${
                          isActive
                            ? 'border-brand-500 bg-brand-50 text-brand-900 dark:border-accent-400 dark:bg-accent-500/20 dark:text-accent-100'
                            : 'border-slate-300/90 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-4.5 w-4.5 items-center justify-center rounded border-2 ${
                              isActive
                                ? 'border-brand-600 bg-brand-600 dark:border-accent-400 dark:bg-accent-400'
                                : 'border-slate-500 dark:border-slate-400 bg-white dark:bg-slate-950'
                            }`}
                            aria-hidden="true"
                          >
                            {isActive && (
                              <svg viewBox="0 0 16 16" className="h-3 w-3 text-white dark:text-slate-900" fill="currentColor">
                                <path d="M6.2 11.4 2.8 8l1.1-1.1 2.3 2.3 5-5L12.3 5.3z" />
                              </svg>
                            )}
                          </span>
                          <p className="text-sm font-semibold">{typeOption.label}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedQuestionTypes.length === 0 && (
                  <p className="text-xs text-rose-600 dark:text-rose-300 mt-2">
                    Select at least one question type to continue.
                  </p>
                )}
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
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {preset === 'custom' ? 'Custom setup' : `${preset.charAt(0).toUpperCase() + preset.slice(1)} setup`}:
                <span className="font-normal text-slate-600 dark:text-slate-300">
                  {' '}
                  {numQuestions} questions,{' '}
                  {settings.timeLimit === 'endless' ? 'no timer' : settings.timeLimit}, {settings.feedbackMode === 'end' ? 'answers reviewed at end' : 'instant answer reveal'}, formats: {selectedQuestionTypes.length > 0
                    ? selectedQuestionTypes
                        .map((type) =>
                          QUESTION_TYPE_OPTIONS.find((option) => option.value === type)?.label || type
                        )
                        .join(', ')
                    : 'none selected'}.
                </span>
              </p>
            </div>

            <motion.button
              onClick={handleStartQuiz}
              disabled={!canStart || isGenerating || waitingForGeneration}
              className={`w-full rounded-2xl px-6 py-3.5 text-base font-semibold transition-colors shadow-sm ${
                isGenerating || waitingForGeneration
                  ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500 dark:from-cyan-500 dark:to-violet-500 text-white cursor-wait opacity-90'
                  : !canStart
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-600 to-fuchsia-600 dark:from-cyan-600 dark:to-violet-600 text-white hover:from-pink-500 hover:to-fuchsia-500 dark:hover:from-cyan-500 dark:hover:to-violet-500'
              }`}
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
    const finalResults = results as QuizSubmitResult;
    const rawScore = Number(finalResults.score || 0);
    const rawTotal = Number(finalResults.total || 0);
    const finalScore = Number.isFinite(rawScore) ? Math.max(0, Math.floor(rawScore)) : 0;
    const finalTotal = Number.isFinite(rawTotal) ? Math.max(0, Math.floor(rawTotal)) : 0;
    const derivedPercentage =
      finalTotal > 0 ? Math.round((Math.min(finalScore, finalTotal) / finalTotal) * 100) : 0;
    const rawPercentage = Number(finalResults.percentage);
    const finalPercentage =
      Number.isFinite(rawPercentage) && rawPercentage >= 0
        ? Math.min(100, Math.round(rawPercentage))
        : derivedPercentage;
    const improvementTips =
      finalResults.improvementTips ||
      buildFallbackImprovementTips({
        score: finalScore,
        total: finalTotal,
        questions: quizQuestions,
        answers,
      });
    const isPassing = finalPercentage >= 70;

    return (
      <div className="max-w-3xl mx-auto px-2 sm:px-0">
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
              {finalPercentage}%
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              {finalScore}/{finalTotal} correct answers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/70 p-3.5 mb-5 text-sm text-slate-600 dark:text-slate-300">
            {settings.feedbackMode === 'end'
              ? 'Answer explanations are now unlocked in review mode.'
              : 'You can still enter review mode to revisit every question.'}
          </div>

          {improvementTips && (
            <div className="rounded-2xl border border-brand-200/70 dark:border-accent-500/25 bg-brand-50/70 dark:bg-accent-500/10 p-4 mb-5 text-left space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand-700 dark:text-accent-300">
                  Improvement Tips
                </p>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300 uppercase tracking-[0.08em]">
                  {finalResults.improvementTipsSource === 'ai' ? 'AI coach' : 'smart guide'}
                </span>
              </div>
              {improvementTips.summary && (
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-6">{improvementTips.summary}</p>
              )}
              {improvementTips.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300 mb-1">
                    Strengths
                  </p>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200 list-disc pl-5">
                    {improvementTips.strengths.map((item, index) => (
                      <li key={`strength-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {improvementTips.improvements?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700 dark:text-amber-300 mb-1">
                    Focus Areas
                  </p>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200 list-disc pl-5">
                    {improvementTips.improvements.map((item, index) => (
                      <li key={`improvement-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {improvementTips.nextSteps?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-700 dark:text-cyan-300 mb-1">
                    Next Steps
                  </p>
                  <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200 list-disc pl-5">
                    {improvementTips.nextSteps.map((item, index) => (
                      <li key={`step-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {finalResults.aiTipsUpgradeMessage && (
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {finalResults.aiTipsUpgradeMessage}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <motion.button
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
    <div className="relative flex flex-col h-full max-w-6xl mx-auto px-2 sm:px-0">
      <div className="pointer-events-none absolute inset-x-6 top-8 -z-10 h-40 rounded-full bg-gradient-to-r from-brand-500/12 via-fuchsia-500/12 to-orange-400/12 dark:from-accent-500/12 dark:via-violet-500/12 dark:to-brand-400/12 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-10 bottom-24 -z-10 h-44 rounded-full bg-gradient-to-r from-orange-400/10 via-brand-500/10 to-pink-500/10 dark:from-violet-500/10 dark:via-accent-500/10 dark:to-brand-400/10 blur-3xl" />
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-3">
        <div className="rounded-3xl border border-brand-200/70 dark:border-accent-500/25 bg-white/80 dark:bg-slate-950/70 backdrop-blur-xl p-4 sm:p-5 shadow-xl shadow-brand-500/10 dark:shadow-accent-500/10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] font-semibold text-brand-600 dark:text-accent-300 mb-1">
                Active Attempt
              </p>
              <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white break-words"><span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-pink-500 to-orange-400 dark:from-cyan-400 dark:via-blue-500 dark:to-violet-500 drop-shadow-sm">AI</span> {title || 'Quiz'}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-50 to-orange-50 dark:from-violet-500/20 dark:to-accent-500/20 border border-brand-200 dark:border-violet-500/30 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-100">
                {settings.feedbackMode === 'end' ? 'Review at end' : 'Instant review'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-50 to-pink-50 dark:from-brand-500/20 dark:to-accent-500/20 border border-brand-200 dark:border-brand-500/30 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-100">
                {QUESTION_TYPE_LABELS[currentQuestionType]}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="px-3 py-1 rounded-lg border border-brand-200/70 dark:border-accent-500/30 text-sm font-semibold text-slate-700 dark:text-slate-100 bg-brand-50/80 dark:bg-accent-500/10">
              Question {currentIndex + 1} of {quizQuestions.length}
            </span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {Object.keys(answers).length} / {quizQuestions.length} answered
            </span>
          </div>

          <div className="w-full bg-white/80 dark:bg-slate-900/80 rounded-full h-2.5 border border-brand-200/70 dark:border-accent-500/20 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 via-fuchsia-500 to-orange-500 dark:from-accent-400 dark:via-violet-500 dark:to-brand-400 transition-[width] duration-300"
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
      <div className="flex-1 overflow-y-auto mb-3 pb-8 max-w-6xl mx-auto w-full">
        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="relative mb-4"
          >
            <div className="relative overflow-hidden rounded-3xl border border-brand-200/70 dark:border-accent-500/25 bg-white/85 dark:bg-slate-950/75 backdrop-blur-xl p-5 sm:p-6 shadow-xl shadow-brand-500/10 dark:shadow-accent-500/10">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand-500 via-fuchsia-500 to-orange-500 dark:from-accent-400 dark:via-violet-500 dark:to-brand-400" />
              <div className="relative z-10 flex items-start gap-3">
                <div className="flex-1 prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p
                          className={`${questionTitleClass} font-bold text-slate-900 dark:text-white mb-2.5 text-balance`}
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <h1
                          className={`${questionTitleClass} font-bold text-slate-900 dark:text-white mb-3 text-balance`}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <h2
                          className={`${questionTitleClass} font-bold text-slate-900 dark:text-white mb-2 text-balance`}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <h3
                          className={`${questionTitleClass} font-semibold text-slate-900 dark:text-white mb-2`}
                          {...props}
                        />
                      ),
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
                    {questionText}
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
                      const cleanText = questionText // use the modified questionText
                        .replace(/#{1,6}\s/g, '')
                        .replace(/\*\*/g, '')
                        .replace(/\*/g, '')
                        .replace(/`/g, '')
                        .replace(/_{2,}/g, 'blank') // Replace __________ with "blank" for TTS
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

        {/* Enhanced Answer Cards */}
        {currentQuestionType === 'FILL_IN_THE_BLANK' ? (
          <div className="rounded-3xl border border-brand-200/70 dark:border-accent-500/25 bg-white/90 dark:bg-slate-950/75 p-4 sm:p-5 backdrop-blur-xl">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Your answer
            </label>
            <input
              value={userAnswer || ''}
              onChange={(event) => handleAnswerSelect(event.target.value)}
              disabled={isSubmitted || (requiresRevealStep && isRevealed)}
              placeholder="Type your answer here"
              className="w-full rounded-xl border border-brand-200 dark:border-accent-500/30 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:focus:ring-accent-400/40"
            />
            {(isSubmitted || (requiresRevealStep && isRevealed)) && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                  isCurrentAnswerCorrect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200'
                }`}
              >
                {isCurrentAnswerCorrect
                  ? 'Correct answer.'
                  : `Correct answer: ${currentQuestion.correctAnswer?.split('|')[0]}`}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = userAnswer === option;
              const shouldRevealCorrectness = isSubmitted || (requiresRevealStep && isRevealed);
              const isCorrectAnswer = evaluateQuizAnswer(option, currentQuestion);
              const isCorrect = shouldRevealCorrectness && isCorrectAnswer;
              const isWrong = shouldRevealCorrectness && isSelected && !isCorrectAnswer;
              const keyLabel = String.fromCharCode(65 + index);

              return (
                <motion.button
                  key={index}
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={isSubmitted || (requiresRevealStep && isRevealed)}
                  className={`group relative w-full overflow-hidden text-left p-4 rounded-2xl border transition-all duration-200 text-base ${
                    isCorrect
                      ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-900/45 text-emerald-950 dark:text-emerald-100 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/40 dark:ring-emerald-300/40'
                      : isWrong
                        ? 'border-rose-600 dark:border-rose-400 bg-rose-100 dark:bg-rose-900/45 text-rose-950 dark:text-rose-100 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/40 dark:ring-rose-300/40'
                        : isSelected && !isRevealed
                          ? 'border-brand-500 dark:border-accent-400 bg-gradient-to-br from-brand-100 to-orange-100 dark:from-accent-500/25 dark:to-violet-500/25 text-slate-900 dark:text-slate-100 shadow-lg shadow-brand-500/15 ring-1 ring-brand-400/35 dark:ring-accent-300/35'
                          : 'border-brand-200/70 dark:border-white/10 hover:border-brand-400 dark:hover:border-accent-400/40 bg-white/90 dark:bg-slate-950/70 text-slate-800 dark:text-slate-200 hover:bg-brand-50/70 dark:hover:bg-slate-900/90'
                  } ${isSubmitted || (requiresRevealStep && isRevealed) ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-y-0 left-0 w-1 opacity-80 ${
                      isCorrect
                        ? 'bg-gradient-to-b from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-300'
                        : isWrong
                          ? 'bg-gradient-to-b from-rose-600 to-rose-500 dark:from-rose-400 dark:to-rose-300'
                          : 'bg-gradient-to-b from-brand-500 to-orange-500 dark:from-accent-400 dark:to-violet-500'
                    }`}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 pointer-events-none">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-white to-brand-50 dark:from-slate-900 dark:to-accent-500/20 text-slate-700 dark:text-white font-bold text-sm border border-brand-200 dark:border-accent-400/40 transition-colors duration-150 shadow-sm">
                        {keyLabel}
                      </span>
                      <div className="font-semibold flex-1 text-[0.98rem] leading-7">
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 dark:bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                            <svg
                              className="w-3.5 h-3.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Correct
                          </span>
                        )}
                        {isWrong && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-700 dark:bg-rose-500 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white">
                            <svg
                              className="w-3.5 h-3.5 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Incorrect
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Explanation panel */}
        <div className="mt-3">
          {(isRevealed || isSubmitted) ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-5 bg-white/90 dark:bg-slate-950/80 rounded-3xl border border-brand-200/70 dark:border-accent-500/25 backdrop-blur-xl shadow-xl shadow-brand-500/10 dark:shadow-accent-500/10"
            >
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-brand-600 dark:text-accent-300 mt-0.5 flex-shrink-0"
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
                  <p className="font-bold text-slate-900 dark:text-white mb-2 text-sm tracking-[0.14em] uppercase">Explanation</p>
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
            <div className="rounded-3xl border border-brand-200/70 dark:border-accent-500/25 bg-white/70 dark:bg-slate-950/60 min-h-[96px] flex items-center justify-center px-4 py-5 backdrop-blur-lg">
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
      <div className="sticky bottom-0 z-20 flex-shrink-0 mt-2 rounded-2xl border border-brand-200/70 dark:border-accent-500/25 bg-white/85 dark:bg-slate-950/80 backdrop-blur-xl px-3 py-3 shadow-xl shadow-brand-500/10 dark:shadow-accent-500/10">
        {/* Submission Error Display */}
        {submissionError && (
          <div className="flex items-center justify-center gap-2 mb-3 px-4 py-2 bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-500/20 dark:to-red-500/20 border border-rose-300/60 dark:border-rose-400/40 rounded-xl text-rose-700 dark:text-rose-200 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {canReviewNavigate ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3">
            <motion.button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="px-6 py-3 bg-brand-50 dark:bg-slate-900 border border-brand-200 dark:border-accent-500/30 rounded-xl text-slate-700 dark:text-white font-semibold hover:bg-brand-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              Previous
            </motion.button>

            <motion.button
              onClick={handleNext}
              disabled={currentIndex === quizQuestions.length - 1}
              className="px-6 py-3 bg-brand-50 dark:bg-slate-900 border border-brand-200 dark:border-accent-500/30 rounded-xl text-slate-700 dark:text-white font-semibold hover:bg-brand-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
            >
              Next
            </motion.button>

            <motion.button
              onClick={() => setReviewMode(false)}
              className="px-6 py-3 bg-gradient-to-r from-brand-600 via-fuchsia-600 to-orange-500 dark:from-accent-500 dark:via-violet-500 dark:to-brand-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto"
            >
              Back to Results
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3 min-h-[72px] sm:min-h-0">
            {canGoBackDuringAttempt && (
              <motion.button
                onClick={handlePrevious}
                className="px-6 py-3 bg-brand-50 dark:bg-slate-900 border border-brand-200 dark:border-accent-500/30 rounded-xl text-slate-700 dark:text-slate-100 font-semibold hover:bg-brand-100 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
              >
                Previous
              </motion.button>
            )}

            {canReveal && (
              <motion.button
                onClick={handleRevealAnswer}
                className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-brand-600 via-fuchsia-600 to-orange-500 dark:from-accent-500 dark:via-violet-500 dark:to-brand-500 text-white rounded-xl font-bold transition-opacity hover:opacity-90 text-base w-full sm:w-auto sm:min-w-[220px]"
              >
                Reveal Answer
              </motion.button>
            )}

            {canNext && (
              <motion.button
                onClick={handleNext}
                className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-brand-600 via-fuchsia-600 to-orange-500 dark:from-accent-500 dark:via-violet-500 dark:to-brand-500 text-white rounded-xl font-bold transition-opacity hover:opacity-90 text-base w-full sm:w-auto sm:min-w-[220px]"
              >
                Next Question
              </motion.button>
            )}

            {canSubmit && (
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-6 sm:px-8 py-3.5 bg-gradient-to-r from-brand-600 via-fuchsia-600 to-orange-500 dark:from-accent-500 dark:via-violet-500 dark:to-brand-500 text-white rounded-xl font-bold transition-opacity hover:opacity-90 text-base w-full sm:w-auto sm:min-w-[220px] ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
