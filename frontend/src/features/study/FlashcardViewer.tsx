/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, AlertTriangle, RefreshCw, Check } from 'lucide-react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  order: number;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  title: string;
  error?: Error | null;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

// Memoize slide animation variants - Optimized for performance
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '50%' : '-50%',
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '20%' : '-20%',
    opacity: 0,
    scale: 0.95,
  }),
};

// Spring physics for tactile, snappy flip animation
const flipTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

const FlashcardViewer = memo(function FlashcardViewer({ cards, title, error, onRegenerate, isRegenerating }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[] | null>(null);
  const [direction, setDirection] = useState(0);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  const displayCards = shuffledCards || cards;
  const currentCard = displayCards[currentIndex];
  const progressPercentage = (masteredCards.size / displayCards.length) * 100;

  // Show error alert if generation failed
  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0 animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Failed to Generate Flashcards</h3>
          <p className="text-red-600 dark:text-red-300 mb-4">{error.message || 'An unexpected error occurred. Please try again.'}</p>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Memoize handlers
  const handleNext = useCallback(() => {
    if (currentIndex < displayCards.length - 1) {
      setDirection(1);
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  }, [currentIndex, displayCards.length]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleShuffle = useCallback(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setShuffledCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  }, [cards]);

  const handleReset = useCallback(() => {
    setShuffledCards(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  }, []);

  const handleMarkMastered = useCallback(() => {
    if (currentCard) {
      setMasteredCards(prev => {
        const newSet = new Set(prev);
        if (newSet.has(currentCard.id)) {
          newSet.delete(currentCard.id);
        } else {
          newSet.add(currentCard.id);
        }
        return newSet;
      });
    }
  }, [currentCard]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    // Prevent if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleFlip();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      handleMarkMastered();
    }
  }, [handleFlip, handlePrevious, handleNext, handleMarkMastered]);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        No flashcards available
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-0">
      {/* Progress Bar - Quizlet Style */}
      <div className="mb-6">
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
        </div>
        <div className="flex justify-between items-center mt-2 text-xs font-medium">
          <span className="text-slate-600 dark:text-slate-400">
            {masteredCards.size} mastered
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            {displayCards.length - masteredCards.size} remaining
          </span>
        </div>
      </div>

      <div className="mb-4 sm:mb-6 text-center">
        <h3 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 dark:from-violet-400 dark:via-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent">{title}</h3>
        <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 mt-3 font-medium">
          Card {currentIndex + 1} of {displayCards.length}
          {shuffledCards && <span className="ml-2 text-brand-600 dark:text-brand-400 font-semibold">(Shuffled)</span>}
        </p>
      </div>

      {/* Shuffle & Reset Controls */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleMarkMastered}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-150 shadow-sm hover:shadow-md ${
            currentCard && masteredCards.has(currentCard.id)
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Check className="w-4 h-4" />
          {currentCard && masteredCards.has(currentCard.id) ? 'Mastered' : 'Mark Mastered'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShuffle}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </motion.button>
        {shuffledCards && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Order
          </motion.button>
        )}
      </div>

      {/* Flashcard with Animation - Larger Hero Card */}
      <div
        className="relative w-full h-[70vh] md:h-[32rem] cursor-pointer"
        style={{ perspective: '2000px' }}
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
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute w-full h-full"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={flipTransition}
              style={{ 
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
              className="w-full h-full"
            >
              {/* Front */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-white to-brand-50/50 dark:from-gray-800 dark:to-gray-800 rounded-3xl shadow-2xl border-2 border-brand-100/50 dark:border-gray-700 flex items-center justify-center p-8 sm:p-12 overflow-y-auto"
                style={{ 
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="text-center w-full">
                  <p className="text-base sm:text-lg text-brand-600 dark:text-brand-400 mb-4 sm:mb-6 uppercase tracking-wide font-bold">
                    Question
                  </p>
                  <div className="prose prose-lg sm:prose-2xl dark:prose-invert max-w-none">
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
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-6 sm:mt-10 font-medium">
                    💡 Click or press Space to flip
                  </p>
                </div>
              </div>

              {/* Back */}
              <div
                className="absolute w-full h-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 dark:from-violet-600 dark:via-indigo-600 dark:to-cyan-500 rounded-3xl shadow-2xl flex items-center justify-center p-8 sm:p-12 overflow-y-auto"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(0)',
                }}
              >
                <div className="text-center w-full">
                  <p className="text-base sm:text-lg text-white/90 mb-4 sm:mb-6 uppercase tracking-wide font-bold">
                    Answer
                  </p>
                  <div className="prose prose-lg sm:prose-2xl prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="text-xl sm:text-4xl font-bold text-white mb-5" {...props} />
                        ),
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mb-5" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mb-4" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-white mb-3" {...props} />,
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

      {/* Navigation - Enhanced for Mobile */}
      <div className="mt-6 sm:mt-10 space-y-4">
        {/* Mobile: Large Thumb-Friendly Buttons */}
        <div className="flex md:hidden gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg font-bold text-lg touch-manipulation active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
            Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={currentIndex === displayCards.length - 1}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg font-bold text-lg touch-manipulation active:scale-95"
          >
            Next
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Desktop: Original Layout */}
        <div className="hidden md:flex items-center justify-between gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-brand-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-700 hover:border-brand-300 dark:hover:border-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 text-sm sm:text-base shadow-md font-semibold"
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
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={currentIndex === displayCards.length - 1}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-gray-800 border-2 border-brand-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-gray-700 hover:border-brand-300 dark:hover:border-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 text-sm sm:text-base shadow-md font-semibold"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>

        {/* Mobile: Progress Indicator */}
        <div className="md:hidden text-center">
          <span className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300">
            {currentIndex + 1} / {displayCards.length}
          </span>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
        <p>
          Use <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">←</kbd> and{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">→</kbd> to
          navigate,{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">Space</kbd> to
          flip,{' '}
          <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono">M</kbd> to
          mark mastered
