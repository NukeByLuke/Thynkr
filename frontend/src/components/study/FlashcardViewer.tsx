/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
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
      <div className="mb-6 sm:mb-8 text-center">
        <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">{title}</h3>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-3">
          Card {currentIndex + 1} of {displayCards.length}
          {shuffledCards && <span className="ml-2 text-brand-600 dark:text-brand-400 font-semibold">(Shuffled)</span>}
        </p>
      </div>

      {/* Shuffle & Reset Controls */}
      <div className="flex justify-center gap-3 mb-6">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShuffle}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </motion.button>
        {shuffledCards && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Order
          </motion.button>
        )}
      </div>

      {/* Flashcard with Animation */}
      <div
        className="relative w-full h-72 sm:h-96 cursor-pointer"
        style={{ perspective: '1500px' }}
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
            transition={{ type: 'spring', stiffness: 250, damping: 25 }}
            className="absolute w-full h-full"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 15 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="w-full h-full"
            >
              {/* Front */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-2xl border-2 border-brand-100/50 dark:border-gray-700 flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="text-center w-full">
                  <p className="text-sm sm:text-base text-brand-600 dark:text-brand-400 mb-3 sm:mb-5 uppercase tracking-wide font-bold">
                    Question
                  </p>
                  <div className="prose prose-sm sm:prose-xl dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            className="text-lg sm:text-3xl font-bold text-gray-900 dark:text-white mb-4"
                            {...props}
                          />
                        ),
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-brand-900 dark:text-brand-300" {...props} />,
                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-2 text-left marker:text-brand-500" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-2 text-left marker:text-brand-500" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed text-base sm:text-xl" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded-lg text-sm sm:text-lg font-mono border border-brand-200 dark:border-brand-800"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className={`block bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs sm:text-sm font-mono shadow-lg border border-gray-700 my-4 ${className || ''}`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {currentCard.front}
                    </ReactMarkdown>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-5 sm:mt-8 font-medium">
                    💡 Click or press Space to flip
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-brand-600 to-accent-600 dark:from-brand-700 dark:to-accent-700 rounded-2xl shadow-2xl flex items-center justify-center p-6 sm:p-10 overflow-y-auto"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="text-center w-full">
                  <p className="text-sm sm:text-base text-white/90 mb-3 sm:mb-5 uppercase tracking-wide font-bold">
                    Answer
                  </p>
                  <div className="prose prose-sm sm:prose-xl prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="text-lg sm:text-3xl font-bold text-white mb-4" {...props} />
                        ),
                        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mb-4" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mb-3" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-white mb-2" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                        em: ({ node, ...props }) => <em className="italic text-white/90" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc ml-6 space-y-2 text-left marker:text-white/70" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal ml-6 space-y-2 text-left marker:text-white/70" {...props} />,
                        li: ({ node, ...props }) => <li className="leading-relaxed text-base sm:text-xl text-white" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-sm sm:text-lg font-mono border border-white/30"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code
                              className={`block bg-gray-900 dark:bg-black/40 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs sm:text-sm font-mono shadow-lg border border-white/20 my-4 ${className || ''}`}
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
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
      <div className="mt-6 sm:mt-10 flex items-center justify-between gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-brand-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-700 hover:border-brand-300 dark:hover:border-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base shadow-md font-semibold"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Previous</span>
        </motion.button>

        {/* Progress dots - show limited on mobile */}
        <div className="flex space-x-1 sm:space-x-2 justify-center items-center">
          {displayCards.length <= 10 ? (
            // Show all dots if 10 or fewer cards
            displayCards.map((_, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                  setIsFlipped(false);
                }}
                className={`w-2 h-2 rounded-full transition-all flex-shrink-0 ${
                  index === currentIndex
                    ? 'bg-gradient-to-r from-brand-600 to-accent-600 w-6 sm:w-8 shadow-md'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-brand-400 dark:hover:bg-brand-500'
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

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleNext}
          disabled={currentIndex === displayCards.length - 1}
          className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-brand-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-700 hover:border-brand-300 dark:hover:border-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-sm sm:text-base shadow-md font-semibold"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </motion.button>
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
