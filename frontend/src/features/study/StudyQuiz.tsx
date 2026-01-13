import { useState, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  ChevronRight,
  RotateCcw,
  Trophy,
  AlertCircle,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
  difficulty?: string;
  sourceFiles?: string[];
}

interface StudyQuizProps {
  data: QuizData;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const StudyQuiz = memo(function StudyQuiz({ data, onRegenerate, isRegenerating = false }: StudyQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState<number | null>(null);

  const totalQuestions = data.questions.length;
  const answeredCount = Object.keys(answers).length;
  const question = data.questions[currentQuestion];

  // Memoize score calculation
  const score = useMemo(() => {
    let correct = 0;
    data.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    return correct;
  }, [answers, data.questions]);

  // Memoize handlers
  const selectAnswer = useCallback((answer: string) => {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
  }, [showResults, currentQuestion]);

  const nextQuestion = useCallback(() => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(null);
    }
  }, [currentQuestion, totalQuestions]);

  const prevQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(null);
    }
  }, [currentQuestion]);

  const submitQuiz = useCallback(() => {
    setShowResults(true);
    setCurrentQuestion(0);
  }, []);

  const resetQuiz = useCallback(() => {
    setAnswers({});
    setShowResults(false);
    setCurrentQuestion(0);
    setShowExplanation(null);
  }, []);

  // Memoize option class function
  const getOptionClass = useCallback((option: string) => {
    const isSelected = answers[currentQuestion] === option;
    const isCorrect = option === question.correctAnswer;

    if (!showResults) {
      return isSelected
        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800';
    }

    if (isCorrect) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    }
    if (isSelected && !isCorrect) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    }
    return 'border-gray-200 dark:border-gray-700 opacity-50';
  }, [answers, currentQuestion, question.correctAnswer, showResults]);

  const scorePercentage = useMemo(() => 
    Math.round((score / totalQuestions) * 100)
  , [score, totalQuestions]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-purple-500" />
            {data.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalQuestions} questions
            {data.difficulty && ` • ${data.difficulty}`}
            {!showResults && ` • ${answeredCount} answered`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showResults && (
            <button
              onClick={resetQuiz}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              Retry
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="Regenerate quiz"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className={`h-full transition-all duration-300 ${
            showResults
              ? scorePercentage >= 70
                ? 'bg-green-500'
                : scorePercentage >= 40
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              : 'bg-blue-500'
          }`}
          style={{
            width: showResults
              ? `${scorePercentage}%`
              : `${((currentQuestion + 1) / totalQuestions) * 100}%`,
          }}
        />
      </div>

      {/* Results Summary */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 flex items-center gap-4 ${
            scorePercentage >= 70
              ? 'bg-green-50 dark:bg-green-900/20'
              : scorePercentage >= 40
                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
          }`}
        >
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full ${
              scorePercentage >= 70
                ? 'bg-green-100 dark:bg-green-900/40'
                : scorePercentage >= 40
                  ? 'bg-yellow-100 dark:bg-yellow-900/40'
                  : 'bg-red-100 dark:bg-red-900/40'
            }`}
          >
            {scorePercentage >= 70 ? (
              <Trophy className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : scorePercentage >= 40 ? (
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            )}
          </div>
          <div>
            <p
              className={`font-semibold ${
                scorePercentage >= 70
                  ? 'text-green-700 dark:text-green-300'
                  : scorePercentage >= 40
                    ? 'text-yellow-700 dark:text-yellow-300'
                    : 'text-red-700 dark:text-red-300'
              }`}
            >
              {scorePercentage >= 70
                ? 'Great job!'
                : scorePercentage >= 40
                  ? 'Keep practicing!'
                  : 'Needs more study'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You scored {score} out of {totalQuestions} ({scorePercentage}%)
            </p>
          </div>
        </motion.div>
      )}

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Question Number */}
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">
              Question {currentQuestion + 1} of {totalQuestions}
            </p>

            {/* Question Text */}
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              {question.question}
            </h4>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, i) => {
                const isSelected = answers[currentQuestion] === option;
                const isCorrect = option === question.correctAnswer;

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(option)}
                    disabled={showResults}
                    className={`w-full flex items-center gap-3 p-4 text-left rounded-xl border-2 transition-all ${getOptionClass(option)}`}
                  >
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                        isSelected || (showResults && isCorrect)
                          ? 'border-current bg-current/10'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {showResults ? (
                        isCorrect ? (
                          <Check className="h-4 w-4" />
                        ) : isSelected ? (
                          <X className="h-4 w-4" />
                        ) : (
                          String.fromCharCode(65 + i)
                        )
                      ) : (
                        String.fromCharCode(65 + i)
                      )}
                    </span>
                    <span className="flex-1">{option}</span>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResults && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
                className="mt-6"
              >
                <button
                  onClick={() =>
                    setShowExplanation(showExplanation === currentQuestion ? null : currentQuestion)
                  }
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {showExplanation === currentQuestion ? 'Hide explanation' : 'Show explanation'}
                </button>
                <AnimatePresence>
                  {showExplanation === currentQuestion && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="mt-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {question.explanation}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <button
          onClick={prevQuestion}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {/* Question dots */}
        <div className="flex items-center gap-1 flex-wrap justify-center max-w-xs">
          {data.questions.map((_, i) => {
            const isAnswered = answers[i] !== undefined;
            const isCorrect = showResults && answers[i] === data.questions[i].correctAnswer;
            const isWrong =
              showResults &&
              answers[i] !== undefined &&
              answers[i] !== data.questions[i].correctAnswer;

            return (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentQuestion
                    ? 'w-4 bg-primary-600'
                    : isCorrect
                      ? 'bg-green-500'
                      : isWrong
                        ? 'bg-red-500'
                        : isAnswered
                          ? 'bg-primary-400'
                          : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            );
          })}
        </div>

        {!showResults ? (
          currentQuestion === totalQuestions - 1 ? (
            <button
              onClick={submitQuiz}
              disabled={answeredCount < totalQuestions}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )
        ) : (
          <button
            onClick={nextQuestion}
            disabled={currentQuestion === totalQuestions - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo - only re-render if data or regenerating changes
  return prevProps.data === nextProps.data && 
         prevProps.isRegenerating === nextProps.isRegenerating;
});

export default StudyQuiz;
