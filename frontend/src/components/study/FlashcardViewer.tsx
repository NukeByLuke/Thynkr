/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';

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
  const [shuffledCards, setShuffledCards] = useState<Flashcard[] | null>(null);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right

  const displayCards = shuffledCards || cards;
  const currentCard = displayCards[currentIndex];

  const handleNext = () => {
    if (currentIndex < displayCards.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleShuffle = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setShuffledCards(null);
    setCurrentIndex(0);
    setIsFlipped(false);
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
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No flashcards available
      </div>
    );
  }

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-0">
      <div className="mb-4 sm:mb-6 text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2">
          Card {currentIndex + 1} of {displayCards.length}
          {shuffledCards && <span className="ml-2 text-primary-500">(Shuffled)</span>}
        </p>
      </div>

      {/* Shuffle & Reset Controls */}
      <div className="flex justify-center gap-2 mb-4">
        <button
          onClick={handleShuffle}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </button>
        {shuffledCards && (
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Order
          </button>
        )}
      </div>

      {/* Flashcard with Animation */}
      <div
        className="relative w-full h-64 sm:h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label="Flip card"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute w-full h-full"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full h-full"
            >
              {/* Front */}
              <div
                className="absolute w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center w-full">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-4 uppercase tracking-wide font-medium">
                    Question
                  </p>
                  <div className="prose prose-sm sm:prose-xl dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            className="text-base sm:text-2xl font-medium text-gray-900 dark:text-white"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                        code: ({ node, ...props }) => (
                          <code
                            className="bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 px-1 sm:px-2 py-1 rounded text-sm sm:text-xl font-mono"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {currentCard.front}
                    </ReactMarkdown>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-4 sm:mt-6">
                    Click or press Space to flip
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-primary-600 to-indigo-600 dark:from-primary-700 dark:to-indigo-700 rounded-xl shadow-lg flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-center w-full">
                  <p className="text-xs sm:text-sm text-white/80 mb-2 sm:mb-4 uppercase tracking-wide font-medium">
                    Answer
                  </p>
                  <div className="prose prose-sm sm:prose-xl prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="text-base sm:text-2xl font-medium text-white" {...props} />
                        ),
                        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                        code: ({ node, ...props }) => (
                          <code
                            className="bg-white/20 text-white px-1 sm:px-2 py-1 rounded text-sm sm:text-xl font-mono"
                            {...props}
                          />
                        ),
                      }}
                    >
                      {currentCard.back}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="mt-4 sm:mt-8 flex items-center justify-between gap-2">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base shadow-sm"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {/* Progress dots - show limited on mobile */}
        <div className="flex space-x-1 sm:space-x-2 justify-center items-center">
          {displayCards.length <= 10 ? (
            // Show all dots if 10 or fewer cards
            displayCards.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                  setIsFlipped(false);
                }}
                className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                  index === currentIndex
                    ? 'bg-primary-600 dark:bg-primary-400 w-6 sm:w-8'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Go to card ${index + 1}`}
              />
            ))
          ) : (
            // Show indicator with current position for many cards
            <>
              <button
                onClick={() => {
                  setDirection(-1);
                  setCurrentIndex(Math.max(0, currentIndex - 5));
                  setIsFlipped(false);
                }}
                disabled={currentIndex === 0}
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-30"
                aria-label="Jump back"
              />
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-2 whitespace-nowrap font-medium">
                {currentIndex + 1} / {displayCards.length}
              </span>
              <button
                onClick={() => {
                  setDirection(1);
                  setCurrentIndex(Math.min(displayCards.length - 1, currentIndex + 5));
                  setIsFlipped(false);
                }}
                disabled={currentIndex === displayCards.length - 1}
                className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-30"
                aria-label="Jump forward"
              />
            </>
          )}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === displayCards.length - 1}
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base shadow-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
        <p>
          Use <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">←</kbd> and{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">→</kbd> to
          navigate,{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">Space</kbd> to
          flip
        </p>
      </div>
    </div>
  );
}
