/**
 * GameSummary Component (The Podium)
 * Displays final game results with animated podium, stats, and XP rewards
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Crown,
  Zap,
  Target,
  Timer,
  Flame,
  Play,
  Home,
  Sparkles,
  Medal,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import AnimatedPage from '@/components/AnimatedPage';

// =============================================================================
// Types
// =============================================================================

interface PlayerResult {
  id: string;
  username: string;
  avatar?: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  fastestAnswer: number; // in seconds
  streak: number;
}

interface GameSummaryProps {
  players: PlayerResult[];
  isHost: boolean;
  onPlayAgain?: () => void;
  xpEarned?: number;
  baseXp?: number;
}

// =============================================================================
// Constants
// =============================================================================

const PODIUM_COLORS = {
  gold: {
    bg: 'from-yellow-400 via-amber-400 to-yellow-500',
    border: 'border-yellow-300',
    glow: 'shadow-yellow-400/50',
    text: 'text-yellow-400',
    icon: Crown,
  },
  silver: {
    bg: 'from-slate-300 via-gray-300 to-slate-400',
    border: 'border-slate-200',
    glow: 'shadow-slate-300/50',
    text: 'text-slate-300',
    icon: Medal,
  },
  bronze: {
    bg: 'from-orange-400 via-amber-600 to-orange-500',
    border: 'border-orange-300',
    glow: 'shadow-orange-400/50',
    text: 'text-orange-400',
    icon: Medal,
  },
};

// =============================================================================
// Confetti Effect
// =============================================================================

function fireConfetti() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Fire from both sides
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
    });
  }, 250);

  // Initial burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB'],
    zIndex: 1000,
  });
}

// =============================================================================
// Avatar Component
// =============================================================================

interface AvatarProps {
  username: string;
  avatar?: string;
  size: 'sm' | 'md' | 'lg';
  place: 1 | 2 | 3;
}

function Avatar({ username, avatar, size, place }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-12 h-12 text-lg',
    md: 'w-16 h-16 text-xl',
    lg: 'w-20 h-20 text-2xl',
  };

  const colors = place === 1 ? PODIUM_COLORS.gold : place === 2 ? PODIUM_COLORS.silver : PODIUM_COLORS.bronze;
  const IconComponent = colors.icon;

  return (
    <div className="relative">
      {/* Crown/Medal badge */}
      <motion.div
        initial={{ scale: 0, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 1.5, type: 'spring', stiffness: 300 }}
        className={clsx(
          'absolute -top-3 left-1/2 -translate-x-1/2 z-10',
          colors.text
        )}
      >
        <IconComponent className={clsx(place === 1 ? 'w-8 h-8' : 'w-6 h-6')} />
      </motion.div>

      {/* Avatar */}
      <div
        className={clsx(
          'rounded-full flex items-center justify-center font-bold',
          'bg-gradient-to-br border-2',
          colors.bg,
          colors.border,
          'shadow-lg',
          colors.glow,
          sizeClasses[size]
        )}
      >
        {avatar ? (
          <img src={avatar} alt={username} className="w-full h-full rounded-full object-cover" />
        ) : (
          <span className="text-slate-900">{username.charAt(0).toUpperCase()}</span>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Podium Pillar Component
// =============================================================================

interface PodiumPillarProps {
  player: PlayerResult;
  place: 1 | 2 | 3;
  delay: number;
}

function PodiumPillar({ player, place, delay }: PodiumPillarProps) {
  const heights = {
    1: 'h-40',
    2: 'h-28',
    3: 'h-20',
  };

  const colors = place === 1 ? PODIUM_COLORS.gold : place === 2 ? PODIUM_COLORS.silver : PODIUM_COLORS.bronze;
  const accuracy = Math.round((player.correctAnswers / player.totalQuestions) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="flex flex-col items-center"
    >
      {/* Player info above pillar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.3, duration: 0.3 }}
        className="mb-4 text-center"
      >
        <Avatar
          username={player.username}
          avatar={player.avatar}
          size={place === 1 ? 'lg' : place === 2 ? 'md' : 'sm'}
          place={place}
        />
        <p className="mt-2 font-semibold text-white truncate max-w-[100px]">
          {player.username}
        </p>
        <p className={clsx('text-sm font-bold', colors.text)}>
          {player.score.toLocaleString()} pts
        </p>
        <p className="text-xs text-slate-400">{accuracy}% accurate</p>
      </motion.div>

      {/* Pillar */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        transition={{ delay: delay + 0.5, duration: 0.5, ease: 'easeOut' }}
        className={clsx(
          'w-24 rounded-t-lg flex items-end justify-center pb-4',
          'bg-gradient-to-t',
          colors.bg,
          heights[place]
        )}
      >
        <span className="text-3xl font-bold text-slate-900/80">{place}</span>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// Stats Card Component
// =============================================================================

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  delay: number;
}

function StatsCard({ icon: Icon, label, value, color, delay }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={clsx(
        'bg-slate-800/50 backdrop-blur-sm rounded-xl p-4',
        'border border-slate-700/50',
        'flex items-center gap-3'
      )}
    >
      <div className={clsx('p-2 rounded-lg', color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </motion.div>
  );
}

// =============================================================================
// XP Bar Component
// =============================================================================

interface XPBarProps {
  baseXp: number;
  totalXp: number;
  isPro: boolean;
}

function XPBar({ baseXp, totalXp, isPro }: XPBarProps) {
  const [displayXp, setDisplayXp] = useState(0);
  const [showBonus, setShowBonus] = useState(false);

  useEffect(() => {
    // Animate XP counting up
    const duration = 2000;
    const steps = 60;
    const increment = totalXp / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), totalXp);
      setDisplayXp(current);

      if (step >= steps) {
        clearInterval(timer);
        if (isPro) {
          setTimeout(() => setShowBonus(true), 300);
        }
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [totalXp, isPro]);

  // Calculate progress (assume max 1000 XP for visual)
  const progressPercent = Math.min((displayXp / 1000) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 0.5 }}
      className={clsx(
        'bg-slate-800/50 backdrop-blur-sm rounded-xl p-6',
        'border border-slate-700/50'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">XP Earned</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.span
            key={displayXp}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold text-purple-400"
          >
            +{displayXp}
          </motion.span>

          {/* 2x Pro Bonus Badge */}
          <AnimatePresence>
            {showBonus && isPro && (
              <motion.div
                initial={{ scale: 0, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                className={clsx(
                  'px-2 py-1 rounded-full',
                  'bg-gradient-to-r from-amber-400 to-orange-500',
                  'text-xs font-bold text-slate-900',
                  'flex items-center gap-1'
                )}
              >
                <Sparkles className="w-3 h-3" />
                2x BONUS
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ delay: 2.2, duration: 1.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 rounded-full"
        />
      </div>

      {/* Breakdown */}
      <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
        <span>Base: {baseXp} XP</span>
        {isPro && <span className="text-amber-400">Pro Bonus: +{baseXp} XP</span>}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Main GameSummary Component
// =============================================================================

export default function GameSummary({
  players,
  isHost,
  onPlayAgain,
  xpEarned = 150,
  baseXp = 75,
}: GameSummaryProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [confettiFired, setConfettiFired] = useState(false);

  // Determine if user is Pro
  const isPro = useMemo(() => {
    if (!user?.role) return false;
    return ['STANDARD', 'PREMIUM', 'ADMIN'].includes(user.role);
  }, [user?.role]);

  // Sort players by score
  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => b.score - a.score);
  }, [players]);

  // Get top 3 players
  const podiumPlayers = useMemo(() => {
    const top3 = sortedPlayers.slice(0, 3);
    // Reorder for podium display: [2nd, 1st, 3rd]
    if (top3.length >= 3) {
      return [top3[1], top3[0], top3[2]];
    } else if (top3.length === 2) {
      return [top3[1], top3[0]];
    }
    return top3;
  }, [sortedPlayers]);

  // Current user's stats
  const currentUserStats = useMemo(() => {
    const currentPlayer = players.find(p => p.username === user?.username);
    if (!currentPlayer) {
      // Return default stats if user not found
      return {
        accuracy: 85,
        fastestAnswer: 1.2,
        streak: 5,
      };
    }
    return {
      accuracy: Math.round((currentPlayer.correctAnswers / currentPlayer.totalQuestions) * 100),
      fastestAnswer: currentPlayer.fastestAnswer,
      streak: currentPlayer.streak,
    };
  }, [players, user?.username]);

  // Fire confetti on mount
  useEffect(() => {
    if (!confettiFired && podiumPlayers.length > 0) {
      const timer = setTimeout(() => {
        fireConfetti();
        setConfettiFired(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [confettiFired, podiumPlayers.length]);

  const handlePlayAgain = useCallback(() => {
    if (onPlayAgain) {
      onPlayAgain();
    }
  }, [onPlayAgain]);

  const handleBackToLobby = useCallback(() => {
    navigate('/arcade');
  }, [navigate]);

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 mb-4">
              <Trophy className="w-8 h-8 text-slate-900" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Game Complete!</h1>
            <p className="text-slate-400">Here's how everyone performed</p>
          </motion.div>

          {/* Podium */}
          <div className="flex items-end justify-center gap-4 mb-8">
            {podiumPlayers.map((player, index) => {
              // Determine actual place (1st is in center)
              let place: 1 | 2 | 3;
              if (podiumPlayers.length === 1) {
                place = 1;
              } else if (podiumPlayers.length === 2) {
                place = index === 1 ? 1 : 2;
              } else {
                place = index === 0 ? 2 : index === 1 ? 1 : 3;
              }

              return (
                <PodiumPillar
                  key={player.id}
                  player={player}
                  place={place}
                  delay={0.2 + index * 0.2}
                />
              );
            })}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatsCard
              icon={Target}
              label="Accuracy"
              value={`${currentUserStats.accuracy}%`}
              color="bg-green-500"
              delay={1.5}
            />
            <StatsCard
              icon={Timer}
              label="Fastest Answer"
              value={`${currentUserStats.fastestAnswer}s`}
              color="bg-blue-500"
              delay={1.6}
            />
            <StatsCard
              icon={Flame}
              label="Best Streak"
              value={`${currentUserStats.streak}`}
              color="bg-orange-500"
              delay={1.7}
            />
          </div>

          {/* XP Bar */}
          <XPBar baseXp={baseXp} totalXp={xpEarned} isPro={isPro} />

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.5, duration: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            {isHost && onPlayAgain && (
              <Button
                onClick={handlePlayAgain}
                className={clsx(
                  'flex-1 py-4 text-lg font-semibold',
                  'bg-gradient-to-r from-purple-500 to-indigo-500',
                  'hover:from-purple-600 hover:to-indigo-600',
                  'border-0'
                )}
              >
                <Play className="w-5 h-5 mr-2" />
                Play Again
              </Button>
            )}
            <Button
              onClick={handleBackToLobby}
              variant="outline"
              className={clsx(
                'flex-1 py-4 text-lg font-semibold',
                'border-slate-600 text-slate-300',
                'hover:bg-slate-800 hover:border-slate-500'
              )}
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Lobby
            </Button>
          </motion.div>

          {/* Full Leaderboard (if more than 3 players) */}
          {sortedPlayers.length > 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.8, duration: 0.5 }}
              className="mt-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Full Rankings</h3>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                {sortedPlayers.slice(3).map((player, index) => (
                  <div
                    key={player.id}
                    className={clsx(
                      'flex items-center justify-between px-4 py-3',
                      index !== sortedPlayers.length - 4 && 'border-b border-slate-700/50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-slate-500 font-medium">
                        {index + 4}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-white">{player.username}</span>
                    </div>
                    <span className="text-slate-400 font-medium">
                      {player.score.toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}

// =============================================================================
// Demo/Preview Component (for testing)
// =============================================================================

export function GameSummaryDemo() {
  const mockPlayers: PlayerResult[] = [
    {
      id: '1',
      username: 'Champion',
      score: 2450,
      correctAnswers: 9,
      totalQuestions: 10,
      fastestAnswer: 1.2,
      streak: 7,
    },
    {
      id: '2',
      username: 'Runner',
      score: 2100,
      correctAnswers: 8,
      totalQuestions: 10,
      fastestAnswer: 1.8,
      streak: 5,
    },
    {
      id: '3',
      username: 'Bronze',
      score: 1850,
      correctAnswers: 7,
      totalQuestions: 10,
      fastestAnswer: 2.1,
      streak: 4,
    },
    {
      id: '4',
      username: 'Player4',
      score: 1500,
      correctAnswers: 6,
      totalQuestions: 10,
      fastestAnswer: 2.5,
      streak: 3,
    },
    {
      id: '5',
      username: 'Player5',
      score: 1200,
      correctAnswers: 5,
      totalQuestions: 10,
      fastestAnswer: 3.0,
      streak: 2,
    },
  ];

  return (
    <GameSummary
      players={mockPlayers}
      isHost={true}
      onPlayAgain={() => console.log('Play again clicked')}
      xpEarned={150}
      baseXp={75}
    />
  );
}
