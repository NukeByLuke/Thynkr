/**
 * QuizGame Component
 * Minimalist live quiz interface with clean "Assessment" aesthetic
 * Features stacked options for players and projector-friendly host view
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Users,
  Clock,
  Zap,
  Crown,
  Check,
  X,
  Play,
  SkipForward,
  Home,
  ChevronRight,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket, LeaderboardEntry } from '@/hooks/useGameSocket';
import Button from '@/components/ui/Button';
import AnimatedPage from '@/components/AnimatedPage';

// =============================================================================
// Types
// =============================================================================

interface OptionState {
  isSelected: boolean;
  isCorrect: boolean | null;
  isRevealed: boolean;
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
            Get ready!
          </p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// Feedback Overlay (Player)
// =============================================================================

interface FeedbackOverlayProps {
  isCorrect: boolean;
  points: number;
  streak: number;
}

function FeedbackOverlay({ isCorrect, points, streak }: FeedbackOverlayProps) {
  return (
    <motion.div
      className={clsx(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/50' : 'bg-red-50 dark:bg-red-900/50'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12 }}
      >
        {isCorrect ? (
          <>
            <div
              className={clsx(
                'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6',
                'bg-emerald-100 dark:bg-emerald-800'
              )}
            >
              <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-3xl font-bold text-emerald-700 dark:text-emerald-300 mb-2">
              Correct!
            </h2>
            <motion.p
              className="text-5xl font-bold text-emerald-600 dark:text-emerald-400"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.2 }}
            >
              +{points}
            </motion.p>
            {streak > 1 && (
              <motion.div
                className="mt-4 flex items-center justify-center gap-2 text-lg text-amber-600 dark:text-amber-400"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Zap className="w-5 h-5" />
                <span className="font-semibold">{streak} streak!</span>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div animate={{ x: [-8, 8, -8, 8, 0] }} transition={{ duration: 0.4 }}>
            <div
              className={clsx(
                'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6',
                'bg-red-100 dark:bg-red-800'
              )}
            >
              <X className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-red-700 dark:text-red-300">
              Incorrect
            </h2>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Timer Display (Minimalist)
// =============================================================================

interface TimerDisplayProps {
  seconds: number;
  total: number;
}

function TimerDisplay({ seconds, total }: TimerDisplayProps) {
  const percentage = (seconds / total) * 100;
  const isLow = seconds <= 5;

  return (
    <div className="flex items-center gap-3">
      <Clock
        className={clsx('w-5 h-5', isLow ? 'text-red-500' : 'text-slate-400 dark:text-slate-500')}
      />
      <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={clsx('h-full rounded-full', isLow ? 'bg-red-500' : 'bg-blue-500')}
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <motion.span
        className={clsx(
          'font-mono text-lg font-semibold min-w-[2.5rem]',
          isLow ? 'text-red-500' : 'text-slate-900 dark:text-white'
        )}
        animate={isLow ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isLow ? Infinity : 0 }}
      >
        {seconds}s
      </motion.span>
    </div>
  );
}

// =============================================================================
// Answer Distribution Chart (Host - Minimalist White Bars)
// =============================================================================

interface AnswerChartProps {
  options: string[];
  counts: Record<string, number>;
  correctAnswer?: string;
  revealed?: boolean;
}

function AnswerChart({ options, counts, correctAnswer, revealed }: AnswerChartProps) {
  const maxCount = Math.max(...Object.values(counts), 1);
  const totalAnswers = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const count = counts[option] || 0;
        const percentage = totalAnswers > 0 ? (count / totalAnswers) * 100 : 0;
        const widthPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const isCorrect = revealed && option === correctAnswer;
        const isWrong = revealed && option !== correctAnswer;

        return (
          <div key={index} className="flex items-center gap-4">
            {/* Option letter */}
            <div
              className={clsx(
                'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg',
                isCorrect
                  ? 'bg-emerald-500 text-white'
                  : isWrong
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              )}
            >
              {String.fromCharCode(65 + index)}
            </div>

            {/* Bar */}
            <div className="flex-1">
              <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                <motion.div
                  className={clsx(
                    'h-full rounded-lg',
                    isCorrect
                      ? 'bg-emerald-500'
                      : isWrong
                      ? 'bg-slate-300 dark:bg-slate-600'
                      : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <div className="absolute inset-0 flex items-center px-4">
                  <span
                    className={clsx(
                      'text-sm font-medium truncate',
                      isCorrect
                        ? 'text-white'
                        : isWrong
                        ? 'text-slate-400'
                        : 'text-slate-700 dark:text-slate-300'
                    )}
                  >
                    {option}
                  </span>
                </div>
              </div>
            </div>

            {/* Count */}
            <div className="w-16 text-right">
              <span
                className={clsx(
                  'font-mono font-semibold',
                  isCorrect
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                {count}
              </span>
              <span className="text-xs text-slate-400 ml-1">
                ({Math.round(percentage)}%)
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Leaderboard Display (Clean)
// =============================================================================

interface LeaderboardDisplayProps {
  entries: LeaderboardEntry[];
  highlightId?: string;
  showAll?: boolean;
}

function LeaderboardDisplay({ entries, highlightId, showAll = false }: LeaderboardDisplayProps) {
  const displayEntries = showAll ? entries : entries.slice(0, 5);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Trophy className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Leaderboard</h2>
      </div>

      <div className="space-y-2">
        {displayEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            className={clsx(
              'flex items-center gap-4 p-4 rounded-xl',
              'bg-white dark:bg-slate-800',
              'border',
              entry.id === highlightId
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                : 'border-slate-200 dark:border-slate-700'
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* Rank */}
            <div
              className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold',
                index === 0
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : index === 1
                  ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                  : index === 2
                  ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
              )}
            >
              {entry.rank}
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {entry.nickname}
              </p>
              {entry.streak > 0 && (
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {entry.streak} streak
                </p>
              )}
            </div>

            {/* Score */}
            <div className="text-right">
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {entry.score.toLocaleString()}
              </p>
              <p className="text-xs text-slate-500">points</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Option Button (Player - Clean Assessment Style)
// =============================================================================

interface OptionButtonProps {
  option: string;
  index: number;
  state: OptionState;
  disabled: boolean;
  onClick: () => void;
}

function OptionButton({ option, index, state, disabled, onClick }: OptionButtonProps) {
  const letter = String.fromCharCode(65 + index);

  const getStateClasses = () => {
    if (state.isRevealed) {
      if (state.isCorrect) {
        return 'bg-emerald-500 border-emerald-600 text-white';
      }
      if (state.isSelected && !state.isCorrect) {
        return 'bg-red-50 dark:bg-red-500/10 border-red-300 dark:border-red-500 text-red-700 dark:text-red-400';
      }
      return 'opacity-50 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
    if (state.isSelected) {
      return 'ring-2 ring-blue-500 border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300';
    }
    return 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500';
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'w-full p-5 text-left rounded-2xl border-2 transition-all duration-150',
        'flex items-center gap-4',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
        disabled && !state.isRevealed && 'cursor-not-allowed',
        getStateClasses()
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
    >
      {/* Letter badge */}
      <div
        className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0',
          state.isRevealed && state.isCorrect
            ? 'bg-white/20 text-white'
            : state.isSelected
            ? 'bg-blue-500 text-white'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
        )}
      >
        {letter}
      </div>

      {/* Option text */}
      <span className="flex-1 font-medium">{option}</span>

      {/* Status icon */}
      {state.isRevealed && state.isCorrect && <Check className="w-6 h-6 flex-shrink-0" />}
      {state.isRevealed && state.isSelected && !state.isCorrect && (
        <X className="w-6 h-6 flex-shrink-0" />
      )}
      {state.isSelected && !state.isRevealed && (
        <ChevronRight className="w-5 h-5 flex-shrink-0 text-blue-500" />
      )}
    </motion.button>
  );
}

// =============================================================================
// Host View (Projector-Friendly)
// =============================================================================

interface HostViewProps {
  gameState: ReturnType<typeof useGameSocket>;
}

function HostView({ gameState }: HostViewProps) {
  const {
    currentQuestion,
    timeRemaining,
    players,
    leaderboard,
    status,
    totalQuestions,
    answerCounts,
    startGame,
    nextQuestion,
  } = gameState;

  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState(false);

  // Show leaderboard when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && status === 'active') {
      setRevealAnswer(true);
      const timer = setTimeout(() => setShowLeaderboard(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining, status]);

  // Reset on new question
  useEffect(() => {
    if (currentQuestion) {
      setShowLeaderboard(false);
      setRevealAnswer(false);
    }
  }, [currentQuestion?.index]);

  // Waiting room
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-500/20 mb-6">
            <Trophy className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Waiting for Players
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Share the PIN code to let players join
          </p>

          {/* Player count */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <div className="flex items-center justify-center gap-3 text-2xl mb-4">
              <Users className="w-7 h-7 text-slate-400" />
              <span className="font-bold text-slate-900 dark:text-white">{players.length}</span>
              <span className="text-slate-500">players joined</span>
            </div>

            {/* Player list */}
            {players.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {players.map((player) => (
                  <motion.div
                    key={player.id}
                    className="bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full text-sm text-slate-700 dark:text-slate-300"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {player.nickname}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={startGame} disabled={players.length === 0} className="px-8">
            <Play className="w-5 h-5 mr-2" />
            Start Game
          </Button>
        </motion.div>
      </div>
    );
  }

  // Game finished
  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          {/* Winner announcement */}
          {leaderboard[0] && (
            <motion.div
              className="text-center mb-10"
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Crown className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Winner!</h1>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {leaderboard[0].nickname}
              </p>
              <p className="text-lg text-slate-500 mt-1">
                {leaderboard[0].score.toLocaleString()} points
              </p>
            </motion.div>
          )}

          <LeaderboardDisplay entries={leaderboard} showAll />

          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={() => (window.location.href = '/arcade')}>
              <Home className="w-5 h-5 mr-2" />
              Back to Games
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active game
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <AnimatePresence mode="wait">
        {showLeaderboard ? (
          <motion.div
            key="leaderboard"
            className="flex flex-col items-center justify-center min-h-[80vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LeaderboardDisplay
              entries={players
                .sort((a, b) => b.score - a.score)
                .map((p, i) => ({
                  rank: i + 1,
                  id: p.id,
                  nickname: p.nickname,
                  score: p.score,
                  streak: p.streak || 0,
                }))}
            />

            <motion.div
              className="mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button onClick={nextQuestion}>
                <SkipForward className="w-5 h-5 mr-2" />
                Next Question
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="question"
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Question {(currentQuestion?.index || 0) + 1} of {totalQuestions}
              </span>
              <TimerDisplay seconds={timeRemaining} total={currentQuestion?.timeLimit || 20} />
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Users className="w-4 h-4" />
                {players.length} players
              </div>
            </div>

            {/* Question Card */}
            <motion.div
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 mb-6 shadow-sm"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center leading-relaxed">
                {currentQuestion?.content}
              </h2>
            </motion.div>

            {/* Answer Distribution */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 text-center">
                Answer Distribution
              </h3>
              <AnswerChart
                options={currentQuestion?.options || []}
                counts={answerCounts}
                correctAnswer={revealAnswer ? currentQuestion?.options[0] : undefined}
                revealed={revealAnswer}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Player View (Clean Assessment Style)
// =============================================================================

interface PlayerViewProps {
  gameState: ReturnType<typeof useGameSocket>;
}

function PlayerView({ gameState }: PlayerViewProps) {
  const { currentQuestion, timeRemaining, status, lastResult, submitAnswer } = gameState;
  const navigate = useNavigate();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // Reset selection on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsRevealed(false);
  }, [currentQuestion?.index]);

  // Show feedback when result comes in
  useEffect(() => {
    if (lastResult) {
      setIsRevealed(true);
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  // Handle answer selection
  const handleAnswer = (option: string) => {
    if (selectedAnswer || isRevealed) return;
    setSelectedAnswer(option);
    submitAnswer(option);
  };

  // Get option state
  const getOptionState = (option: string): OptionState => ({
    isSelected: option === selectedAnswer,
    isCorrect: isRevealed && lastResult ? option === lastResult.correctAnswer : null,
    isRevealed,
  });

  // Waiting room
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-500/20 mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">You're In!</h2>
          <p className="text-slate-500 dark:text-slate-400">Waiting for the host to start...</p>
        </motion.div>
      </div>
    );
  }

  // Game finished
  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/20 mb-6">
            <Trophy className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Game Over!</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Check the host screen for final results
          </p>
          <Button onClick={() => navigate('/arcade')}>
            <Home className="w-5 h-5 mr-2" />
            Back to Games
          </Button>
        </motion.div>
      </div>
    );
  }

  // Feedback overlay
  if (showFeedback && lastResult) {
    return (
      <FeedbackOverlay
        isCorrect={lastResult.correct}
        points={lastResult.pointsEarned}
        streak={lastResult.streak}
      />
    );
  }

  // Active game
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Q{(currentQuestion?.index || 0) + 1}
          </span>
          <TimerDisplay seconds={timeRemaining} total={currentQuestion?.timeLimit || 20} />
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center">
            {currentQuestion?.content}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion?.options.map((option, index) => (
            <OptionButton
              key={index}
              option={option}
              index={index}
              state={getOptionState(option)}
              disabled={!!selectedAnswer || isRevealed}
              onClick={() => handleAnswer(option)}
            />
          ))}
        </div>

        {/* Selected indicator */}
        {selectedAnswer && !isRevealed && (
          <motion.p
            className="text-center text-slate-500 dark:text-slate-400 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Answer locked! Waiting for results...
          </motion.p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Main QuizGame Component
// =============================================================================

export default function QuizGame() {
  const { pinCode } = useParams<{ pinCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const nicknameParam = searchParams.get('nickname');
  const nickname = nicknameParam || user?.username || 'Player';

  const gameState = useGameSocket({ autoConnect: true });
  const [showCountdown, setShowCountdown] = useState(false);
  const [isJoining, setIsJoining] = useState(true);

  // Join session on mount
  useEffect(() => {
    if (pinCode && gameState.isConnected && isJoining) {
      const token = localStorage.getItem('accessToken') || undefined;
      gameState.joinSession(pinCode, nickname, token);
      setIsJoining(false);
    }
  }, [pinCode, gameState.isConnected, isJoining, nickname]);

  // Show countdown when game starts
  useEffect(() => {
    if (gameState.status === 'active' && !showCountdown) {
      setShowCountdown(true);
    }
  }, [gameState.status]);

  // Error state
  if (gameState.error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 rounded-2xl p-8 max-w-md"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-500/20 mb-6">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400 mb-6">{gameState.error}</p>
          <Button variant="outline" onClick={() => navigate('/arcade')}>
            Back to Games
          </Button>
        </motion.div>
      </div>
    );
  }

  // Connecting state
  if (!gameState.isConnected || gameState.status === 'connecting' || gameState.status === 'idle') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-slate-500 dark:text-slate-400">Connecting to game...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatedPage>
      {/* Countdown overlay */}
      <AnimatePresence>
        {showCountdown && <CountdownOverlay count={3} onComplete={() => setShowCountdown(false)} />}
      </AnimatePresence>

      {/* Render appropriate view */}
      {gameState.isHost ? <HostView gameState={gameState} /> : <PlayerView gameState={gameState} />}
    </AnimatedPage>
  );
}
