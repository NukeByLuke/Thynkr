import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  order: number;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  title: string;
}

export default function FlashcardViewer({ cards, title }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No flashcards available
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
          Card {currentIndex + 1} of {cards.length}
        </p>
      </div>

      {/* Flashcard */}
      <div
        className="relative w-full h-64 sm:h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label="Flip card"
      >
        <div
          className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 sm:p-8 backface-hidden overflow-y-auto"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center w-full">
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-4 uppercase tracking-wide">
                Question
              </p>
              <div className="prose prose-sm sm:prose-xl dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="text-base sm:text-2xl font-medium text-gray-900 dark:text-white" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                    code: ({ node, ...props }) => (
                      <code className="bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 px-1 sm:px-2 py-1 rounded text-sm sm:text-xl font-mono" {...props} />
                    ),
                  }}
                >
                  {currentCard.front}
                </ReactMarkdown>
              </div>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-4 sm:mt-6">Click or press Space to flip</p>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute w-full h-full bg-indigo-600 rounded-lg shadow-lg flex items-center justify-center p-4 sm:p-8 backface-hidden overflow-y-auto"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center w-full">
              <p className="text-xs sm:text-sm text-indigo-200 mb-2 sm:mb-4 uppercase tracking-wide">
                Answer
              </p>
              <div className="prose prose-sm sm:prose-xl prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="text-base sm:text-2xl font-medium text-white" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                    code: ({ node, ...props }) => (
                      <code className="bg-indigo-800 text-indigo-100 px-1 sm:px-2 py-1 rounded text-sm sm:text-xl font-mono" {...props} />
                    ),
                  }}
                >
                  {currentCard.back}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 sm:mt-8 flex items-center justify-between gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Progress dots - show limited on mobile */}
        <div className="flex space-x-1 sm:space-x-2 justify-center items-center">
          {cards.length <= 10 ? (
            // Show all dots if 10 or fewer cards
            cards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsFlipped(false);
                }}
                className={`w-2 h-2 rounded-full transition-colors flex-shrink-0 ${
                  index === currentIndex
                    ? 'bg-indigo-600 dark:bg-indigo-400 w-6 sm:w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))
          ) : (
            // Show indicator with current position for many cards
            <>
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 5))}
                disabled={currentIndex === 0}
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-30"
                aria-label="Jump back"
              />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 whitespace-nowrap">
                {currentIndex + 1} / {cards.length}
              </span>
              <button
                onClick={() => setCurrentIndex(Math.min(cards.length - 1, currentIndex + 5))}
                disabled={currentIndex === cards.length - 1}
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-30"
                aria-label="Jump forward"
              />
            </>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
        <p>
          Use <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">←</kbd> and{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">→</kbd> to navigate,{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">Space</kbd> to flip
        </p>
      </div>
    </div>
  );
}
