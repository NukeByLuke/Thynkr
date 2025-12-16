/**
 * MatchingGame Component
 * Single-player "Matching Rush" game with clean, minimalist UI
 * Features note-taking aesthetic with subtle interactions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Check,
  Home,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Lock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AnimatedPage from '@/components/AnimatedPage';
import GameLoadingWrapper from '@/components/GameLoadingWrapper';
import ResponsiveText from '@/components/ui/ResponsiveText';
import {
  useMatchingGame,
  FREE_DAILY_LIMIT,
  GAME_TIME_SECONDS,
  type Card,
  type Difficulty,
} from './hooks/useMatchingGame';

// =============================================================================
// Countdown Overlay
// =============================================================================

interface CountdownOverlayProps {
  count: number;
  onComplete: () => void;
}

function CountdownOverlay({ count, onComplete }: CountdownOverlayProps) {
  const [current, setCurrent] = useState(count);

  useEffect(() => {
    if (current <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCurrent(current - 1), 1000);
    return () => clearTimeout(timer);
  }, [current, onComplete]);

  if (current <= 0) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-900/95"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="text-[150px] font-bold text-slate-900 dark:text-white">
            {current}
          </span>
          <p className="text-xl text-slate-500 dark:text-slate-400 mt-2">
            Get ready to match!
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// Game Card (Note-Taking Aesthetic)
// =============================================================================

interface GameCardProps {
  card: Card;
  onSelect: (card: Card) => void;
  disabled: boolean;
}

function GameCard({ card, onSelect, disabled }: GameCardProps) {
  const handleClick = () => {
    if (!disabled && !card.isMatched) {
      onSelect(card);
    }
  };

  // Determine card state classes
  const getCardClasses = () => {
    if (card.isMatched) {
      return 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-400';
    }
    if (card.isWrong) {
      return 'bg-red-50 dark:bg-red-500/10 border-red-500 text-red-700 dark:text-red-400';
    }
    if (card.isSelected) {
      return 'bg-blue-50 dark:bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-400';
    }
    return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md';
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || card.isMatched}
      className={clsx(
        'relative w-full rounded-xl border shadow-sm',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
        // Term-specific styling - responsive sizing
        card.type === 'term' && 'h-16 md:h-16 font-bold text-sm md:text-base',
        // Definition-specific styling with overflow protection - responsive
        card.type === 'definition' && 'min-h-20 md:min-h-16 max-h-32 font-medium text-xs md:text-sm overflow-y-auto scrollbar-thin',
        'cursor-pointer touch-manipulation',
        getCardClasses()
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: card.isMatched ? 0 : 1,
        scale: card.isMatched ? 0.8 : 1,
        x: card.isWrong ? [0, -8, 8, -8, 8, 0] : 0,
      }}
      transition={{
        duration: card.isWrong ? 0.4 : 0.2,
        x: { duration: 0.4 },
        opacity: { duration: 0.3, delay: card.isMatched ? 0.5 : 0 },
      }}
      whileTap={!disabled && !card.isMatched ? { scale: 0.98 } : undefined}
    >
      {/* Type label - subtle */}
      <div className="absolute top-2 left-2">
        <span
          className={clsx(
            'text-[10px] font-medium uppercase tracking-wider',
            card.isSelected || card.isWrong || card.isMatched
              ? 'opacity-60'
              : 'text-slate-400 dark:text-slate-500'
          )}
        >
          {card.type === 'term' ? 'Term' : 'Definition'}
        </span>
      </div>

      {/* Content */}
      <div className={clsx(
        'flex items-center px-3 py-3 md:py-4',
        card.type === 'term' ? 'justify-center' : 'justify-start'
      )}>
        <ResponsiveText 
          content={card.content}
          className={clsx(
            'leading-relaxed break-words text-xs md:text-sm',
            card.type === 'term' ? 'text-center font-bold' : 'text-left'
          )}
        />
      </div>

      {/* Match checkmark */}
      <AnimatePresence>
        {card.isMatched && (
          <motion.div
            className="absolute top-2 right-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
          >
            <Check className="w-5 h-5 text-emerald-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// =============================================================================
// HUD (Heads Up Display)
// =============================================================================

interface HUDProps {
  timeRemaining: number;
  score: number;
  pairsLeft: number;
}

function HUD({ timeRemaining, score, pairsLeft }: HUDProps) {
  const isLowTime = timeRemaining <= 10;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      {/* Time */}
      <div className="flex items-center gap-2">
        <Clock
          className={clsx(
            'w-5 h-5',
            isLowTime ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'
          )}
        />
        <motion.span
          className={clsx(
            'font-mono text-lg font-semibold',
            isLowTime ? 'text-red-500' : 'text-slate-900 dark:text-white'
          )}
          animate={isLowTime ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.5, repeat: isLowTime ? Infinity : 0 }}
        >
          {timeRemaining}s
        </motion.span>
      </div>

      {/* Pairs Left */}
      <div className="text-center">
        <span className="text-sm text-slate-500 dark:text-slate-400">Pairs Left</span>
        <p className="text-xl font-bold text-slate-900 dark:text-white">{pairsLeft}</p>
      </div>

      {/* Score */}
      <div className="text-right">
        <span className="text-sm text-slate-500 dark:text-slate-400">Score</span>
        <p className="font-mono text-lg font-semibold text-slate-900 dark:text-white">
          {score.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Results Modal
// =============================================================================

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  won: boolean;
  matchesFound: number;
  totalPairs: number;
  timeRemaining: number;
  score: number;
}

function ResultsModal({
  isOpen,
  onClose,
  onPlayAgain,
  won,
  matchesFound,
  totalPairs,
  timeRemaining,
  score,
}: ResultsModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center p-6">
        {/* Icon */}
        <motion.div
          className={clsx(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
            won ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-orange-100 dark:bg-orange-500/20'
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12 }}
        >
          {won ? (
            <Trophy className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Clock className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          )}
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {won ? 'Well Done!' : "Time's Up"}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          {won
            ? `You matched all pairs with ${timeRemaining}s to spare!`
            : `You found ${matchesFound} of ${totalPairs} pairs.`}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{matchesFound}</p>
            <p className="text-xs text-slate-500">Matches</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{timeRemaining}s</p>
            <p className="text-xs text-slate-500">Time Left</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {score.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">Score</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button onClick={onPlayAgain} className="w-full">
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/arcade')}
            className="w-full text-slate-500"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Games
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Upgrade Modal
// =============================================================================

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamesPlayed: number;
}

function UpgradeModal({ isOpen, onClose, gamesPlayed }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center p-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-6">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Daily Limit Reached
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          You've played {gamesPlayed} games today. Upgrade to Pro for unlimited practice.
        </p>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => navigate('/pricing')}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-slate-500">
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// =============================================================================
// Difficulty Selector
// =============================================================================

interface DifficultySelectorProps {
  difficulty: Difficulty;
  onSelect: (difficulty: Difficulty) => void;
  isPro: boolean;
}

function DifficultySelector({ difficulty, onSelect, isPro }: DifficultySelectorProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onSelect('normal')}
        className={clsx(
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
          difficulty === 'normal'
            ? 'bg-blue-500 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
        )}
      >
        Normal
      </button>
      <button
        onClick={() => isPro && onSelect('hard')}
        disabled={!isPro}
        className={clsx(
          'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1',
          difficulty === 'hard'
            ? 'bg-blue-500 text-white'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
          isPro ? 'hover:bg-slate-200 dark:hover:bg-slate-700' : 'opacity-50 cursor-not-allowed'
        )}
      >
        Hard
        {!isPro && <Lock className="w-3 h-3" />}
      </button>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export default function MatchingGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isPro = user?.role !== 'BASIC';

  // Get generated content from navigation state
  const generatedPairs = location.state?.generatedPairs;
  const shouldAutoLoad = !!generatedPairs;
  
  // Loading state - show loader if we just came from generator
  const [isLoading, setIsLoading] = useState(shouldAutoLoad);

  // Use the game hook
  const {
    status,
    difficulty,
    cards,
    selectedCards,
    timeRemaining,
    score,
    matchesFound,
    showDailyLimitModal,
    gamesPlayedToday,
    pairsLeft,
    setDifficulty,
    setShowDailyLimitModal,
    startGame,
    handleCountdownComplete,
    handleCardSelect,
    handlePlayAgain,
    handleBackToMenu,
  } = useMatchingGame({
    generatedPairs,
    isPro,
    onLoadingComplete: () => setIsLoading(false),
  });

  // Handle loading complete
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  return (
    <AnimatedPage>
      <GameLoadingWrapper isLoading={isLoading} onLoadingComplete={handleLoadingComplete}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
          {/* Countdown Overlay */}
          <AnimatePresence>
            {status === 'countdown' && (
              <CountdownOverlay count={3} onComplete={handleCountdownComplete} />
            )}
          </AnimatePresence>

          {/* Idle State - Start Screen */}
          {status === 'idle' && (
          <div className="max-w-md mx-auto px-4 py-12">
            <button
              onClick={() => navigate('/arcade')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </button>

            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Matching Rush
              </h1>
              <p className="text-slate-500 dark:text-slate-400">
                Match 6 pairs before time runs out
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Difficulty
                </span>
                <DifficultySelector
                  difficulty={difficulty}
                  onSelect={setDifficulty}
                  isPro={!!isPro}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                <span>Time Limit</span>
                <span className="font-mono">{GAME_TIME_SECONDS}s</span>
              </div>
            </div>

            {!isPro && (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400 mb-4">
                {FREE_DAILY_LIMIT - gamesPlayedToday} free games remaining today
              </div>
            )}

            <Button onClick={startGame} className="w-full py-3 text-lg">
              Start Game
            </Button>
          </div>
        )}

        {/* Playing State */}
        {(status === 'playing' || status === 'won' || status === 'lost') && (
          <>
            {/* HUD */}
            <HUD timeRemaining={timeRemaining} score={score} pairsLeft={pairsLeft} />

            {/* Game Board - Responsive Layout: Mobile Stack, Desktop Split */}
            <div className="max-w-6xl mx-auto px-4 py-6">
              {/* Mobile Layout: Single Column Stack (< 768px) */}
              <div className="md:hidden space-y-6">
                {/* Current Term Card at Top */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide px-2">
                    Match This Term:
                  </h3>
                  {cards
                    .filter(card => card.type === 'term' && !card.isMatched)
                    .slice(0, 1)
                    .map((card) => (
                      <GameCard
                        key={card.id}
                        card={card}
                        onSelect={handleCardSelect}
                        disabled={status !== 'playing' || selectedCards.length >= 2}
                      />
                    ))}
                </div>

                {/* Definitions List - Scrollable */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide px-2">
                    Select Definition:
                  </h3>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                    {cards
                      .filter(card => card.type === 'definition')
                      .map((card) => (
                        <GameCard
                          key={card.id}
                          card={card}
                          onSelect={handleCardSelect}
                          disabled={status !== 'playing' || selectedCards.length >= 2}
                        />
                      ))}
                  </div>
                </div>
              </div>

              {/* Desktop Layout: Split View (≥ 768px) */}
              <div className="hidden md:grid md:grid-cols-[1fr_2fr] gap-6">
                {/* Left Column: Terms */}
                <div className="space-y-3">
                  {cards
                    .filter(card => card.type === 'term')
                    .map((card) => (
                      <GameCard
                        key={card.id}
                        card={card}
                        onSelect={handleCardSelect}
                        disabled={status !== 'playing' || selectedCards.length >= 2}
                      />
                    ))}
                </div>

                {/* Right Column: Definitions */}
                <div className="space-y-3">
                  {cards
                    .filter(card => card.type === 'definition')
                    .map((card) => (
                      <GameCard
                        key={card.id}
                        card={card}
                        onSelect={handleCardSelect}
                        disabled={status !== 'playing' || selectedCards.length >= 2}
                      />
                    ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Results Modal */}
        <ResultsModal
          isOpen={status === 'won' || status === 'lost'}
          onClose={handleBackToMenu}
          onPlayAgain={handlePlayAgain}
          won={status === 'won'}
          matchesFound={matchesFound}
          totalPairs={6}
          timeRemaining={timeRemaining}
          score={score}
        />

        {/* Daily Limit/Upgrade Modal */}
        <UpgradeModal
          isOpen={showDailyLimitModal}
          onClose={() => setShowDailyLimitModal(false)}
          gamesPlayed={gamesPlayedToday}
        />
        </div>
      </GameLoadingWrapper>
    </AnimatedPage>
  );
}
