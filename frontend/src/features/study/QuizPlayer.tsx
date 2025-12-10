/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion } from 'framer-motion';

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

export default function QuizPlayer({ title, questions, onSubmit }: QuizPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);

  const currentQuestion = questions[currentIndex];
  const userAnswer = answers[currentQuestion.id];

  const handleAnswerSelect = (option: string) => {
    if (!isSubmitted) {
      setAnswers({
        ...answers,
        [currentQuestion.id]: option,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const result = await onSubmit(answers);
    setResults(result);
    setIsSubmitted(true);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitted(false);
    setResults(null);
  };

  const isQuestionAnswered = (questionId: string) => {
    return !!answers[questionId];
  };

  const allQuestionsAnswered = questions.every((q) => isQuestionAnswered(q.id));

  // Final score screen
  if (isSubmitted && results && currentIndex === questions.length - 1) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-xl border-2 border-brand-100/50 dark:border-gray-700 p-6 sm:p-10 text-center"
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

          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">Here's how you did:</p>

          <div className="bg-gradient-to-br from-brand-50/50 to-accent-50/50 dark:from-brand-900/20 dark:to-accent-900/20 rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8 border-2 border-brand-100/50 dark:border-brand-800 shadow-md">
            <div className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent mb-3">
              {results.percentage}%
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {results.score} out of {results.total} questions correct
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentIndex(0)}
              className="px-6 sm:px-8 py-3 bg-white dark:bg-gray-800 border-2 border-brand-300 dark:border-brand-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-brand-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-md text-sm sm:text-base"
            >
              Review Answers
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRestart}
              className="px-6 sm:px-8 py-3 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
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
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>
            {Object.keys(answers).length} / {questions.length} answered
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-brand-600 to-accent-600 h-2 rounded-full transition-all duration-300 shadow-sm"
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
        className="bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-lg border-2 border-brand-100/50 dark:border-gray-700 p-6 sm:p-10 mb-6 sm:mb-8"
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
            const isSelected = userAnswer === option;
            const isCorrect = isSubmitted && option === currentQuestion.correctAnswer;
            const isWrong = isSubmitted && isSelected && option !== currentQuestion.correctAnswer;

            return (
              <motion.button
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                onClick={() => handleAnswerSelect(option)}
                disabled={isSubmitted}
                whileHover={!isSubmitted ? { scale: 1.02, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" } : {}}
                whileTap={!isSubmitted ? { scale: 0.98 } : {}}
                className={`w-full text-left p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 text-sm sm:text-base shadow-sm ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600'
                    : isWrong
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                      : isSelected
                        ? 'border-brand-600 bg-gradient-to-r from-brand-50/50 to-accent-50/50 dark:from-brand-900/20 dark:to-accent-900/20 dark:border-brand-500 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-brand-300 dark:hover:border-brand-600 bg-white dark:bg-gray-800'
                } ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                  {isSubmitted && (
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

        {/* Explanation */}
        {isSubmitted && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-accent-50/50 dark:from-blue-900/20 dark:to-accent-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-md"
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
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-4 sm:px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm text-sm sm:text-base"
        >
          <span className="hidden sm:inline">← Previous</span>
          <span className="sm:hidden">←</span>
        </motion.button>

        {!isSubmitted && allQuestionsAnswered && currentIndex === questions.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="px-6 sm:px-8 py-2.5 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 text-white rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            Submit Quiz
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="px-4 sm:px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm text-sm sm:text-base"
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
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentIndex(index)}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl font-semibold transition-all duration-300 shadow-sm text-sm sm:text-base ${
                isCurrent ? 'ring-2 ring-brand-600 dark:ring-brand-400 ring-offset-2 dark:ring-offset-gray-900' : ''
              } ${
                isCorrect
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : isWrong
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : isAnswered
                      ? 'bg-gradient-to-r from-brand-600 to-accent-600 text-white hover:from-brand-700 hover:to-accent-700'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
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
