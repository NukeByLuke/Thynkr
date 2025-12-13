/**
 * QuizGame Component
 * Kahoot-style live quiz interface with Host and Player views
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
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useGameSocket, LeaderboardEntry } from '@/hooks/useGameSocket';
import Button from '@/components/ui/Button';
import AnimatedPage from '@/components/AnimatedPage';

// ============ CONSTANTS ============

const OPTION_COLORS = [
  { bg: 'bg-red-500', hover: 'hover:bg-red-400', border: 'border-red-400', text: 'text-red-500' },
  { bg: 'bg-blue-500', hover: 'hover:bg-blue-400', border: 'border-blue-400', text: 'text-blue-500' },
  { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-400', border: 'border-yellow-400', text: 'text-yellow-500' },
  { bg: 'bg-green-500', hover: 'hover:bg-green-400', border: 'border-green-400', text: 'text-green-500' },
];

const OPTION_SHAPES = ['▲', '◆', '●', '■'];

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
            className="text-[200px] font-bold bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
            animate={{
              textShadow: [
                '0 0 20px rgba(168, 85, 247, 0.5)',
                '0 0 60px rgba(168, 85, 247, 0.8)',
                '0 0 20px rgba(168, 85, 247, 0.5)',
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
            Get Ready!
          </motion.p>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ============ SCORE ANIMATION (exported for future host overlay use) ============

interface ScoreAnimationProps {
  points: number;
  isCorrect: boolean;
}

export function ScoreAnimation({ points, isCorrect }: ScoreAnimationProps) {
  return (
    <motion.div
      className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={clsx(
          'text-6xl font-bold',
          isCorrect ? 'text-green-400' : 'text-red-400'
        )}
        initial={{ scale: 0, y: 50 }}
        animate={{ scale: [0, 1.2, 1], y: [50, 0, -20] }}
        exit={{ opacity: 0, y: -100 }}
        transition={{ duration: 0.8 }}
      >
        {isCorrect ? (
          <>
            +{points}
            <motion.span
              className="inline-block ml-2"
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              🎉
            </motion.span>
          </>
        ) : (
          '❌'
        )}
      </motion.div>
    </motion.div>
  );
}

// ============ FEEDBACK OVERLAY (PLAYER) ============

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
        isCorrect
          ? 'bg-gradient-to-br from-green-600 to-emerald-700'
          : 'bg-gradient-to-br from-red-600 to-rose-700'
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Sparkles for correct answer */}
      {isCorrect && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -100],
              }}
              transition={{
                duration: 1.5,
                delay: Math.random() * 0.5,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        className="text-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 10 }}
      >
        {isCorrect ? (
          <>
            <motion.div
              className="text-8xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
            >
              ✓
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-2">Correct!</h2>
            <motion.p
              className="text-6xl font-bold text-yellow-300"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ delay: 0.3 }}
            >
              +{points}
            </motion.p>
            {streak > 1 && (
              <motion.div
                className="mt-4 flex items-center justify-center gap-2 text-2xl text-yellow-200"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Zap className="w-6 h-6" />
                <span>{streak} streak!</span>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            animate={{ x: [-10, 10, -10, 10, 0] }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-8xl mb-4">✗</div>
            <h2 className="text-4xl font-bold text-white">Wrong!</h2>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============ TIMER DISPLAY ============

interface TimerDisplayProps {
  seconds: number;
  total: number;
  size?: 'sm' | 'lg';
}

function TimerDisplay({ seconds, total, size = 'lg' }: TimerDisplayProps) {
  const percentage = (seconds / total) * 100;
  const isLow = seconds <= 5;

  return (
    <div className={clsx('relative', size === 'lg' ? 'w-32 h-32' : 'w-16 h-16')}>
      {/* Background circle */}
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-700"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className={isLow ? 'text-red-500' : 'text-purple-500'}
          strokeDasharray={`${percentage * 2.83} 283`}
          initial={false}
          animate={{ strokeDasharray: `${percentage * 2.83} 283` }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      {/* Number */}
      <motion.div
        className={clsx(
          'absolute inset-0 flex items-center justify-center font-bold',
          size === 'lg' ? 'text-4xl' : 'text-xl',
          isLow ? 'text-red-500' : 'text-white'
        )}
        animate={isLow ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.5, repeat: isLow ? Infinity : 0 }}
      >
        {seconds}
      </motion.div>
    </div>
  );
}

// ============ ANSWER BAR CHART (HOST) ============

interface AnswerBarChartProps {
  options: string[];
  counts: Record<string, number>;
}

function AnswerBarChart({ options, counts }: AnswerBarChartProps) {
  const maxCount = Math.max(...Object.values(counts), 1);

  return (
    <div className="flex items-end justify-center gap-4 h-48">
      {options.map((option, index) => {
        const count = counts[option] || 0;
        const height = (count / maxCount) * 100;

        return (
          <div key={option} className="flex flex-col items-center gap-2">
            <span className="text-white font-bold text-lg">{count}</span>
            <motion.div
              className={clsx('w-20 rounded-t-lg', OPTION_COLORS[index]?.bg || 'bg-gray-500')}
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 10)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            <span className="text-2xl">{OPTION_SHAPES[index]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============ LEADERBOARD DISPLAY ============

interface LeaderboardDisplayProps {
  entries: LeaderboardEntry[];
  highlightId?: string;
  showAll?: boolean;
}

function LeaderboardDisplay({ entries, highlightId, showAll = false }: LeaderboardDisplayProps) {
  const displayEntries = showAll ? entries : entries.slice(0, 5);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <h2 className="text-3xl font-bold text-white">Leaderboard</h2>
      </div>

      <div className="space-y-3">
        {displayEntries.map((entry, index) => (
          <motion.div
            key={entry.id}
            className={clsx(
              'flex items-center gap-4 p-4 rounded-xl',
              entry.id === highlightId
                ? 'bg-purple-500/30 border-2 border-purple-500'
                : 'bg-slate-800/60'
            )}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {/* Rank */}
            <div
              className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl',
                index === 0
                  ? 'bg-yellow-500 text-slate-900'
                  : index === 1
                  ? 'bg-slate-400 text-slate-900'
                  : index === 2
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300'
              )}
            >
              {entry.rank}
            </div>

            {/* Name */}
            <div className="flex-1">
              <p className="text-lg font-semibold text-white">{entry.nickname}</p>
              {entry.streak > 0 && (
                <p className="text-sm text-yellow-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {entry.streak} streak
                </p>
              )}
            </div>

            {/* Score */}
            <div className="text-right">
              <motion.p
                className="text-2xl font-bold text-white"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                {entry.score.toLocaleString()}
              </motion.p>
              <p className="text-sm text-slate-400">points</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============ HOST VIEW ============

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

  // Show leaderboard when time runs out
  useEffect(() => {
    if (timeRemaining === 0 && status === 'active') {
      setShowLeaderboard(true);
    }
  }, [timeRemaining, status]);

  // Reset leaderboard view on new question
  useEffect(() => {
    if (currentQuestion) {
      setShowLeaderboard(false);
    }
  }, [currentQuestion?.index]);

  // Waiting room
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8">
            <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-2">Waiting for Players</h1>
            <p className="text-slate-400 text-lg">Share the PIN code to let players join</p>
          </div>

          {/* Player count */}
          <div className="bg-slate-800/60 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-center gap-3 text-2xl text-white mb-4">
              <Users className="w-8 h-8" />
              <span className="font-bold">{players.length}</span>
              <span className="text-slate-400">players joined</span>
            </div>

            {/* Player list */}
            <div className="flex flex-wrap justify-center gap-2">
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  className="bg-purple-500/30 px-4 py-2 rounded-full text-purple-200"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  {player.nickname}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Start button */}
          <Button
            variant="primary"
            size="lg"
            onClick={startGame}
            disabled={players.length === 0}
            className="px-12"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Game
          </Button>
        </motion.div>
      </div>
    );
  }

  // Game finished
  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full"
        >
          {/* Winner announcement */}
          {leaderboard[0] && (
            <motion.div
              className="text-center mb-12"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h1 className="text-5xl font-bold text-white mb-2">Winner!</h1>
              <p className="text-3xl text-yellow-400 font-bold">{leaderboard[0].nickname}</p>
              <p className="text-xl text-slate-400 mt-2">
                {leaderboard[0].score.toLocaleString()} points
              </p>
            </motion.div>
          )}

          <LeaderboardDisplay entries={leaderboard} showAll />

          <div className="flex justify-center mt-8">
            <Button variant="secondary" size="lg" onClick={() => window.location.href = '/arcade'}>
              <Home className="w-5 h-5 mr-2" />
              Back to Lobby
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Active game - showing question or leaderboard between rounds
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8">
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
              transition={{ delay: 1 }}
            >
              <Button variant="primary" size="lg" onClick={nextQuestion}>
                <SkipForward className="w-5 h-5 mr-2" />
                Next Question
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="text-slate-400">
                Question {(currentQuestion?.index || 0) + 1} of {totalQuestions}
              </div>
              <TimerDisplay
                seconds={timeRemaining}
                total={currentQuestion?.timeLimit || 20}
              />
              <div className="flex items-center gap-2 text-slate-400">
                <Users className="w-5 h-5" />
                {players.length} players
              </div>
            </div>

            {/* Question */}
            <motion.div
              className="bg-slate-800/60 rounded-3xl p-12 mb-8 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-4xl font-bold text-white leading-relaxed">
                {currentQuestion?.content}
              </h2>
            </motion.div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {currentQuestion?.options.map((option, index) => (
                <motion.div
                  key={index}
                  className={clsx(
                    'p-6 rounded-2xl flex items-center gap-4',
                    OPTION_COLORS[index]?.bg || 'bg-gray-500'
                  )}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-4xl text-white/80">{OPTION_SHAPES[index]}</span>
                  <span className="text-2xl font-bold text-white">{option}</span>
                </motion.div>
              ))}
            </div>

            {/* Answer bar chart */}
            <div className="bg-slate-800/40 rounded-2xl p-6">
              <h3 className="text-center text-slate-400 mb-4">Answers Received</h3>
              <AnswerBarChart
                options={currentQuestion?.options || []}
                counts={answerCounts}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ PLAYER VIEW ============

interface PlayerViewProps {
  gameState: ReturnType<typeof useGameSocket>;
}

function PlayerView({ gameState }: PlayerViewProps) {
  const {
    currentQuestion,
    timeRemaining,
    status,
    lastResult,
    submitAnswer,
  } = gameState;

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Reset selection on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setShowFeedback(false);
  }, [currentQuestion?.index]);

  // Show feedback when result comes in
  useEffect(() => {
    if (lastResult) {
      setShowFeedback(true);
      const timer = setTimeout(() => setShowFeedback(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [lastResult]);

  // Handle answer selection
  const handleAnswer = (option: string) => {
    if (selectedAnswer) return; // Already answered
    setSelectedAnswer(option);
    submitAnswer(option);
  };

  // Waiting room
  if (status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Clock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">You're In!</h2>
          <p className="text-slate-400">Waiting for the host to start...</p>
        </motion.div>
      </div>
    );
  }

  // Game finished
  if (status === 'finished') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Game Over!</h2>
          <p className="text-slate-400 mb-8">Check the host screen for final results</p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/arcade'}
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Lobby
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

  // Already answered, waiting for results
  if (selectedAnswer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-24 h-24 rounded-full bg-purple-500/30 flex items-center justify-center mx-auto mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Check className="w-12 h-12 text-purple-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-white mb-2">Answer Locked!</h2>
          <p className="text-slate-400">Waiting for time to run out...</p>
          <div className="mt-6">
            <TimerDisplay
              seconds={timeRemaining}
              total={currentQuestion?.timeLimit || 20}
              size="sm"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Active game - show answer buttons (no question text for players!)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-4 flex flex-col">
      {/* Timer at top */}
      <div className="flex justify-center mb-4">
        <TimerDisplay
          seconds={timeRemaining}
          total={currentQuestion?.timeLimit || 20}
          size="sm"
        />
      </div>

      {/* Answer buttons - large colored blocks */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {currentQuestion?.options.map((option, index) => (
          <motion.button
            key={index}
            className={clsx(
              'rounded-2xl flex items-center justify-center',
              'transition-all duration-200 active:scale-95',
              OPTION_COLORS[index]?.bg || 'bg-gray-500',
              OPTION_COLORS[index]?.hover || 'hover:bg-gray-400'
            )}
            onClick={() => handleAnswer(option)}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-6xl text-white/90">{OPTION_SHAPES[index]}</span>
          </motion.button>
        ))}
      </div>

      {/* Hint text */}
      <p className="text-center text-slate-500 text-sm mt-4">
        Look at the host screen for the question!
      </p>
    </div>
  );
}

// ============ MAIN QUIZ GAME COMPONENT ============

export default function QuizGame() {
  const { pinCode } = useParams<{ pinCode: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // isHost is determined by server based on hostId match
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center bg-red-500/20 border border-red-500/50 rounded-2xl p-8 max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-red-200 mb-6">{gameState.error}</p>
          <Button variant="secondary" onClick={() => navigate('/arcade')}>
            Back to Lobby
          </Button>
        </motion.div>
      </div>
    );
  }

  // Connecting state
  if (!gameState.isConnected || gameState.status === 'connecting' || gameState.status === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-8">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-slate-400">Connecting to game...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatedPage>
      {/* Countdown overlay */}
      <AnimatePresence>
        {showCountdown && (
          <CountdownOverlay count={3} onComplete={() => setShowCountdown(false)} />
        )}
      </AnimatePresence>

      {/* Render appropriate view */}
      {gameState.isHost ? (
        <HostView gameState={gameState} />
      ) : (
        <PlayerView gameState={gameState} />
      )}
    </AnimatedPage>
  );
}
