/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';

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
  onSubmit: (answers: Record<string, string>) => Promise<any>;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type TimeLimit = 'endless' | '5m' | '10m' | '15m';

interface QuizSettings {
  difficulty: Difficulty;
  timeLimit: TimeLimit;
}

export default function QuizPlayer({ title, questions, fileId, onGenerateQuiz, isGenerating, onSubmit }: QuizPlayerProps) {
  // Pre-test config state
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'medium',
    timeLimit: 'endless',
  });

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // New state for delayed feedback
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

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
    }
  }, [questions.length, showSettings, settings.timeLimit]);

  
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
      onGenerateQuiz(settings.difficulty, 10); // Default to 10 questions
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
  }, [settings.difficulty, settings.timeLimit, onGenerateQuiz, fileId]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (!isSubmitted && !isRevealed && currentQuestion) {
      setSelectedOption(option);
      setAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: option,
      }));
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
    setTimerActive(false);
    const result = await onSubmit(answers);
    setResults(result);
    setIsSubmitted(true);
  }, [answers, onSubmit]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setResults(null);
    setShowSettings(true);
    setTimeRemaining(null);
    setTimerActive(false);
    setIsRevealed(false);
    setSelectedOption(null);
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5 backdrop-blur-md"
        >
          <div className="text-center mb-5">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quiz Settings</h2>
            <p className="text-slate-600 dark:text-slate-400 text-base">Configure your quiz before starting</p>
          </div>

          {/* Difficulty Setting */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2">
              <Zap className="w-4 h-4 text-blue-500 dark:text-blue-400" />
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
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 border-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-blue-500/50 hover:bg-slate-200 dark:hover:bg-zinc-800'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </motion.button>
              ))}
            </div>
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
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/50'
                      : 'bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-violet-500/50 hover:bg-slate-200 dark:hover:bg-zinc-800'
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
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold text-lg transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 border border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-violet-600"
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
              <strong className="text-gray-900 dark:text-white">10</strong> questions • <strong className="text-gray-900 dark:text-white">{settings.difficulty}</strong> difficulty • {' '}
              <strong className="text-gray-900 dark:text-white">{settings.timeLimit === 'endless' ? 'No time limit' : settings.timeLimit}</strong>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Final score screen
  if (isSubmitted && results && currentIndex === questions.length - 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-12 text-center backdrop-blur-md"
        >
          <div className="mb-4 sm:mb-6">
            {results.percentage >= 70 ? (
              <svg
                className="w-12 h-12 sm:w-20 sm:h-20 mx-auto text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-12 h-12 sm:w-20 sm:h-20 mx-auto text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">Quiz Complete!</h2>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-6 sm:mb-8">Here's how you did:</p>

          <div className="bg-slate-100 dark:bg-zinc-900/50 rounded-2xl p-8 sm:p-10 mb-8 sm:mb-10 border border-slate-200 dark:border-white/10 shadow-xl backdrop-blur-sm">
            <div className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent mb-4">
              {results.percentage}%
            </div>
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium">
              {results.score} out of {results.total} questions correct
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex(0)}
              className="px-6 sm:px-8 py-3.5 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-white/20 rounded-xl text-slate-700 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-zinc-800 hover:border-slate-400 dark:hover:border-white/30 transition-[background-color,border-color,transform] duration-200 shadow-lg text-sm sm:text-base"
            >
              Review Answers
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRestart}
              className="px-6 sm:px-8 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 shadow-xl shadow-blue-500/50 border border-blue-500/50 text-sm sm:text-base"
            >
              Try Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto px-4 sm:px-0">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-2">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl sm:text-2xl font-bold text-white">{title}</h3>
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
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span className="text-base">{formatTime(timeRemaining)}</span>
            </motion.div>
          )}
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mb-1">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {Object.keys(answers).length} / {questions.length} answered
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-1 w-full bg-slate-200 dark:bg-zinc-900 rounded-full h-2 border border-slate-300 dark:border-white/10">
          <div
            className="bg-gradient-to-r from-blue-500 to-violet-500 h-2 rounded-full transition-[width] duration-300 shadow-lg shadow-blue-500/50"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto mb-2">
        {/* Question */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-zinc-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-3 mb-2 backdrop-blur-md"
        >
          <div className="prose prose-sm dark:prose-invert max-w-none mb-3">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({ node, ...props }) => (
                  <h4 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3" {...props} />
                ),
                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-3" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2" {...props} />,
                strong: ({ node, ...props }) => <strong className="font-bold text-brand-900 dark:text-brand-300" {...props} />,
                em: ({ node, ...props }) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-1.5 text-gray-700 dark:text-gray-300 marker:text-brand-500" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-1.5 text-gray-700 dark:text-gray-300 marker:text-brand-500" {...props} />,
                li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                code: ({ node, className, children, ...props }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code
                      className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-lg text-sm font-mono border border-brand-200 dark:border-brand-800 shadow-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <code
                      className={`block bg-gray-900 dark:bg-gray-950 text-gray-100 p-3 rounded-xl overflow-x-auto text-sm font-mono shadow-lg border border-gray-700 dark:border-gray-800 my-3 ${className || ''}`}
                      {...props}
                    >
                      {children}
                  </code>
                );
              },
            }}
          >
            {currentQuestion.question}
          </ReactMarkdown>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option || userAnswer === option;
            const isCorrectAnswer = option === currentQuestion.correctAnswer;
            const isCorrect = isRevealed && isCorrectAnswer;
            const isWrong = isRevealed && isSelected && !isCorrectAnswer;
            const showSubmittedState = isSubmitted && option === currentQuestion.correctAnswer;
            const showSubmittedWrong = isSubmitted && userAnswer === option && option !== currentQuestion.correctAnswer;

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => handleAnswerSelect(option)}
                disabled={isSubmitted || isRevealed}
                whileHover={!isSubmitted && !isRevealed ? { scale: 1.01 } : {}}
                whileTap={!isSubmitted && !isRevealed ? { scale: 0.98 } : {}}
                className={`w-full text-left p-3 rounded-xl border-2 transition-[background-color,border-color,box-shadow,transform] duration-200 text-sm backdrop-blur-sm ${
                  showSubmittedState || isCorrect
                    ? 'border-green-500 bg-green-500/10 text-green-900 dark:text-white shadow-xl shadow-green-500/20'
                    : showSubmittedWrong || isWrong
                      ? 'border-red-500 bg-red-500/10 text-red-900 dark:text-white shadow-xl shadow-red-500/20'
                      : isSelected && !isRevealed
                        ? 'border-blue-500 bg-blue-500/10 text-blue-900 dark:text-white shadow-xl shadow-blue-500/30'
                        : 'border-slate-300 dark:border-white/10 hover:border-blue-500/50 bg-slate-50 dark:bg-zinc-900/50 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                } ${isSubmitted || isRevealed ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-300 dark:border-white/20">
                      {index + 1}
                    </span>
                    <div className="font-medium flex-1">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ node, ...props }) => <span className="inline" {...props} />,
                          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                          em: ({ node, ...props }) => <em className="italic" {...props} />,
                          code: ({ node, ...props }) => (
                            <code className="bg-gray-100 dark:bg-gray-700 text-brand-600 dark:text-brand-400 px-1.5 py-0.5 rounded text-xs font-mono" {...props} />
                          ),
                        }}
                      >
                        {option}
                      </ReactMarkdown>
                    </div>
                  </div>
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
              className="p-3 bg-gradient-to-br from-blue-50 to-accent-50/50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-lg"
            >
              <div className="flex items-start">
                <svg
                  className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
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
                  <p className="font-bold text-blue-900 dark:text-blue-300 mb-1.5 text-sm">Explanation</p>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed mb-2" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-blue-900 dark:text-blue-100" {...props} />
                      ),
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-1.5 text-blue-800 dark:text-blue-200 marker:text-blue-500" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-1.5 text-blue-800 dark:text-blue-200 marker:text-blue-500" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded-lg text-xs font-mono border border-blue-200 dark:border-blue-800"
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
      </motion.div>
      </div>

      {/* Navigation - Sticky Footer */}
      <div className="flex-shrink-0 sticky bottom-0 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-white/10 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-center">
          {/* Show Reveal Answer button when answer is selected but not yet revealed */}
          {!isSubmitted && !isRevealed && userAnswer && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsRevealed(true)}
              className="px-8 sm:px-10 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-blue-500/50 border-2 border-blue-500/50 text-base sm:text-lg active:scale-95"
            >
              Reveal Answer
            </motion.button>
          )}

          {/* Show Next button when answer is revealed (not last question) */}
          {!isSubmitted && isRevealed && currentIndex < questions.length - 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="px-8 sm:px-10 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-violet-500/50 border-2 border-violet-500/50 text-base sm:text-lg active:scale-95"
            >
              Next Question →
            </motion.button>
          )}

          {/* Show Submit Quiz button on last question after reveal */}
          {!isSubmitted && isRevealed && currentIndex === questions.length - 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              className="px-8 sm:px-10 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-green-500/50 border-2 border-green-500/50 text-base sm:text-lg active:scale-95"
            >
              Submit Quiz
            </motion.button>
          )}

          {/* Show Previous button only after quiz is submitted (review mode) */}
          {isSubmitted && (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
