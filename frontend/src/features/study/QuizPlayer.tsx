/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Volume2, Loader2, AlertTriangle } from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';

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
type TimeLimit = 'endless' | '5m' | '10m' | '15m';

interface QuizSettings {
  difficulty: Difficulty;
  timeLimit: TimeLimit;
}

export default function QuizPlayer({ title, questions, fileId, onGenerateQuiz, isGenerating, onSubmit }: QuizPlayerProps) {
  // TTS hook for audio playback - tracks which item is currently playing
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const { isPlaying, isLoading: isTTSLoading, toggle: toggleTTS, stop: stopTTS } = useTTS({
    onPlayStart: () => {},
    onPlayEnd: () => setPlayingItem(null),
  });
  
  // Pre-test config state
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'medium',
    timeLimit: 'endless',
  });
  const [numQuestions, setNumQuestions] = useState(10);

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [reviewMode, setReviewMode] = useState(false);
  
  // New state for delayed feedback
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
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

  // When quiz generation completes, hide settings and start quiz
  useEffect(() => {
    if (questions.length > 0 && showSettings) {
      setShowSettings(false);
      // Initialize timer based on selected time limit
      if (settings.timeLimit !== 'endless') {
        const minutes = parseInt(settings.timeLimit);
        setTimeRemaining(minutes * 60);
        setTimerActive(true);
      }
      // Start tracking time
      setQuizStartTime(Date.now());
    }
  }, [questions.length, showSettings, settings.timeLimit]);

  // Track timing when question changes
  useEffect(() => {
    const question = questions[currentIndex];
    if (question && !isSubmitted) {
      // Start timing for this question
      questionStartTimes.current[question.id] = Date.now();
    }
  }, [currentIndex, isSubmitted, questions]);

  
  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || !timerActive) return;
    
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, timerActive]);

  const currentQuestion = questions[currentIndex];
  const userAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Memoize handlers to prevent unnecessary re-renders
  const handleStartQuiz = useCallback(() => {
    if (onGenerateQuiz && fileId) {
      // Trigger quiz generation with current settings
      onGenerateQuiz(settings.difficulty, numQuestions);
    } else {
      // No generation needed, just start the quiz
      setShowSettings(false);
      // Initialize timer based on selected time limit
      if (settings.timeLimit !== 'endless') {
        const minutes = parseInt(settings.timeLimit);
        setTimeRemaining(minutes * 60);
        setTimerActive(true);
      }
    }
  }, [settings.difficulty, settings.timeLimit, numQuestions, onGenerateQuiz, fileId]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (!isSubmitted && !isRevealed && currentQuestion) {
      setSelectedOption(option);
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: option,
      }));
      
      // Clear any previous submission error when user changes answer
      setSubmissionError(null);
      
      // Record timing for this question
      const startTime = questionStartTimes.current[currentQuestion.id];
      if (startTime) {
        const timeSpent = (Date.now() - startTime) / 1000; // Convert to seconds
        setQuestionTimings(timings => ({
          ...timings,
          [currentQuestion.id]: timeSpent
        }));
      }
    }
  }, [isSubmitted, isRevealed, currentQuestion]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
      setSelectedOption(null);
    }
  }, [currentIndex, questions.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

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
  }, [answers, onSubmit, quizStartTime, questionTimings, isSubmitted]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    setIsSubmitted(false);
    setResults(null);
    setShowSettings(true);
    setTimeRemaining(null);
    setTimerActive(false);
    setIsRevealed(false);
    setSelectedOption(null);
    setQuizStartTime(null);
    setReviewMode(false);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // If no questions provided, always show settings
  if (questions.length === 0 || showSettings) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <div
          className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5 backdrop-blur-md"
        >
          <div className="text-center mb-5">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Settings</h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">Configure your quiz before starting</p>
          </div>

          {/* Difficulty Setting */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2">
              <Zap className="w-4 h-4 text-brand-500 dark:text-accent-400" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, difficulty: level })}
                  disabled={isGenerating}
                  className={`py-2.5 px-4 rounded-xl font-bold text-sm transition-[background-color,border-color,box-shadow,transform] duration-200 border ${
                    settings.difficulty === level
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 border-brand-400 dark:border-accent-400 text-white shadow-lg shadow-brand-500/50 dark:shadow-accent-500/50'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/50 dark:hover:border-accent-500/50 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Number of Questions */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              Questions
            </label>
            <div className="flex items-center justify-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNumQuestions(Math.max(10, numQuestions - 5))}
                disabled={isGenerating || numQuestions <= 10}
                className="w-12 h-12 rounded-xl font-bold text-xl bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                −
              </motion.button>
              <span className="w-16 text-center text-2xl font-bold text-gray-900 dark:text-white">
                {numQuestions}
              </span>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setNumQuestions(numQuestions + 5)}
                disabled={isGenerating}
                className="w-12 h-12 rounded-xl font-bold text-xl bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                +
              </motion.button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">Minimum 10 questions</p>
          </div>

          {/* Time Limit Setting */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2">
              <Clock className="w-4 h-4 text-violet-500 dark:text-violet-400" />
              Time Limit
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['endless', '5m', '10m', '15m'] as TimeLimit[]).map((time) => (
                <motion.button
                  key={time}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, timeLimit: time })}
                  disabled={isGenerating}
                  className={`py-2.5 px-4 rounded-xl font-bold text-sm transition-[background-color,border-color,box-shadow,transform] duration-200 border ${
                    settings.timeLimit === time
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 border-brand-400 dark:border-accent-400 text-white shadow-lg shadow-brand-500/50 dark:shadow-accent-500/50'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-brand-500/50 dark:hover:border-accent-500/50 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {time === 'endless' ? 'Endless' : time}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: isGenerating ? 1 : 1.02 }}
            whileTap={{ scale: isGenerating ? 1 : 0.95 }}
            onClick={handleStartQuiz}
            disabled={isGenerating}
            className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 hover:from-brand-600 hover:to-brand-700 dark:hover:from-accent-600 dark:hover:to-accent-700 text-white rounded-xl font-bold text-lg transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-brand-500/50 dark:shadow-accent-500/50 hover:shadow-brand-500/70 dark:hover:shadow-accent-500/70 border border-brand-400/50 dark:border-accent-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Quiz...
              </span>
            ) : (
              'Start Quiz'
            )}
          </motion.button>

          {/* Info Summary */}
          <div className="mt-4 p-3 bg-slate-100 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-white/10 backdrop-blur-sm">
            <p className="text-sm text-slate-600 dark:text-slate-300 text-center font-medium">
              <strong className="text-gray-900 dark:text-white">{numQuestions}</strong> question{numQuestions !== 1 ? 's' : ''} • <strong className="text-gray-900 dark:text-white">{settings.difficulty}</strong> difficulty • {' '}
              <strong className="text-gray-900 dark:text-white">{settings.timeLimit === 'endless' ? 'No time limit' : settings.timeLimit}</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Final score screen - show when submitted but NOT in review mode
  if (isSubmitted && results && !reviewMode) {
    const isPassing = results.percentage >= 70;
    
    return (
      <div className="max-w-md mx-auto px-4 sm:px-0">
        <div
          className="bg-white/90 dark:bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-white/10 p-6 text-center shadow-xl"
        >
          {/* Compact header with icon */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPassing ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
              {isPassing ? (
                <svg className="w-5 h-5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Quiz Complete</h2>
          </div>

          {/* Score display - inline and compact */}
          <div className="flex items-baseline justify-center gap-2 mb-2">
            <span className={`text-5xl font-bold ${isPassing ? 'text-green-500 dark:text-green-400' : 'text-amber-500 dark:text-amber-400'}`}>
              {results.percentage}%
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            {results.score}/{results.total} correct
          </p>

          {/* Compact button row */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setCurrentIndex(0);
                setReviewMode(true);
              }}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
            >
              Review
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRestart}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 transition-colors"
            >
              Retry
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRestart}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 hover:from-brand-600 hover:to-brand-700 dark:hover:from-accent-600 dark:hover:to-accent-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-brand-500/25 dark:shadow-accent-500/25"
            >
              Continue
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 sm:px-0">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h3>
          {/* Timer Display */}
          {timeRemaining !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold ${
                timeRemaining < 60
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : timeRemaining < 180
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-brand-100 dark:bg-accent-900/30 text-brand-700 dark:text-accent-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-base">{formatTime(timeRemaining)}</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 dark:text-slate-400 font-medium mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-brand-500/10 to-accent-500/10 border border-brand-500/30 dark:border-accent-500/30 rounded-lg text-brand-600 dark:text-accent-300 font-bold">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {Object.keys(answers).length} / {questions.length} answered
          </span>
        </div>
        {/* Progress bar - Enhanced with glow */}
        <div className="mt-1 w-full bg-slate-200 dark:bg-zinc-900/80 rounded-full h-3 border border-slate-300 dark:border-zinc-700">
          <div
            className="bg-gradient-to-r from-brand-500 via-brand-600 to-accent-600 h-3 rounded-full transition-[width] duration-150 shadow-lg shadow-brand-500/50 dark:shadow-accent-500/50"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto mb-2 max-w-4xl mx-auto w-full">
        {/* Question - Premium Glassmorphic Card with Ambient Glow */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            className="relative mb-4">
            {/* Ambient Spotlight Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-brand-600/5 to-accent-500/5 blur-3xl -z-10 rounded-3xl" />
            
            <div className="bg-white/80 dark:bg-zinc-950/40 backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-2xl">
              <div className="flex items-start gap-3">
                <div className="flex-1 prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-4 text-balance leading-snug" {...props} />
                      ),
                      h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 text-balance" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-balance" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2" {...props} />,
                      strong: ({ node, ...props }) => <strong className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-accent-600 dark:from-brand-400 dark:to-accent-400" {...props} />,
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
                  className="flex-shrink-0 p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors disabled:opacity-50"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option || userAnswer === option;
            const isCorrectAnswer = option === currentQuestion.correctAnswer;
            const isCorrect = isRevealed && isCorrectAnswer;
            const isWrong = isRevealed && isSelected && !isCorrectAnswer;
            const showSubmittedState = isSubmitted && option === currentQuestion.correctAnswer;
            const showSubmittedWrong = isSubmitted && userAnswer === option && option !== currentQuestion.correctAnswer;
            const keyLabel = ['A', 'B', 'C', 'D'][index];

            return (
              <motion.button
                key={index}
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                onClick={() => handleAnswerSelect(option)}
                disabled={isSubmitted || isRevealed}
                whileTap={!isSubmitted && !isRevealed ? { scale: 0.98 } : {}}
                className={`group relative w-full text-left p-4 rounded-2xl border-2 transition-all duration-150 text-base backdrop-blur-xl cursor-pointer ${
                  showSubmittedState || isCorrect
                    ? 'border-green-500 bg-green-500/20 text-green-900 dark:text-white shadow-2xl shadow-green-500/30'
                    : showSubmittedWrong || isWrong
                      ? 'border-red-500 bg-red-500/20 text-red-900 dark:text-white shadow-2xl shadow-red-500/30'
                      : isSelected && !isRevealed
                        ? 'border-transparent bg-brand-500/20 dark:bg-accent-500/20 text-slate-900 dark:text-white shadow-2xl shadow-brand-500/40 dark:shadow-accent-500/40 before:absolute before:inset-0 before:rounded-2xl before:p-[2px] before:bg-gradient-to-br before:from-brand-400 before:to-brand-600 dark:before:from-accent-400 dark:before:to-accent-600 before:-z-10'
                        : 'border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 bg-white/80 dark:bg-zinc-900/50 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:shadow-lg'
                } ${isSubmitted || isRevealed ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 pointer-events-none">
                    {/* Keyboard Shortcut Keycap */}
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 dark:from-zinc-700 dark:to-zinc-800 text-slate-700 dark:text-white font-bold text-sm border-2 border-slate-300 dark:border-zinc-600 shadow-lg group-hover:from-brand-500 group-hover:to-brand-600 dark:group-hover:from-accent-500 dark:group-hover:to-accent-600 group-hover:border-brand-400 dark:group-hover:border-accent-400 group-hover:text-white transition-all duration-200">
                      {keyLabel}
                    </span>
                    <div className="font-semibold flex-1 text-base">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ node, ...props }) => <span className="inline" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold text-brand-600 dark:text-accent-300" {...props} />,
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
                    className="flex-shrink-0 p-1.5 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-500/20 rounded-md transition-colors disabled:opacity-50 pointer-events-auto"
                    title="Read option aloud"
                  >
                    {isTTSLoading && playingItem === `option-${currentQuestion.id}-${index}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  {(isRevealed || isSubmitted) && (
                    <>
                      {(isCorrect || showSubmittedState) && (
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
                      {(isWrong || showSubmittedWrong) && (
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

        {/* Explanation - Fixed height to prevent layout shift */}
        <div className="mt-3 min-h-[100px]">
          {(isRevealed || isSubmitted) && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 bg-gradient-to-br from-brand-50 to-accent-50/50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-xl border-2 border-brand-300 dark:border-accent-700 shadow-lg"
            >
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 text-brand-600 dark:text-accent-400 mt-0.5 mr-2 flex-shrink-0"
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
                  <p className="font-bold text-brand-900 dark:text-accent-300 mb-1.5 text-sm">Explanation</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-brand-800 dark:text-accent-200 text-sm leading-relaxed mb-2" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-brand-900 dark:text-accent-100" {...props} />
                      ),
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-1.5 text-brand-800 dark:text-accent-200 marker:text-brand-500 dark:marker:text-accent-500" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-1.5 text-brand-800 dark:text-accent-200 marker:text-brand-500 dark:marker:text-accent-500" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-brand-100 dark:bg-accent-900/40 text-brand-900 dark:text-accent-200 px-1.5 py-0.5 rounded-lg text-xs font-mono border border-brand-200 dark:border-accent-800"
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
          )}
        </div>
      </div>

      {/* Navigation - Sticky Footer */}
      <div className="flex-shrink-0 pt-4 pb-2">
        {/* Submission Error Display */}
        {submissionError && (
          <div className="flex items-center justify-center gap-2 mb-3 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}
        <div className="flex items-center justify-center">
          {/* Show Reveal Answer button when answer is selected but not yet revealed with pulse */}
          {!isSubmitted && !isRevealed && userAnswer && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              onClick={() => setIsRevealed(true)}
              className="px-8 sm:px-10 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 hover:from-brand-600 hover:to-brand-700 dark:hover:from-accent-600 dark:hover:to-accent-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-150 shadow-2xl shadow-brand-500/50 dark:shadow-accent-500/50 border-2 border-brand-400/50 dark:border-accent-400/50 text-base sm:text-lg"
            >
              Reveal Answer
            </motion.button>
          )}

          {/* Show Next button when answer is revealed (not last question) with pulse animation */}
          {!isSubmitted && isRevealed && currentIndex < questions.length - 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: [0.25, 0.1, 0.25, 1.0] }}
              onClick={handleNext}
              className="px-8 sm:px-10 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 hover:from-brand-600 hover:to-brand-700 dark:hover:from-accent-600 dark:hover:to-accent-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-150 shadow-2xl shadow-brand-500/50 dark:shadow-accent-500/50 border-2 border-brand-400/50 dark:border-accent-400/50 text-base sm:text-lg"
            >
              Next Question →
            </motion.button>
          )}

          {/* Show Submit Quiz button on last question after reveal */}
          {!isSubmitted && isRevealed && currentIndex === questions.length - 1 && (
            <motion.button
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.95 } : {}}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-8 sm:px-10 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-150 shadow-2xl shadow-green-500/50 border-2 border-green-500/50 text-base sm:text-lg active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </motion.button>
          )}

          {/* Show Previous button only after quiz is submitted (review mode) */}
          {isSubmitted && reviewMode && (
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-slate-100 dark:bg-zinc-900 border-2 border-slate-300 dark:border-white/20 rounded-xl text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,border-color,transform] duration-200 shadow-lg text-base active:scale-95"
              >
                ← Previous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={currentIndex === questions.length - 1}
                className="px-6 py-3 bg-slate-100 dark:bg-zinc-900 border-2 border-slate-300 dark:border-white/20 rounded-xl text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed transition-[background-color,border-color,transform] duration-200 shadow-lg text-base active:scale-95"
              >
                Next →
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setReviewMode(false)}
                className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 dark:from-accent-500 dark:to-accent-600 hover:from-brand-600 hover:to-brand-700 dark:hover:from-accent-600 dark:hover:to-accent-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 shadow-xl shadow-brand-500/50 dark:shadow-accent-500/50 border border-brand-400/50 dark:border-accent-400/50 text-base active:scale-95"
              >
                Back to Results
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
