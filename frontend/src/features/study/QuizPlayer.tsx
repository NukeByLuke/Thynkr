/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'framer-motion';
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
  onSubmit: (answers: Record<string, string>) => Promise<any>;
}

type Difficulty = 'easy' | 'medium' | 'hard';
type TimeLimit = 'endless' | '1m' | '5m' | '10m';

interface QuizSettings {
  difficulty: Difficulty;
  timeLimit: TimeLimit;
}

interface AnswerHistory {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  wasCorrect: boolean;
}

export default function QuizPlayer({ title, questions, onSubmit }: QuizPlayerProps) {
  // Pre-test config state
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'medium',
    timeLimit: 'endless',
  });

  // Quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answerHistory, setAnswerHistory] = useState<AnswerHistory[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // New state for delayed feedback
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);

  
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
  const userAnswer = answers[currentQuestion.id];
  const previousAnswer = currentIndex > 0 ? answerHistory[currentIndex - 1] : null;

  const handleStartQuiz = () => {
    setShowSettings(false);
    // Initialize timer based on selected time limit
    if (settings.timeLimit !== 'endless') {
      const minutes = parseInt(settings.timeLimit);
      setTimeRemaining(minutes * 60);
      setTimerActive(true);
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (!isSubmitted && !isRevealed) {
      setSelectedOption(option);
      setAnswers({
        ...answers,
        [currentQuestion.id]: option,
      });
    }
  };

  const handleRevealAndNext = () => {
    if (!isRevealed) {
      // First click: Reveal the answer
      setIsRevealed(true);
    } else {
      // Second click: Move to next question
      if (currentIndex < questions.length - 1) {
        // Record answer history when moving to next question
        if (userAnswer) {
          const wasCorrect = userAnswer === currentQuestion.correctAnswer;
          setAnswerHistory([
            ...answerHistory,
            {
              questionId: currentQuestion.id,
              userAnswer,
              correctAnswer: currentQuestion.correctAnswer,
              wasCorrect,
            },
          ]);
        }
        setCurrentIndex(currentIndex + 1);
        setIsRevealed(false);
        setSelectedOption(null);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsRevealed(false);
      setSelectedOption(null);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setTimerActive(false);
    const result = await onSubmit(answers);
    setResults(result);
    setIsSubmitted(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setAnswerHistory([]);
    setIsSubmitted(false);
    setResults(null);
    setShowSettings(true);
    setTimeRemaining(null);
    setTimerActive(false);
    setIsRevealed(false);
    setSelectedOption(null);
  };

  const isQuestionAnswered = (questionId: string) => {
    return !!answers[questionId];
  };

  const allQuestionsAnswered = questions.every((q) => isQuestionAnswered(q.id));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Pre-test Settings Screen
  if (showSettings) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-zinc-950 rounded-2xl shadow-2xl border border-white/10 p-10 backdrop-blur-md"
        >
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-white mb-3">Quiz Settings</h2>
            <p className="text-slate-400 text-lg">Configure your quiz before starting</p>
          </div>

          {/* Difficulty Setting */}
          <div className="mb-8">
            <label className="flex items-center gap-2 text-base font-bold text-white mb-4">
              <Zap className="w-5 h-5 text-blue-400" />
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-4">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map((level) => (
                <motion.button
                  key={level}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, difficulty: level })}
                  className={`py-4 px-5 rounded-xl font-bold text-base transition-[background-color,border-color,box-shadow,transform] duration-200 border ${
                    settings.difficulty === level
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 border-blue-500 text-white shadow-lg shadow-blue-500/50'
                      : 'bg-zinc-900 border-white/10 text-slate-300 hover:border-blue-500/50 hover:bg-zinc-800'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Time Limit Setting */}
          <div className="mb-10">
            <label className="flex items-center gap-2 text-base font-bold text-white mb-4">
              <Clock className="w-5 h-5 text-violet-400" />
              Time Limit
            </label>
            <div className="grid grid-cols-4 gap-4">
              {(['endless', '1m', '5m', '10m'] as TimeLimit[]).map((time) => (
                <motion.button
                  key={time}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettings({ ...settings, timeLimit: time })}
                  className={`py-4 px-5 rounded-xl font-bold text-base transition-[background-color,border-color,box-shadow,transform] duration-200 border ${
                    settings.timeLimit === time
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/50'
                      : 'bg-zinc-900 border-white/10 text-slate-300 hover:border-violet-500/50 hover:bg-zinc-800'
                  }`}
                >
                  {time === 'endless' ? 'Endless' : time}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartQuiz}
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold text-xl transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-blue-500/50 hover:shadow-blue-500/70 border border-blue-500/50"
          >
            Start Quiz
          </motion.button>

          {/* Info Summary */}
          <div className="mt-8 p-5 bg-zinc-900/50 rounded-xl border border-white/10 backdrop-blur-sm">
            <p className="text-base text-slate-300 text-center font-medium">
              <strong className="text-white">{questions.length}</strong> questions • <strong className="text-white">{settings.difficulty}</strong> difficulty • {' '}
              <strong className="text-white">{settings.timeLimit === 'endless' ? 'No time limit' : settings.timeLimit}</strong>
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
          className="bg-zinc-950 rounded-2xl shadow-2xl border border-white/10 p-6 sm:p-12 text-center backdrop-blur-md"
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

          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Quiz Complete!</h2>
          <p className="text-lg sm:text-xl text-slate-400 mb-6 sm:mb-8">Here's how you did:</p>

          <div className="bg-zinc-900/50 rounded-2xl p-8 sm:p-10 mb-8 sm:mb-10 border border-white/10 shadow-xl backdrop-blur-sm">
            <div className="text-6xl sm:text-7xl font-bold bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent mb-4">
              {results.percentage}%
            </div>
            <p className="text-base sm:text-lg text-slate-300 font-medium">
              {results.score} out of {results.total} questions correct
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex(0)}
              className="px-6 sm:px-8 py-3.5 bg-zinc-900 border border-white/20 rounded-xl text-white font-bold hover:bg-zinc-800 hover:border-white/30 transition-[background-color,border-color,transform] duration-200 shadow-lg text-sm sm:text-base"
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
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-2xl sm:text-3xl font-bold text-white">{title}</h3>
          {/* Timer Display */}
          {timeRemaining !== null && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                timeRemaining < 60
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  : timeRemaining < 180
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="text-lg">{formatTime(timeRemaining)}</span>
            </motion.div>
          )}
        </div>
        
        {/* Previous Answer Feedback - Show on questions after the first */}
        <AnimatePresence>
          {previousAnswer && currentIndex > 0 && !isSubmitted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`mb-4 p-4 rounded-xl border-2 backdrop-blur-sm ${
                previousAnswer.wasCorrect
                  ? 'bg-green-500/10 border-green-500 shadow-lg shadow-green-500/20'
                  : 'bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {previousAnswer.wasCorrect ? (
                  <>
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-base font-bold text-green-400">
                      Previous Answer: Correct! ✓
                    </span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-base font-bold text-red-400">
                        Previous Answer: Incorrect ✗
                      </p>
                      <p className="text-sm text-red-300 mt-1">
                        Correct answer was: <strong className="text-white">{previousAnswer.correctAnswer}</strong>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between text-sm sm:text-base text-slate-300 font-medium mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {Object.keys(answers).length} / {questions.length} answered
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 w-full bg-zinc-900 rounded-full h-3 border border-white/10">
          <div
            className="bg-gradient-to-r from-blue-500 to-violet-500 h-3 rounded-full transition-[width] duration-300 shadow-lg shadow-blue-500/50"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-950 rounded-2xl shadow-2xl border border-white/10 p-8 sm:p-12 mb-6 sm:mb-8 backdrop-blur-md"
      >
        <div className="prose prose-sm sm:prose-lg dark:prose-invert max-w-none mb-6 sm:mb-8">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              p: ({ node, ...props }) => (
                <h4 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-4" {...props} />
              ),
              h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-bold text-brand-900 dark:text-brand-300" {...props} />,
              em: ({ node, ...props }) => <em className="italic text-gray-700 dark:text-gray-300" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-2 text-gray-700 dark:text-gray-300 marker:text-brand-500" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-2 text-gray-700 dark:text-gray-300 marker:text-brand-500" {...props} />,
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
                    className={`block bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono shadow-lg border border-gray-700 dark:border-gray-800 my-4 ${className || ''}`}
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

        <div className="space-y-3 sm:space-y-4">
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
                className={`w-full text-left p-5 sm:p-6 rounded-xl border-2 transition-[background-color,border-color,box-shadow,transform] duration-200 text-base sm:text-lg backdrop-blur-sm ${
                  showSubmittedState || isCorrect
                    ? 'border-green-500 bg-green-500/10 text-white shadow-xl shadow-green-500/20'
                    : showSubmittedWrong || isWrong
                      ? 'border-red-500 bg-red-500/10 text-white shadow-xl shadow-red-500/20'
                      : isSelected && !isRevealed
                        ? 'border-blue-500 bg-blue-500/10 text-white shadow-xl shadow-blue-500/30'
                        : 'border-white/10 hover:border-blue-500/50 bg-zinc-900/50 text-slate-200 hover:bg-zinc-800/50'
                } ${isSubmitted || isRevealed ? 'cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium pr-2 flex-1">
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

        {/* Explanation */}
        {(isRevealed || isSubmitted) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-accent-50/50 dark:from-blue-900/20 dark:to-violet-900/20 rounded-lg border border-blue-200 dark:border-blue-800 shadow-md"
          >
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
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
                <p className="font-bold text-blue-900 dark:text-blue-300 mb-3 text-base sm:text-lg">Explanation</p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-blue-800 dark:text-blue-200 text-sm sm:text-base leading-relaxed mb-3" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-bold text-blue-900 dark:text-blue-100" {...props} />
                      ),
                      em: ({ node, ...props }) => <em className="italic" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-2 text-blue-800 dark:text-blue-200 marker:text-blue-500" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-2 text-blue-800 dark:text-blue-200 marker:text-blue-500" {...props} />,
                      li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
                      code: ({ node, className, children, ...props }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code
                            className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-lg text-xs font-mono border border-blue-200 dark:border-blue-800"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className={`block bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs font-mono shadow-lg border border-gray-700 my-3 ${className || ''}`}
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
      </motion.div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-5 sm:px-6 py-3.5 bg-zinc-900 border-2 border-white/20 rounded-xl text-white font-bold hover:bg-zinc-800 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-[background-color,border-color,transform] duration-200 shadow-lg text-sm sm:text-base active:scale-95"
        >
          <span className="hidden sm:inline">← Previous</span>
          <span className="sm:hidden">←</span>
        </motion.button>

        {!isSubmitted && currentIndex < questions.length - 1 && userAnswer && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRevealAndNext}
            className={`px-6 sm:px-8 py-4 rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 text-base sm:text-lg active:scale-95 ${
              isRevealed
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-2xl shadow-violet-500/50 border border-violet-500/50'
                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-2xl shadow-blue-500/50 border border-blue-500/50'
            }`}
          >
            {isRevealed ? 'Next Question →' : 'Reveal Answer'}
          </motion.button>
        )}

        {!isSubmitted && allQuestionsAnswered && currentIndex === questions.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="px-8 sm:px-10 py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl font-bold transition-[background-image,box-shadow,transform] duration-200 shadow-2xl shadow-blue-500/50 border border-blue-500/50 text-base sm:text-lg active:scale-95"
          >
            Submit Quiz
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1 || (!isSubmitted && !isRevealed)}
          className="px-5 sm:px-6 py-3.5 bg-zinc-900 border-2 border-white/20 rounded-xl text-white font-bold hover:bg-zinc-800 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-[background-color,border-color,transform] duration-200 shadow-lg text-sm sm:text-base active:scale-95"
        >
          <span className="hidden sm:inline">Next →</span>
          <span className="sm:hidden">→</span>
        </motion.button>
      </div>

      {/* Question indicators */}
      <div className="mt-6 sm:mt-8 flex flex-wrap gap-2 sm:gap-3 justify-center">
        {questions.map((question, index) => {
          const isAnswered = isQuestionAnswered(question.id);
          const isCurrent = index === currentIndex;
          const isCorrect = isSubmitted && results?.results[question.id]?.correct;
          const isWrong = isSubmitted && !results?.results[question.id]?.correct && isAnswered;

          return (
            <motion.button
              key={question.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex(index)}
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl font-bold transition-[background-color,box-shadow,transform] duration-200 text-sm sm:text-base backdrop-blur-sm active:scale-95 ${
                isCurrent ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-zinc-950' : ''
              } ${
                isCorrect
                  ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
                  : isWrong
                    ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30'
                    : isAnswered
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white hover:from-blue-700 hover:to-violet-700 shadow-lg shadow-blue-500/30'
                      : 'bg-zinc-900 border border-white/10 text-slate-300 hover:bg-zinc-800 hover:border-white/20'
              }`}
            >
              {index + 1}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
