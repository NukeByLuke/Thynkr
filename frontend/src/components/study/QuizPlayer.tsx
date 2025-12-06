/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 text-center">
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

          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="text-4xl sm:text-5xl font-bold text-indigo-600 mb-2">
              {results.percentage}%
            </div>
            <p className="text-sm sm:text-base text-gray-600">
              {results.score} out of {results.total} questions correct
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentIndex(0)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-sm sm:text-base"
            >
              Review Answers
            </button>
            <button
              onClick={handleRestart}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
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
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-4 sm:mb-6">
        <div className="prose prose-sm sm:prose-lg max-w-none mb-4 sm:mb-6">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ node, ...props }) => (
                <h4 className="text-base sm:text-xl font-semibold text-gray-900" {...props} />
              ),
              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
              code: ({ node, ...props }) => (
                <code
                  className="bg-gray-100 text-indigo-600 px-1.5 sm:px-2 py-1 rounded text-sm sm:text-base font-mono"
                  {...props}
                />
              ),
            }}
          >
            {currentQuestion.question}
          </ReactMarkdown>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = userAnswer === option;
            const isCorrect = isSubmitted && option === currentQuestion.correctAnswer;
            const isWrong = isSubmitted && isSelected && option !== currentQuestion.correctAnswer;

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={isSubmitted}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  isCorrect
                    ? 'border-green-500 bg-green-50'
                    : isWrong
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${isSubmitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium pr-2">{option}</span>
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
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {isSubmitted && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
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
                <p className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">Explanation</p>
                <div className="prose prose-sm prose-blue max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ node, ...props }) => (
                        <p className="text-blue-800 text-xs sm:text-sm" {...props} />
                      ),
                      strong: ({ node, ...props }) => (
                        <strong className="font-semibold text-blue-900" {...props} />
                      ),
                      code: ({ node, ...props }) => (
                        <code
                          className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-xs font-mono"
                          {...props}
                        />
                      ),
                    }}
                  >
                    {currentQuestion.explanation}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">← Previous</span>
          <span className="sm:hidden">←</span>
        </button>

        {!isSubmitted && allQuestionsAnswered && currentIndex === questions.length - 1 && (
          <button
            onClick={handleSubmit}
            className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            Submit Quiz
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={currentIndex === questions.length - 1}
          className="px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Next →</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>

      {/* Question indicators */}
      <div className="mt-4 sm:mt-6 flex flex-wrap gap-1.5 sm:gap-2 justify-center">
        {questions.map((question, index) => {
          const isAnswered = isQuestionAnswered(question.id);
          const isCurrent = index === currentIndex;
          const isCorrect = isSubmitted && results?.results[question.id]?.correct;
          const isWrong = isSubmitted && !results?.results[question.id]?.correct && isAnswered;

          return (
            <button
              key={question.id}
              onClick={() => setCurrentIndex(index)}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
              } ${
                isCorrect
                  ? 'bg-green-500 text-white'
                  : isWrong
                    ? 'bg-red-500 text-white'
                    : isAnswered
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
