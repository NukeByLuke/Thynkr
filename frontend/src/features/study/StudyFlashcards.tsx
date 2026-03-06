import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Check,
  X,
  Shuffle,
  Sparkles,
  RefreshCw,
  Loader2,
  Square,
  Volume2,
} from 'lucide-react';
import { useTTS } from '@/hooks/useTTS';
import { sanitizeTextForTTS } from '@/utils/ttsText';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardsData {
  title: string;
  cards: Flashcard[];
  sourceFiles?: string[];
}

interface StudyFlashcardsProps {
  data: FlashcardsData;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export default function StudyFlashcards({
  data,
  onRegenerate,
  isRegenerating = false,
}: StudyFlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [shuffledIndices, setShuffledIndices] = useState<number[]>(data.cards.map((_, i) => i));
  const [playingItem, setPlayingItem] = useState<string | null>(null);

  const {
    isPlaying,
    isLoading: isTTSLoading,
    play: playTTS,
    stop: stopTTS,
  } = useTTS({
    onPlayEnd: () => setPlayingItem(null),
  });

  const currentCard = data.cards[shuffledIndices[currentIndex]];
  const totalCards = data.cards.length;
  const knownCount = knownCards.size;
  const remainingCount = totalCards - knownCount;
  const currentCardItemId = currentCard
    ? `study-flashcard-${shuffledIndices[currentIndex]}-${isFlipped ? 'answer' : 'question'}`
    : null;
  const currentCardSpeechText = useMemo(() => {
    if (!currentCard) return '';
    const sideLabel = isFlipped ? 'Answer' : 'Question';
    const sideText = isFlipped ? currentCard.back : currentCard.front;
    return sanitizeTextForTTS(`${sideLabel}. ${sideText}`);
  }, [currentCard, isFlipped]);

  const stopCardAudio = useCallback(() => {
    stopTTS();
    setPlayingItem(null);
  }, [stopTTS]);

  const handleCardAudioToggle = useCallback(async () => {
    if (!currentCardItemId || !currentCardSpeechText) {
      return;
    }

    if (playingItem === currentCardItemId && isPlaying) {
      stopCardAudio();
      return;
    }

    setPlayingItem(currentCardItemId);
    await playTTS(currentCardSpeechText);
  }, [currentCardItemId, currentCardSpeechText, isPlaying, playTTS, playingItem, stopCardAudio]);

  const goToCard = (index: number) => {
    if (index >= 0 && index < totalCards) {
      stopCardAudio();
      setCurrentIndex(index);
      setIsFlipped(false);
    }
  };

  const nextCard = () => goToCard(currentIndex + 1);
  const prevCard = () => goToCard(currentIndex - 1);

  const toggleFlip = () => {
    stopCardAudio();
    setIsFlipped(!isFlipped);
  };

  const markAsKnown = () => {
    setKnownCards((prev) => new Set([...prev, shuffledIndices[currentIndex]]));
    if (currentIndex < totalCards - 1) {
      nextCard();
    }
  };

  const markAsUnknown = () => {
    setKnownCards((prev) => {
      const next = new Set(prev);
      next.delete(shuffledIndices[currentIndex]);
      return next;
    });
    if (currentIndex < totalCards - 1) {
      nextCard();
    }
  };

  const shuffleCards = useCallback(() => {
    stopCardAudio();
    const indices = [...shuffledIndices];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [shuffledIndices, stopCardAudio]);

  const resetProgress = () => {
    stopCardAudio();
    setKnownCards(new Set());
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleRegenerate = useCallback(() => {
    stopCardAudio();
    onRegenerate?.();
  }, [onRegenerate, stopCardAudio]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-orange-500" />
            {data.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalCards} cards • {knownCount} known • {remainingCount} remaining
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCardAudioToggle}
            disabled={isTTSLoading || !currentCardSpeechText}
            className="p-2 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/30 disabled:opacity-50"
            title={playingItem === currentCardItemId && isPlaying ? 'Stop audio' : 'Read current card aloud'}
          >
            {isTTSLoading && playingItem === currentCardItemId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : playingItem === currentCardItemId && isPlaying ? (
              <Square className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={shuffleCards}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Shuffle cards"
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            onClick={resetProgress}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Reset progress"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          {onRegenerate && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              title="Regenerate flashcards"
            >
              <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-green-500 transition-all duration-150"
          style={{ width: `${(knownCount / totalCards) * 100}%` }}
        />
      </div>

      {/* Card Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          className="relative w-full max-w-lg aspect-[3/2] cursor-pointer perspective-1000"
          onClick={toggleFlip}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentIndex}-${isFlipped}`}
              initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`absolute inset-0 rounded-2xl shadow-sm p-6 flex flex-col items-center justify-center text-center ${
                isFlipped
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Card indicator */}
              <div
                className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-medium ${
                  isFlipped
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isFlipped ? 'Answer' : 'Question'}
              </div>

              {/* Known indicator */}
              {knownCards.has(shuffledIndices[currentIndex]) && (
                <div className="absolute top-4 left-4">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              )}

              {/* Content */}
              <p
                className={`text-lg md:text-xl font-medium leading-relaxed ${
                  isFlipped ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}
              >
                {isFlipped ? currentCard.back : currentCard.front}
              </p>

              {/* Flip hint */}
              <p
                className={`absolute bottom-4 text-xs ${
                  isFlipped ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                Click to flip
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={markAsUnknown}
            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <X className="h-4 w-4" />
            Still Learning
          </button>
          <button
            onClick={markAsKnown}
            className="flex items-center gap-2 px-4 py-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <Check className="h-4 w-4" />
            Got It!
          </button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={prevCard}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} / {totalCards}
          </span>

          <button
            onClick={nextCard}
            disabled={currentIndex === totalCards - 1}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
