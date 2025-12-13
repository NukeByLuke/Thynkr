/**
 * MatchingGame Component
 * Single-player "Matching Rush" game - match terms with definitions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Clock,
  Zap,
  Crown,
  Check,
  Play,
  Home,
  RefreshCw,
  Lock,
  Sparkles,
  ArrowRight,
  Timer,
  Target,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AnimatedPage from '@/components/AnimatedPage';

// ============ TYPES ============

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

type GameStatus = 'idle' | 'countdown' | 'playing' | 'paused' | 'won' | 'lost';
type Difficulty = 'normal' | 'hard';

// ============ SAMPLE DATA ============

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

// ============ CONSTANTS ============

const FREE_DAILY_LIMIT = 3;
const GAME_TIME_SECONDS = 60;
const PAIRS_PER_GAME = 6;
const STORAGE_KEY = 'thynkr_matching_games';

// ============ UTILITIES ============

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
    const today = getTodayKey();
    return parsed[today] || 0;
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
    // Clean up old entries (keep only last 7 days)
    const keys = Object.keys(parsed).sort().slice(-7);
    const cleaned: Record<string, number> = {};
    keys.forEach((key) => (cleaned[key] = parsed[key]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    // Storage error, ignore
  }
}

// ============ COUNTDOWN OVERLAY ============

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

    const timer = setTimeout(() => {
      setCurrent(current - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [current, onComplete]);

  if (current <= 0) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95"
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
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center"
        >
          <motion.span
            className="text-[200px] font-bold bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent"
            animate={{
              textShadow: [
                '0 0 20px rgba(59, 130, 246, 0.5)',
                '0 0 60px rgba(59, 130, 246, 0.8)',
                '0 0 20px rgba(59, 130, 246, 0.5)',
              ],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {current}
          </motion.span>
          <motion.p
            className="text-2xl text-slate-400 mt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Match the pairs!
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ============ MATCH LINE ANIMATION ============

interface MatchLineProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
}

function MatchLine({ from, to }: MatchLineProps) {
  return (
    <svg className="absolute inset-0 pointer-events-none z-30" style={{ overflow: 'visible' }}>
      <motion.line
        x1={from.x}
        y1={from.y}
        x2={from.x}
        y2={from.y}
        stroke="url(#matchGradient)"
        strokeWidth={4}
        strokeLinecap="round"
        initial={{ x2: from.x, y2: from.y }}
        animate={{ x2: to.x, y2: to.y }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="matchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ============ GAME CARD COMPONENT ============

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

  return (
    <motion.button
      onClick={handleClick}
      disabled={disabled || card.isMatched}
      className={clsx(
        'relative w-full h-28 sm:h-32 rounded-xl font-medium text-sm sm:text-base',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-purple-500',
        card.isMatched && 'opacity-0 pointer-events-none',
        card.isSelected && !card.isWrong && 'ring-4 ring-purple-500 scale-105',
        card.isWrong && 'ring-4 ring-red-500',
        !card.isMatched &&
          !card.isSelected &&
          !card.isWrong &&
          'hover:scale-102 hover:shadow-lg',
        card.type === 'term'
          ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
          : 'bg-gradient-to-br from-purple-500 to-pink-600 text-white'
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: card.isMatched ? 0 : 1,
        scale: card.isMatched ? 0.5 : card.isSelected ? 1.05 : 1,
        x: card.isWrong ? [0, -10, 10, -10, 10, 0] : 0,
      }}
      transition={{
        duration: card.isWrong ? 0.4 : 0.3,
        x: { duration: 0.4 },
      }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Card label */}
      <div className="absolute top-2 left-2">
        <span
          className={clsx(
            'text-xs font-bold px-2 py-0.5 rounded-full',
            card.type === 'term'
              ? 'bg-cyan-700/50 text-cyan-100'
              : 'bg-purple-700/50 text-purple-100'
          )}
        >
          {card.type === 'term' ? 'TERM' : 'DEF'}
        </span>
      </div>

      {/* Card content */}
      <div className="flex items-center justify-center h-full p-3 pt-6">
        <p className="text-center leading-tight line-clamp-3">{card.content}</p>
      </div>

      {/* Match success indicator */}
      <AnimatePresence>
        {card.isMatched && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-xl"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-12 h-12 text-white" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============ TIMER DISPLAY ============

interface TimerDisplayProps {
  seconds: number;
  total: number;
}

function TimerDisplay({ seconds, total }: TimerDisplayProps) {
  const percentage = (seconds / total) * 100;
  const isLow = seconds <= 10;

  return (
    <div className="flex items-center gap-3">
      <Timer className={clsx('w-6 h-6', isLow ? 'text-red-500' : 'text-slate-400')} />
      <div className="w-32 h-3 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full', isLow ? 'bg-red-500' : 'bg-cyan-500')}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <motion.span
        className={clsx('text-xl font-bold min-w-[3ch]', isLow ? 'text-red-500' : 'text-white')}
        animate={isLow ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isLow ? Infinity : 0 }}
      >
        {seconds}s
      </motion.span>
    </div>
  );
}

// ============ RESULTS MODAL ============

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
  timeRemaining,
  score,
}: ResultsModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center p-6">
        {/* Icon */}
        <motion.div
          className={clsx(
            'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6',
            won
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-gradient-to-br from-orange-400 to-red-500'
          )}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
        >
          {won ? (
            <Trophy className="w-10 h-10 text-white" />
          ) : (
            <Clock className="w-10 h-10 text-white" />
          )}
        </motion.div>

        {/* Title */}
        <motion.h2
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {won ? 'Amazing!' : "Time's Up!"}
        </motion.h2>

        {/* Stats */}
        <motion.div
          className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-purple-500">{matchesFound}</p>
              <p className="text-xs text-slate-500">Matches</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-cyan-500">{timeRemaining}s</p>
              <p className="text-xs text-slate-500">Time Left</p>
            </div>
            <div>
              <motion.p
                className="text-2xl font-bold text-green-500"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.5 }}
              >
                {score}
              </motion.p>
              <p className="text-xs text-slate-500">Score</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => navigate('/arcade')}
          >
            <Home className="w-4 h-4 mr-2" />
            Lobby
          </Button>
          <Button variant="primary" className="flex-1" onClick={onPlayAgain}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Play Again
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============ UPGRADE MODAL ============

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamesPlayed: number;
}

function UpgradeModal({ isOpen, onClose, gamesPlayed }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center p-6">
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 bg-gradient-to-br from-amber-400 to-yellow-500"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Lock className="w-10 h-10 text-slate-900" />
        </motion.div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Daily Limit Reached
        </h2>

        <p className="text-gray-600 dark:text-slate-400 mb-6">
          You've played {gamesPlayed}/{FREE_DAILY_LIMIT} free games today. Upgrade to Pro for
          unlimited games and Hard Mode!
        </p>

        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Pro benefits:</h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              Unlimited daily games
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              Hard Mode with advanced terms
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              Global leaderboards
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Maybe Later
          </Button>
          <Button
            variant="primary"
            className="flex-1 !bg-gradient-to-r !from-amber-400 !to-yellow-500 !text-slate-900"
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
          >
            Upgrade
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============ MAIN MATCHING GAME COMPONENT ============

export default function MatchingGame() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // User tier
  const isPro =
    user?.role === 'STANDARD' || user?.role === 'PREMIUM' || user?.role === 'ADMIN';

  // Game state
  const [status, setStatus] = useState<GameStatus>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(GAME_TIME_SECONDS);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [matchLine, setMatchLine] = useState<{ from: Card; to: Card } | null>(null);

  // Daily games tracking
  const [gamesPlayed, setGamesPlayed] = useState(getDailyGamesPlayed);

  // Check if user can play
  const canPlay = isPro || gamesPlayed < FREE_DAILY_LIMIT;

  // Generate cards from pairs
  const generateCards = useCallback((pairs: MatchPair[]): Card[] => {
    const selectedPairs = shuffleArray(pairs).slice(0, PAIRS_PER_GAME);
    
    const termCards: Card[] = selectedPairs.map((pair) => ({
      id: `term-${pair.id}`,
      pairId: pair.id,
      content: pair.term,
      type: 'term',
      isMatched: false,
      isSelected: false,
      isWrong: false,
    }));

    const defCards: Card[] = selectedPairs.map((pair) => ({
      id: `def-${pair.id}`,
      pairId: pair.id,
      content: pair.definition,
      type: 'definition',
      isMatched: false,
      isSelected: false,
      isWrong: false,
    }));

    // Shuffle terms and definitions separately for better UX
    return [...shuffleArray(termCards), ...shuffleArray(defCards)];
  }, []);

  // Initialize game
  const startGame = useCallback(() => {
    if (!canPlay) {
      setShowUpgrade(true);
      return;
    }

    const pairs = difficulty === 'hard' ? HARD_MODE_PAIRS : SAMPLE_PAIRS;
    setCards(generateCards(pairs));
    setSelectedCard(null);
    setMatchedPairs([]);
    setTimeRemaining(GAME_TIME_SECONDS);
    setScore(0);
    setMatchLine(null);
    setStatus('countdown');
  }, [canPlay, difficulty, generateCards]);

  // Handle countdown complete
  const handleCountdownComplete = useCallback(() => {
    setStatus('playing');
    incrementDailyGames();
    setGamesPlayed((prev) => prev + 1);
  }, []);

  // Timer effect
  useEffect(() => {
    if (status !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setStatus('lost');
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  // Check win condition
  useEffect(() => {
    if (status === 'playing' && matchedPairs.length === PAIRS_PER_GAME) {
      setStatus('won');
      setShowResults(true);
    }
  }, [matchedPairs.length, status]);

  // Handle card selection
  const handleCardSelect = useCallback(
    (card: Card) => {
      if (status !== 'playing' || card.isMatched) return;

      // If no card selected, select this one
      if (!selectedCard) {
        setCards((prev) =>
          prev.map((c) => ({
            ...c,
            isSelected: c.id === card.id,
            isWrong: false,
          }))
        );
        setSelectedCard(card);
        return;
      }

      // If clicking same card, deselect
      if (selectedCard.id === card.id) {
        setCards((prev) =>
          prev.map((c) => ({
            ...c,
            isSelected: false,
          }))
        );
        setSelectedCard(null);
        return;
      }

      // Must select different types (term + definition)
      if (selectedCard.type === card.type) {
        // Switch selection to new card of same type
        setCards((prev) =>
          prev.map((c) => ({
            ...c,
            isSelected: c.id === card.id,
            isWrong: false,
          }))
        );
        setSelectedCard(card);
        return;
      }

      // Check for match
      const isMatch = selectedCard.pairId === card.pairId;

      if (isMatch) {
        // Correct match!
        const timeBonus = Math.floor(timeRemaining / 10);
        const pointsEarned = 100 + timeBonus * 10;
        setScore((prev) => prev + pointsEarned);

        // Show match line animation
        setMatchLine({ from: selectedCard, to: card });

        // Mark as matched after brief delay
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => ({
              ...c,
              isMatched: c.pairId === card.pairId ? true : c.isMatched,
              isSelected: false,
            }))
          );
          setMatchedPairs((prev) => [...prev, card.pairId]);
          setMatchLine(null);
        }, 400);
      } else {
        // Wrong match - shake and reset
        setCards((prev) =>
          prev.map((c) => ({
            ...c,
            isWrong: c.id === selectedCard.id || c.id === card.id,
            isSelected: false,
          }))
        );

        // Clear wrong state after animation
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => ({
              ...c,
              isWrong: false,
            }))
          );
        }, 500);
      }

      setSelectedCard(null);
    },
    [selectedCard, status, timeRemaining]
  );

  // Play again handler
  const handlePlayAgain = useCallback(() => {
    setShowResults(false);
    if (canPlay) {
      startGame();
    } else {
      setStatus('idle');
      setShowUpgrade(true);
    }
  }, [canPlay, startGame]);

  // Split cards into terms and definitions for layout
  const termCards = useMemo(() => cards.filter((c) => c.type === 'term'), [cards]);
  const defCards = useMemo(() => cards.filter((c) => c.type === 'definition'), [cards]);

  // Idle/Menu state
  if (status === 'idle') {
    return (
      <AnimatedPage>
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 mb-4">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Matching Rush</h1>
            <p className="text-slate-400">Match terms with their definitions before time runs out!</p>
          </motion.div>

          {/* Game mode selection */}
          <motion.div
            className="w-full max-w-md space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Difficulty selection */}
            <div className="bg-slate-800/60 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4">Select Difficulty</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDifficulty('normal')}
                  className={clsx(
                    'p-4 rounded-xl border-2 transition-all',
                    difficulty === 'normal'
                      ? 'border-cyan-500 bg-cyan-500/20'
                      : 'border-slate-700 hover:border-slate-600'
                  )}
                >
                  <Target className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Normal</p>
                  <p className="text-xs text-slate-400">Basic terms</p>
                </button>

                <button
                  onClick={() => isPro && setDifficulty('hard')}
                  disabled={!isPro}
                  className={clsx(
                    'p-4 rounded-xl border-2 transition-all relative',
                    difficulty === 'hard'
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-slate-700',
                    !isPro && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {!isPro && (
                    <div className="absolute top-2 right-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                  <Sparkles className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Hard</p>
                  <p className="text-xs text-slate-400">
                    {isPro ? 'Advanced terms' : 'Pro only'}
                  </p>
                </button>
              </div>
            </div>

            {/* Daily games counter (Free users) */}
            {!isPro && (
              <div className="bg-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Daily games</p>
                  <p className="text-white font-bold">
                    {gamesPlayed}/{FREE_DAILY_LIMIT}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[...Array(FREE_DAILY_LIMIT)].map((_, i) => (
                    <div
                      key={i}
                      className={clsx(
                        'w-3 h-3 rounded-full',
                        i < gamesPlayed ? 'bg-cyan-500' : 'bg-slate-700'
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Start button */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={startGame}
              disabled={!canPlay}
              className="!bg-gradient-to-r !from-cyan-500 !to-blue-600"
            >
              <Play className="w-6 h-6 mr-2" />
              {canPlay ? 'Start Game' : 'No Games Left Today'}
            </Button>

            {/* Back to lobby */}
            <Button variant="ghost" fullWidth onClick={() => navigate('/arcade')}>
              <Home className="w-5 h-5 mr-2" />
              Back to Arcade
            </Button>
          </motion.div>

          {/* Upgrade modal */}
          <UpgradeModal
            isOpen={showUpgrade}
            onClose={() => setShowUpgrade(false)}
            gamesPlayed={gamesPlayed}
          />
        </div>
      </AnimatedPage>
    );
  }

  // Playing state
  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4">
        {/* Countdown overlay */}
        <AnimatePresence>
          {status === 'countdown' && (
            <CountdownOverlay count={3} onComplete={handleCountdownComplete} />
          )}
        </AnimatePresence>

        {/* Game header */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="flex items-center justify-between">
            {/* Score */}
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <motion.span
                key={score}
                className="text-2xl font-bold text-white"
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
              >
                {score}
              </motion.span>
            </div>

            {/* Timer */}
            <TimerDisplay seconds={timeRemaining} total={GAME_TIME_SECONDS} />

            {/* Matches found */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Matches:</span>
              <span className="text-xl font-bold text-white">
                {matchedPairs.length}/{PAIRS_PER_GAME}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
              initial={false}
              animate={{ width: `${(matchedPairs.length / PAIRS_PER_GAME) * 100}%` }}
            />
          </div>
        </div>

        {/* Game board */}
        <div className="max-w-4xl mx-auto relative">
          {/* Match line animation */}
          {matchLine && (
            <MatchLine
              from={{ x: 100, y: 100 }}
              to={{ x: 300, y: 200 }}
            />
          )}

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            {/* Terms column */}
            <div className="space-y-3">
              <div className="text-center mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300">
                  TERMS
                </span>
              </div>
              {termCards.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  onSelect={handleCardSelect}
                  disabled={status !== 'playing'}
                />
              ))}
            </div>

            {/* Definitions column */}
            <div className="space-y-3">
              <div className="text-center mb-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300">
                  DEFINITIONS
                </span>
              </div>
              {defCards.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  onSelect={handleCardSelect}
                  disabled={status !== 'playing'}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Results modal */}
        <ResultsModal
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          onPlayAgain={handlePlayAgain}
          won={status === 'won'}
          matchesFound={matchedPairs.length}
          totalPairs={PAIRS_PER_GAME}
          timeRemaining={timeRemaining}
          score={score}
        />
      </div>
    </AnimatedPage>
  );
}
