/**
 * MatchingGame Component
 * Single-player "Matching Rush" game with clean, minimalist UI
 * Features note-taking aesthetic with subtle interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
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

// =============================================================================
// Types
// =============================================================================

interface MatchPair {
  id: string;
  term: string;
  definition: string;
}

interface Card {
  id: string;
  pairId: string;
  content: string;
  type: 'term' | 'definition';
  isMatched: boolean;
  isSelected: boolean;
  isWrong: boolean;
}

type GameStatus = 'idle' | 'countdown' | 'playing' | 'won' | 'lost';
type Difficulty = 'normal' | 'hard';

// =============================================================================
// Sample Data
// =============================================================================

const SAMPLE_PAIRS: MatchPair[] = [
  { id: '1', term: 'Mitochondria', definition: 'Powerhouse of the cell' },
  { id: '2', term: 'Photosynthesis', definition: 'Process plants use to convert sunlight to energy' },
  { id: '3', term: 'DNA', definition: 'Molecule carrying genetic instructions' },
  { id: '4', term: 'Osmosis', definition: 'Movement of water across a membrane' },
  { id: '5', term: 'Nucleus', definition: 'Control center of the cell' },
  { id: '6', term: 'Cytoplasm', definition: 'Gel-like fluid inside the cell' },
  { id: '7', term: 'Ribosome', definition: 'Organelle that synthesizes proteins' },
  { id: '8', term: 'Chloroplast', definition: 'Contains chlorophyll for photosynthesis' },
];

const HARD_MODE_PAIRS: MatchPair[] = [
  { id: '1', term: 'Endoplasmic Reticulum', definition: 'Network of membranes for protein transport' },
  { id: '2', term: 'Golgi Apparatus', definition: 'Packages and modifies proteins' },
  { id: '3', term: 'Lysosome', definition: 'Contains digestive enzymes' },
  { id: '4', term: 'Vacuole', definition: 'Storage organelle for water and nutrients' },
  { id: '5', term: 'Cell Membrane', definition: 'Selectively permeable barrier' },
  { id: '6', term: 'Centriole', definition: 'Organizes spindle fibers during division' },
  { id: '7', term: 'Chromatin', definition: 'Loosely coiled DNA and proteins' },
  { id: '8', term: 'Nucleolus', definition: 'Produces ribosomal RNA' },
];

// =============================================================================
// Constants
// =============================================================================

const FREE_DAILY_LIMIT = 3;
const GAME_TIME_SECONDS = 45;
const PAIRS_PER_GAME = 6;
const STORAGE_KEY = 'thynkr_matching_games';
const POINTS_PER_MATCH = 100;
const TIME_BONUS_MULTIPLIER = 5;

// =============================================================================
// Utilities
// =============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function getDailyGamesPlayed(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return 0;
    const parsed = JSON.parse(data);
    return parsed[getTodayKey()] || 0;
  } catch {
    return 0;
  }
}

function incrementDailyGames(): void {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const parsed = data ? JSON.parse(data) : {};
    const today = getTodayKey();
    parsed[today] = (parsed[today] || 0) + 1;
    const keys = Object.keys(parsed).sort().slice(-7);
    const cleaned: Record<string, number> = {};
    keys.forEach((key) => (cleaned[key] = parsed[key]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Storage error, ignore
  }
}

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
        'relative w-full h-24 sm:h-28 rounded-xl border shadow-sm',
        'font-medium text-sm sm:text-base',
        'transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
        'cursor-pointer',
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
      <div className="flex items-center justify-center h-full px-3 pt-4">
        <p className="text-center leading-snug line-clamp-3">{card.content}</p>
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
  const isPro = user?.role && ['STANDARD', 'PREMIUM', 'ADMIN'].includes(user.role);

  // Get generated content from navigation state
  const gameConfig = location.state?.gameConfig;
  const generatedPairs = gameConfig?.generatedContent;
  
  // Loading state - show loader if we just came from setup modal with config
  const [isLoading, setIsLoading] = useState(() => {
    return !!gameConfig && !!generatedPairs;
  });

  // Game state
  const [status, setStatus] = useState<GameStatus>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(GAME_TIME_SECONDS);
  const [score, setScore] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);

  // Modals
  const [showResults, setShowResults] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Track daily games
  const gamesPlayedToday = useRef(getDailyGamesPlayed());

  // Computed values
  const pairsLeft = PAIRS_PER_GAME - matchesFound;
  const totalPairs = PAIRS_PER_GAME;
  
  // Handle loading complete
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Initialize game
  const initializeGame = useCallback(() => {
    // Use generated content from user files if available, otherwise fallback to sample data
    let pairSource: MatchPair[];
    
    if (generatedPairs && generatedPairs.length > 0) {
      // Convert generated content to MatchPair format
      // Expected format from API: [{ term: string, definition: string }, ...]
      pairSource = generatedPairs.map((pair: any, index: number) => ({
        id: `${index + 1}`,
        term: pair.term || pair.question || '',
        definition: pair.definition || pair.answer || '',
      }));
    } else {
      // Fallback to sample data
      pairSource = difficulty === 'hard' ? HARD_MODE_PAIRS : SAMPLE_PAIRS;
    }
    
    const selectedPairs = shuffleArray(pairSource).slice(0, PAIRS_PER_GAME);

    const gameCards: Card[] = [];
    selectedPairs.forEach((pair) => {
      gameCards.push({
        id: `${pair.id}-term`,
        pairId: pair.id,
        content: pair.term,
        type: 'term',
        isMatched: false,
        isSelected: false,
        isWrong: false,
      });
      gameCards.push({
        id: `${pair.id}-def`,
        pairId: pair.id,
        content: pair.definition,
        type: 'definition',
        isMatched: false,
        isSelected: false,
        isWrong: false,
      });
    });

    setCards(shuffleArray(gameCards));
    setSelectedCards([]);
    setTimeRemaining(GAME_TIME_SECONDS);
    setScore(0);
    setMatchesFound(0);
    setShowResults(false);
  }, [difficulty, generatedPairs]);

  // Auto-complete loading and auto-start game when content is generated
  useEffect(() => {
    if (isLoading && generatedPairs) {
      // Initialize the game first
      initializeGame();
      
      // Then set loading to false and auto-start game
      const timeout = setTimeout(() => {
        setIsLoading(false);
        // Auto-start the game when coming from generated content
        setStatus('countdown');
        incrementDailyGames();
        gamesPlayedToday.current += 1;
      }, 2000); // Allow time for the loading animation stages
      return () => clearTimeout(timeout);
    }
  }, [isLoading, generatedPairs, initializeGame]);

  // Start game
  const startGame = useCallback(() => {
    // Check daily limit for free users
    if (!isPro && gamesPlayedToday.current >= FREE_DAILY_LIMIT) {
      setShowUpgrade(true);
      return;
    }

    initializeGame();
    setStatus('countdown');
  }, [isPro, initializeGame]);

  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setStatus('playing');
    incrementDailyGames();
    gamesPlayedToday.current += 1;
  }, []);

  // Handle card selection
  const handleCardSelect = useCallback(
    (card: Card) => {
      if (status !== 'playing' || selectedCards.length >= 2) return;

      // Can't select same card twice
      if (selectedCards.some((c) => c.id === card.id)) return;

      // Can't select same type (must match term with definition)
      if (selectedCards.length === 1 && selectedCards[0].type === card.type) {
        // Show wrong animation briefly
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, isWrong: true } : c))
        );
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === card.id ? { ...c, isWrong: false } : c))
          );
        }, 400);
        return;
      }

      // Select the card
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, isSelected: true } : c))
      );
      const newSelected = [...selectedCards, card];
      setSelectedCards(newSelected);

      // Check for match if two cards selected
      if (newSelected.length === 2) {
        const [first, second] = newSelected;
        const isMatch = first.pairId === second.pairId;

        if (isMatch) {
          // Correct match
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.pairId === first.pairId
                  ? { ...c, isMatched: true, isSelected: false }
                  : c
              )
            );
            setScore((prev) => prev + POINTS_PER_MATCH);
            setMatchesFound((prev) => prev + 1);
            setSelectedCards([]);
          }, 300);
        } else {
          // Wrong match
          setCards((prev) =>
            prev.map((c) =>
              newSelected.some((s) => s.id === c.id) ? { ...c, isWrong: true } : c
            )
          );
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                newSelected.some((s) => s.id === c.id)
                  ? { ...c, isWrong: false, isSelected: false }
                  : c
              )
            );
            setSelectedCards([]);
          }, 600);
        }
      }
    },
    [status, selectedCards]
  );

  // Timer effect
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('lost');
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Win condition check
  useEffect(() => {
    if (status === 'playing' && matchesFound === PAIRS_PER_GAME) {
      const timeBonus = timeRemaining * TIME_BONUS_MULTIPLIER;
      setScore((prev) => prev + timeBonus);
      setStatus('won');
      setShowResults(true);
    }
  }, [matchesFound, status, timeRemaining]);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    if (!isPro && gamesPlayedToday.current >= FREE_DAILY_LIMIT) {
      setShowResults(false);
      setShowUpgrade(true);
      return;
    }
    startGame();
  }, [isPro, startGame]);

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
                Match {PAIRS_PER_GAME} pairs before time runs out
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
                {FREE_DAILY_LIMIT - gamesPlayedToday.current} free games remaining today
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

            {/* Game Board */}
            <div className="max-w-2xl mx-auto px-4 py-6">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {cards.map((card) => (
                  <GameCard
                    key={card.id}
                    card={card}
                    onSelect={handleCardSelect}
                    disabled={status !== 'playing' || selectedCards.length >= 2}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Results Modal */}
        <ResultsModal
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          onPlayAgain={handlePlayAgain}
          won={status === 'won'}
          matchesFound={matchesFound}
          totalPairs={totalPairs}
          timeRemaining={timeRemaining}
          score={score}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgrade}
          onClose={() => {
            setShowUpgrade(false);
            setStatus('idle');
          }}
          gamesPlayed={gamesPlayedToday.current}
        />
        </div>
      </GameLoadingWrapper>
    </AnimatedPage>
  );
}
