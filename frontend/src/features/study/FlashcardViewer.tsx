/* eslint-disable @typescript-eslint/no-unused-vars */
import { memo, useCallback, useState, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Shuffle,
  AlertTriangle,
  RefreshCw,
  Check,
} from 'lucide-react';

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

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '45%' : '-45%',
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? '18%' : '-18%',
    opacity: 0,
    scale: 0.96,
  }),
};

const flipTransition = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

const FlashcardViewer = memo(function FlashcardViewer({
  cards,
  title,
  error,
  onRegenerate,
  isRegenerating,
}: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffledCards, setShuffledCards] = useState<Flashcard[] | null>(null);
  const [direction, setDirection] = useState(0);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());

  const displayCards = shuffledCards ?? cards;
  const currentCard = displayCards[currentIndex];
  const progressPercentage =
    displayCards.length > 0 ? (masteredCards.size / displayCards.length) * 100 : 0;

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-0 animate-fade-in">
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
            Failed to Generate Flashcards
          </h3>
          <p className="text-red-600 dark:text-red-300 mb-4">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
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
    if (!currentCard) return;
    setMasteredCards((prev) => {
      const next = new Set(prev);
      if (next.has(currentCard.id)) {
        next.delete(currentCard.id);
      } else {
        next.add(currentCard.id);
      }
      return next;
    });
  }, [currentCard]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

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
    },
    [handleFlip, handlePrevious, handleNext, handleMarkMastered]
  );

  if (!cards || cards.length === 0 || !currentCard) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">No flashcards available</div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-0">
      <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-lg p-4 sm:p-6 mb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Flashcard Studio
            </p>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white truncate">
              {title || 'Flashcards'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Card {currentIndex + 1} of {displayCards.length}
              {shuffledCards && (
                <span className="ml-1.5 font-medium text-cyan-700 dark:text-cyan-300">(Shuffled)</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleMarkMastered}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                masteredCards.has(currentCard.id)
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              {masteredCards.has(currentCard.id) ? 'Mastered' : 'Mark Mastered'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShuffle}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-500/15 dark:hover:bg-cyan-500/25 rounded-xl transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Shuffle
            </motion.button>

            {shuffledCards && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </motion.button>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
          <div className="flex justify-between items-center mt-1.5 text-xs font-medium">
            <span className="text-slate-500 dark:text-slate-500">{masteredCards.size} mastered</span>
            <span className="text-slate-500 dark:text-slate-500">
              {displayCards.length - masteredCards.size} remaining
            </span>
          </div>
        </div>
      </div>

      <div
        className="relative w-full h-[clamp(18rem,44vh,25rem)] sm:h-[clamp(20rem,48vh,28rem)] md:h-[clamp(22rem,52vh,30rem)] cursor-pointer"
        style={{ perspective: '2000px' }}
        onClick={handleFlip}
        onKeyDown={handleKeyPress}
        tabIndex={0}
        role="button"
        aria-label="Flip card"
      >
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={`${currentCard.id}-${currentIndex}`}
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
              <div
                className="absolute w-full h-full bg-gradient-to-br from-amber-50 via-white to-cyan-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 rounded-3xl shadow-2xl border-2 border-slate-200/70 dark:border-white/10 flex items-center justify-center p-8 sm:p-12 overflow-y-auto"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="text-center w-full">
                  <p className="text-xs sm:text-sm text-cyan-700 dark:text-cyan-300 mb-4 sm:mb-6 uppercase tracking-[0.25em] font-bold">
                    Prompt
                  </p>
                  <div className="prose prose-lg sm:prose-2xl dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p
                            className="text-lg sm:text-3xl font-bold text-slate-900 dark:text-white mb-4"
                            {...props}
                          />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2" {...props} />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold text-cyan-900 dark:text-cyan-200" {...props} />
                        ),
                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc ml-6 space-y-2 text-left marker:text-cyan-500" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal ml-6 space-y-2 text-left marker:text-cyan-500" {...props} />
                        ),
                        li: ({ node, ...props }) => <li className="leading-relaxed text-base sm:text-xl" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-200 px-2 py-1 rounded-lg text-sm sm:text-lg font-mono border border-cyan-200 dark:border-cyan-500/30"
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
                  <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-6 sm:mt-10 font-medium">
                    Click or press Space to flip
                  </p>
                </div>
              </div>

              <div
                className="absolute w-full h-full bg-gradient-to-br from-cyan-700 via-teal-700 to-emerald-700 dark:from-cyan-700 dark:via-blue-700 dark:to-emerald-700 rounded-3xl shadow-2xl flex items-center justify-center p-8 sm:p-12 overflow-y-auto"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(0)',
                }}
              >
                <div className="text-center w-full">
                  <p className="text-xs sm:text-sm text-white/90 mb-4 sm:mb-6 uppercase tracking-[0.25em] font-bold">
                    Answer
                  </p>
                  <div className="prose prose-lg sm:prose-2xl prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ node, ...props }) => (
                          <p className="text-xl sm:text-4xl font-bold text-white mb-5 leading-tight" {...props} />
                        ),
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold text-white mb-5" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold text-white mb-4" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-xl font-semibold text-white mb-3" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
                        em: ({ node, ...props }) => <em className="italic text-white/90" {...props} />,
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc ml-6 space-y-2 text-left marker:text-white/70" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal ml-6 space-y-2 text-left marker:text-white/70" {...props} />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="leading-relaxed text-base sm:text-xl text-white" {...props} />
                        ),
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

      <div className="mt-4 sm:mt-6 space-y-4">
        <div className="flex md:hidden gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg font-bold text-lg touch-manipulation active:scale-95"
          >
            <ChevronLeft className="w-6 h-6" />
            Previous
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            disabled={currentIndex === displayCards.length - 1}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-lg font-bold text-lg touch-manipulation active:scale-95"
          >
            Next
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        <div className="hidden md:flex items-center justify-between gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base shadow-sm font-semibold"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
          </motion.button>

          <div className="flex space-x-1 sm:space-x-2 justify-center items-center">
            {displayCards.length <= 10 ? (
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
                      ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 w-6 sm:w-8 shadow-md'
                      : 'bg-gray-300 dark:bg-gray-600 hover:bg-cyan-400 dark:hover:bg-cyan-500'
                  }`}
                  aria-label={`Go to card ${index + 1}`}
                />
              ))
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDirection(-1);
                    setCurrentIndex(Math.max(0, currentIndex - 5));
                    setIsFlipped(false);
                  }}
                  disabled={currentIndex === 0}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:text-cyan-700 dark:hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Jump back 5"
                >
                  -5
                </button>
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 px-1 whitespace-nowrap font-semibold tabular-nums min-w-[4rem] text-center">
                  {currentIndex + 1} / {displayCards.length}
                </span>
                <button
                  onClick={() => {
                    setDirection(1);
                    setCurrentIndex(Math.min(displayCards.length - 1, currentIndex + 5));
                    setIsFlipped(false);
                  }}
                  disabled={currentIndex === displayCards.length - 1}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:text-cyan-700 dark:hover:text-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Jump forward 5"
                >
                  +5
                </button>
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={currentIndex === displayCards.length - 1}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base shadow-sm font-semibold"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
        </div>

        <div className="md:hidden text-center">
          <span className="inline-block px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-semibold text-slate-700 dark:text-slate-300">
            {currentIndex + 1} / {displayCards.length}
          </span>
        </div>
      </div>

      <div className="mt-2 sm:mt-3 text-center text-xs text-gray-500 dark:text-gray-500 hidden sm:block">
        <p>
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">&larr;</kbd>{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">&rarr;</kbd> navigate{' '}
          <span aria-hidden="true">&#183;</span>{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">Space</kbd> flip{' '}
          <span aria-hidden="true">&#183;</span>{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-mono">M</kbd> master
        </p>
      </div>
    </div>
  );
});

export default FlashcardViewer;
