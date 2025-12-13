/**
 * GamesDashboard Page
 * Split-view dashboard for solo practice and multiplayer game modes
 * Matches Thynkr minimalist design system
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Users,
  Zap,
  Brain,
  Target,
  Timer,
  Trophy,
  Sparkles,
  Play,
  Crown,
  Lock,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { useGameAccess } from '@/hooks/useGameAccess';
import { UploadedFile } from '@/types/global';
import Button from '@/components/ui/Button';
import AnimatedPage from '@/components/AnimatedPage';
import UpgradeModal from '@/components/UpgradeModal';
import GameSetupModal, { GameConfig } from '@/components/GameSetupModal';

// Local API URL definition
const API_URL = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// Types
// =============================================================================

interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  gradient: string;
  route: string;
  tier: 'FREE' | 'PRO';
  comingSoon?: boolean;
}

type TabValue = 'solo' | 'multiplayer';

// =============================================================================
// Game Mode Data
// =============================================================================

const SOLO_GAMES: GameMode[] = [
  {
    id: 'matching_rush',
    title: 'Matching Rush',
    description: 'Race against time to match terms with definitions',
    icon: Zap,
    color: 'text-amber-500',
    gradient: 'from-amber-400 to-orange-500',
    route: '/arcade/solo/matching_rush',
    tier: 'FREE',
  },
  {
    id: 'speed_quiz',
    title: 'Speed Quiz',
    description: 'Answer rapid-fire questions to test your knowledge',
    icon: Timer,
    color: 'text-blue-500',
    gradient: 'from-blue-400 to-indigo-500',
    route: '/arcade/solo/live_quiz',
    tier: 'FREE',
  },
  {
    id: 'brain_burst',
    title: 'Brain Burst',
    description: 'Challenging puzzles that push your thinking',
    icon: Brain,
    color: 'text-purple-500',
    gradient: 'from-purple-400 to-fuchsia-500',
    route: '/arcade/solo/brain_burst',
    tier: 'PRO',
    comingSoon: true,
  },
  {
    id: 'precision_mode',
    title: 'Precision Mode',
    description: 'Perfect accuracy required - no room for error',
    icon: Target,
    color: 'text-rose-500',
    gradient: 'from-rose-400 to-red-500',
    route: '/arcade/solo/precision',
    tier: 'PRO',
    comingSoon: true,
  },
];

const MULTIPLAYER_GAMES: GameMode[] = [
  {
    id: 'live_quiz',
    title: 'Live Quiz',
    description: 'Kahoot-style multiplayer quiz battles',
    icon: Trophy,
    color: 'text-yellow-500',
    gradient: 'from-yellow-400 to-amber-500',
    route: '/arcade/host/live_quiz',
    tier: 'FREE',
  },
  {
    id: 'team_challenge',
    title: 'Team Challenge',
    description: 'Collaborate with teammates to solve problems',
    icon: Users,
    color: 'text-emerald-500',
    gradient: 'from-emerald-400 to-teal-500',
    route: '/arcade/host/team_challenge',
    tier: 'PRO',
    comingSoon: true,
  },
  {
    id: 'battle_royale',
    title: 'Battle Royale',
    description: 'Last student standing wins the crown',
    icon: Crown,
    color: 'text-violet-500',
    gradient: 'from-violet-400 to-purple-500',
    route: '/arcade/host/battle_royale',
    tier: 'PRO',
    comingSoon: true,
  },
];

// =============================================================================
// Tab Switcher Component
// =============================================================================

interface TabSwitcherProps {
  activeTab: TabValue;
  onTabChange: (tab: TabValue) => void;
}

function TabSwitcher({ activeTab, onTabChange }: TabSwitcherProps) {
  const tabs: { value: TabValue; label: string; icon: React.ElementType }[] = [
    { value: 'solo', label: 'Solo Practice', icon: Gamepad2 },
    { value: 'multiplayer', label: 'Multiplayer', icon: Users },
  ];

  return (
    <div
      className="inline-flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl"
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        const Icon = tab.icon;

        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.value)}
            className={clsx(
              'relative flex items-center gap-2 px-4 py-2.5 rounded-lg',
              'text-sm font-medium transition-colors duration-200',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="tab-background"
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Icon
              className={clsx(
                'relative z-10 w-4 h-4 transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            />
            <span
              className={clsx(
                'relative z-10 transition-colors',
                isActive
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// Game Card Component
// =============================================================================

interface GameCardProps {
  game: GameMode;
  isPro: boolean;
  isMultiplayer?: boolean;
  onAccessDenied: (reason: 'no_credits' | 'hosting_restricted') => void;
  onPlay: () => void;
}

function GameCard({ game, isPro, isMultiplayer, onAccessDenied, onPlay }: GameCardProps) {
  const Icon = game.icon;
  const isLocked = game.tier === 'PRO' && !isPro;

  const handleClick = () => {
    if (game.comingSoon) return;
    
    // For locked PRO games, show upgrade modal
    if (isLocked) {
      onAccessDenied(isMultiplayer ? 'hosting_restricted' : 'no_credits');
      return;
    }

    // Call the access check callback first
    onPlay();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={game.comingSoon}
      whileHover={!game.comingSoon ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!game.comingSoon ? { scale: 0.98 } : undefined}
      className={clsx(
        'relative w-full p-6 rounded-2xl text-left',
        'bg-white dark:bg-slate-800',
        'border border-slate-200 dark:border-slate-700',
        'transition-shadow duration-200',
        game.comingSoon
          ? 'opacity-60 cursor-not-allowed'
          : 'hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
      )}
    >
      {/* Pro Badge */}
      {game.tier === 'PRO' && (
        <div className="absolute top-4 right-4">
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
              isPro
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            )}
          >
            {isLocked ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            PRO
          </span>
        </div>
      )}

      {/* Coming Soon Badge */}
      {game.comingSoon && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
            Coming Soon
          </span>
        </div>
      )}

      {/* Icon */}
      <div
        className={clsx(
          'inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4',
          'bg-gradient-to-br',
          game.gradient
        )}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
        {game.title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{game.description}</p>

      {/* Play indicator */}
      {!game.comingSoon && !isLocked && (
        <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400">
          <Play className="w-4 h-4" />
          <span>Play Now</span>
        </div>
      )}
    </motion.button>
  );
}

// =============================================================================
// Join Session Card Component
// =============================================================================

interface JoinSessionCardProps {
  onJoin: (pin: string) => void;
}

function JoinSessionCard({ onJoin }: JoinSessionCardProps) {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;

    setIsLoading(true);
    try {
      onJoin(pin);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600',
        'rounded-2xl p-8 text-center text-white',
        'shadow-xl shadow-indigo-500/20'
      )}
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
        <Users className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold mb-2">Join a Game</h2>
      <p className="text-white/80 mb-6">Enter the 6-digit PIN from your host</p>

      <form onSubmit={handleSubmit} className="max-w-xs mx-auto">
        <input
          type="text"
          inputMode="numeric"
          placeholder="000000"
          value={pin}
          onChange={handlePinChange}
          className={clsx(
            'w-full px-6 py-4 rounded-xl',
            'text-3xl font-mono font-bold text-center tracking-[0.5em]',
            'bg-white/20 backdrop-blur-sm',
            'border-2 border-white/30',
            'placeholder:text-white/40',
            'focus:outline-none focus:border-white/60',
            'transition-colors'
          )}
        />

        <Button
          type="submit"
          disabled={pin.length !== 6 || isLoading}
          className={clsx(
            'w-full mt-4 py-3',
            'bg-white text-indigo-600 font-semibold',
            'hover:bg-white/90',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isLoading ? 'Joining...' : 'Join Game'}
        </Button>
      </form>
    </motion.div>
  );
}

// =============================================================================
// Main GamesDashboard Component
// =============================================================================

export default function GamesDashboard() {
  const navigate = useNavigate();
  useAuth(); // Ensure auth context is available
  const [activeTab, setActiveTab] = useState<TabValue>('solo');

  // Setup modal state
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{ title: string; route: string } | null>(null);

  // Game access control
  const {
    tier,
    creditsRemaining,
    creditsTotal,
    checkSoloAccess,
    checkHostAccess,
    consumeCredit,
    showUpgradeModal,
    upgradeReason,
    openUpgradeModal,
    closeUpgradeModal,
  } = useGameAccess();

  // Determine if user is Pro
  const isPro = tier === 'PRO';

  // Fetch user files for game setup
  const getToken = () => localStorage.getItem('accessToken');
  const { data: filesData } = useQuery({
    queryKey: ['study-files'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/study/files`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch files');
      return response.json();
    },
    enabled: !!getToken(),
  });

  const userFiles: UploadedFile[] = filesData?.files || [];

  const handleJoinGame = useCallback(
    (pin: string) => {
      navigate(`/arcade/play/${pin}`);
    },
    [navigate]
  );

  // Handle setup modal close
  const handleSetupModalClose = useCallback(() => {
    setShowSetupModal(false);
    setSelectedGame(null);
  }, []);

  // Handle game start after setup
  const handleGameStart = useCallback(
    (config: GameConfig) => {
      if (!selectedGame) return;
      
      // Consume credit for solo games
      if (activeTab === 'solo') {
        consumeCredit();
      }
      
      // TODO: Pass game config to the route (via state or query params)
      // For now, we'll navigate with the config in the location state
      navigate(selectedGame.route, { 
        state: { 
          gameConfig: config 
        } 
      });
      
      // Close the setup modal
      handleSetupModalClose();
    },
    [selectedGame, activeTab, consumeCredit, navigate, handleSetupModalClose]
  );

  // Handle solo game play with access check
  const handleSoloPlay = useCallback(
    (route: string, title: string) => {
      const result = checkSoloAccess();
      if (!result.allowed) {
        openUpgradeModal(result.reason);
        return;
      }
      // Open setup modal instead of directly navigating
      setSelectedGame({ title, route });
      setShowSetupModal(true);
    },
    [checkSoloAccess, openUpgradeModal]
  );

  // Handle multiplayer host with access check
  const handleHostPlay = useCallback(
    (route: string, title: string) => {
      const result = checkHostAccess();
      if (!result.allowed) {
        openUpgradeModal(result.reason);
        return;
      }
      // Open setup modal instead of directly navigating
      setSelectedGame({ title, route });
      setShowSetupModal(true);
    },
    [checkHostAccess, openUpgradeModal]
  );

  return (
    <AnimatedPage>
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={closeUpgradeModal}
        reason={upgradeReason}
      />

      {/* Game Setup Modal */}
      <GameSetupModal
        isOpen={showSetupModal}
        onClose={handleSetupModalClose}
        gameTitle={selectedGame?.title || ''}
        onStartGame={handleGameStart}
        userFiles={userFiles}
      />

      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Study Games
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  Active learning to boost retention.
                </p>
              </div>

              {/* Credits Badge (Free users only) */}
              {tier === 'FREE' && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {creditsRemaining}/{creditsTotal} plays left today
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="mb-8">
            <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'solo' ? (
              <motion.div
                key="solo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Solo Practice Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    Practice Solo
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Sharpen your skills at your own pace
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SOLO_GAMES.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isPro={isPro}
                      onAccessDenied={openUpgradeModal}
                      onPlay={() => handleSoloPlay(game.route, game.title)}
                    />
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="multiplayer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Join Session Hero */}
                <div className="mb-10">
                  <JoinSessionCard onJoin={handleJoinGame} />
                </div>

                {/* Host a Game Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    Host a Game
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Start a session and invite others to join
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MULTIPLAYER_GAMES.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      isPro={isPro}
                      isMultiplayer
                      onAccessDenied={openUpgradeModal}
                      onPlay={() => handleHostPlay(game.route, game.title)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedPage>
  );
}
