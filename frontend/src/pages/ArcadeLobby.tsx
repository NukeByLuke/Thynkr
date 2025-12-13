/**
 * Arcade Lobby Page
 * Main hub for Thynkr Arcade - multiplayer gamification system
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Zap,
  PenTool,
  Play,
  Users,
  Lock,
  Crown,
  Gamepad2,
  Sparkles,
  ArrowRight,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import AnimatedPage from '@/components/AnimatedPage';

// ============ TYPES ============

type GameType = 'LIVE_QUIZ' | 'MATCHING_RUSH' | 'BLANK_MASTER';
type GameTier = 'FREE' | 'PRO';

interface Game {
  id: string;
  title: string;
  description: string;
  type: GameType;
  tier: GameTier;
  icon: React.ReactNode;
  gradient: string;
  comingSoon?: boolean;
}

// ============ GAME DATA ============

const GAMES: Game[] = [
  {
    id: 'live-quiz',
    title: 'Live Quiz',
    description:
      'Compete in real-time against friends or classmates. Answer questions fast to climb the leaderboard!',
    type: 'LIVE_QUIZ',
    tier: 'FREE',
    icon: <Trophy className="w-12 h-12" />,
    gradient: 'from-amber-400 via-orange-500 to-red-500',
  },
  {
    id: 'matching-rush',
    title: 'Matching Rush',
    description:
      'Race against the clock to match terms with definitions. Speed and accuracy are key!',
    type: 'MATCHING_RUSH',
    tier: 'FREE',
    icon: <Zap className="w-12 h-12" />,
    gradient: 'from-cyan-400 via-blue-500 to-indigo-600',
  },
  {
    id: 'blank-master',
    title: 'Blank Master',
    description:
      'Fill in the blanks to complete sentences. Test your memory and understanding of key concepts.',
    type: 'BLANK_MASTER',
    tier: 'PRO',
    icon: <PenTool className="w-12 h-12" />,
    gradient: 'from-purple-400 via-pink-500 to-rose-500',
  },
];

// ============ GAME CARD COMPONENT ============

interface GameCardProps {
  game: Game;
  userTier: 'FREE' | 'PRO';
  onPlaySolo: (game: Game) => void;
  onHostMultiplayer: (game: Game) => void;
  onUpgrade: (game: Game) => void;
}

function GameCard({ game, userTier, onPlaySolo, onHostMultiplayer, onUpgrade }: GameCardProps) {
  const isLocked = game.tier === 'PRO' && userTier === 'FREE';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className={clsx(
        'relative group rounded-2xl overflow-hidden',
        'bg-slate-800/60 backdrop-blur-xl',
        'border border-slate-700/50',
        'transition-all duration-300',
        isLocked ? 'opacity-80' : 'hover:border-purple-500/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient Background */}
      <div
        className={clsx(
          'absolute inset-0 opacity-20 transition-opacity duration-300',
          isHovered && !isLocked ? 'opacity-30' : ''
        )}
      >
        <div className={clsx('absolute inset-0 bg-gradient-to-br', game.gradient)} />
      </div>

      {/* Pro Badge */}
      {game.tier === 'PRO' && (
        <div className="absolute top-4 right-4 z-10">
          <motion.div
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
              'bg-gradient-to-r from-amber-400 to-yellow-500',
              'text-slate-900 text-xs font-bold uppercase tracking-wide',
              'shadow-lg shadow-amber-500/30'
            )}
            animate={{
              boxShadow: [
                '0 4px 15px rgba(245, 158, 11, 0.3)',
                '0 4px 25px rgba(245, 158, 11, 0.5)',
                '0 4px 15px rgba(245, 158, 11, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>PRO</span>
          </motion.div>
        </div>
      )}

      {/* Lock Overlay for Free Users */}
      {isLocked && (
        <motion.div
          className={clsx(
            'absolute inset-0 z-20',
            'bg-slate-900/60 backdrop-blur-sm',
            'flex items-center justify-center',
            'cursor-pointer'
          )}
          onClick={() => onUpgrade(game)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center p-6">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/80 border border-amber-500/50 mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lock className="w-8 h-8 text-amber-400" />
            </motion.div>
            <p className="text-white font-semibold mb-2">Upgrade to Unlock</p>
            <p className="text-slate-400 text-sm">This game requires a Pro subscription</p>
          </div>
        </motion.div>
      )}

      {/* Card Content */}
      <div className="relative z-10 p-6">
        {/* Icon */}
        <div
          className={clsx(
            'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4',
            'bg-gradient-to-br',
            game.gradient,
            'text-white shadow-lg'
          )}
        >
          {game.icon}
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-white mb-2">{game.title}</h3>
        <p className="text-slate-400 text-sm mb-6 line-clamp-2">{game.description}</p>

        {/* Coming Soon Badge */}
        {game.comingSoon && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Coming Soon
          </div>
        )}

        {/* Action Buttons */}
        {!isLocked && !game.comingSoon && (
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={() => onPlaySolo(game)}
            >
              <Play className="w-4 h-4 mr-1.5" />
              Play Solo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 !border-slate-600 !text-slate-300 hover:!bg-slate-700/50"
              onClick={() => onHostMultiplayer(game)}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Host Game
            </Button>
          </div>
        )}
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className={clsx(
          'absolute inset-0 rounded-2xl pointer-events-none',
          'bg-gradient-to-br opacity-0 transition-opacity duration-300',
          game.gradient
        )}
        style={{ opacity: isHovered && !isLocked ? 0.1 : 0 }}
      />
    </motion.div>
  );
}

// ============ UPGRADE MODAL COMPONENT ============

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
}

function UpgradeModal({ isOpen, onClose, game }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="text-center p-6">
        {/* Icon */}
        <motion.div
          className={clsx(
            'inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6',
            'bg-gradient-to-br from-amber-400 to-yellow-500',
            'text-slate-900 shadow-lg shadow-amber-500/30'
          )}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Crown className="w-10 h-10" />
        </motion.div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upgrade to Pro
        </h2>

        {/* Description */}
        <p className="text-gray-600 dark:text-slate-400 mb-6">
          {game ? (
            <>
              <span className="font-semibold text-purple-500">{game.title}</span> is a Pro-only
              game. Upgrade your subscription to unlock all premium games and features.
            </>
          ) : (
            'Upgrade your subscription to unlock all premium games and features.'
          )}
        </p>

        {/* Features */}
        <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-4 mb-6 text-left">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Pro includes:
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              All premium arcade games
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              Unlimited multiplayer sessions
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              Custom game creation
            </li>
            <li className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 text-xs">✓</span>
              </div>
              Priority support
            </li>
          </ul>
        </div>

        {/* Actions */}
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
            View Plans
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============ MAIN LOBBY COMPONENT ============

export default function ArcadeLobby() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Determine user tier based on role
  const userTier: 'FREE' | 'PRO' =
    user?.role === 'STANDARD' || user?.role === 'PREMIUM' || user?.role === 'ADMIN'
      ? 'PRO'
      : 'FREE';

  // Handle PIN code input - only allow digits, max 6
  const handlePinChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setPinCode(sanitized);
    setPinError('');
  };

  // Handle joining a game session
  const handleJoinGame = async () => {
    if (pinCode.length !== 6) {
      setPinError('Please enter a 6-digit PIN code');
      return;
    }

    setIsJoining(true);
    try {
      // Navigate to the game room with the PIN
      navigate(`/arcade/play/${pinCode}`);
    } catch (error) {
      setPinError('Failed to join game. Please check the PIN and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  // Handle Play Solo
  const handlePlaySolo = (game: Game) => {
    navigate(`/arcade/solo/${game.type.toLowerCase()}`);
  };

  // Handle Host Multiplayer
  const handleHostMultiplayer = (game: Game) => {
    navigate(`/arcade/host/${game.type.toLowerCase()}`);
  };

  // Handle Upgrade click for locked games
  const handleUpgrade = (game: Game) => {
    setSelectedGame(game);
    setUpgradeModalOpen(true);
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -left-1/4 w-full h-full bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-1/2 -right-1/4 w-full h-full bg-indigo-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Title Section */}
            <div className="text-center mb-12">
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/30 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Gamepad2 className="w-5 h-5 text-purple-400" />
                <span className="text-purple-300 font-medium">Thynkr Arcade</span>
              </motion.div>

              <motion.h1
                className="text-4xl sm:text-5xl font-bold text-white mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Learn Through{' '}
                <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                  Play
                </span>
              </motion.h1>

              <motion.p
                className="text-lg text-slate-400 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Challenge friends, compete in real-time, and master your subjects with interactive
                multiplayer games.
              </motion.p>
            </div>

            {/* Join Game Bar */}
            <motion.div
              className="max-w-lg mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="relative">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => handlePinChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                      placeholder="Enter 6-digit Game PIN"
                      className={clsx(
                        'w-full px-6 py-4 rounded-xl',
                        'bg-slate-800/60 backdrop-blur-xl',
                        'border-2 transition-all duration-200',
                        pinError
                          ? 'border-red-500/50 focus:border-red-500'
                          : 'border-slate-700/50 focus:border-purple-500',
                        'text-white text-lg text-center tracking-widest font-mono',
                        'placeholder:text-slate-500 placeholder:tracking-normal placeholder:font-sans',
                        'focus:outline-none focus:ring-2 focus:ring-purple-500/30'
                      )}
                      maxLength={6}
                    />
                    {pinCode.length > 0 && (
                      <button
                        onClick={() => setPinCode('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleJoinGame}
                    disabled={pinCode.length !== 6 || isJoining}
                    isLoading={isJoining}
                    className="px-8"
                  >
                    Join
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
                {pinError && (
                  <motion.p
                    className="text-red-400 text-sm mt-2 text-center"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {pinError}
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Games Grid */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {GAMES.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <GameCard
                    game={game}
                    userTier={userTier}
                    onPlaySolo={handlePlaySolo}
                    onHostMultiplayer={handleHostMultiplayer}
                    onUpgrade={handleUpgrade}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* User Tier Indicator */}
            <motion.div
              className="mt-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div
                className={clsx(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-full',
                  userTier === 'PRO'
                    ? 'bg-gradient-to-r from-amber-400/20 to-yellow-500/20 border border-amber-500/30'
                    : 'bg-slate-800/50 border border-slate-700/50'
                )}
              >
                {userTier === 'PRO' ? (
                  <>
                    <Crown className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-300 text-sm font-medium">Pro Member</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400 text-sm">Free Plan</span>
                    <span className="text-slate-600">•</span>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors"
                    >
                      Upgrade for more games
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
          game={selectedGame}
        />
      </div>
    </AnimatedPage>
  );
}
