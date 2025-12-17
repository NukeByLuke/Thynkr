import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Flame,
  BookOpen,
  Clock,
  Target,
  Zap,
  Award,
  Crown,
  Sparkles,
  TrendingUp,
  Calendar,
  MessageCircle,
  FileText,
  Lock,
  Gift,
  Filter,
  CheckCircle2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
type FilterOption = 'all' | 'unlocked' | 'in-progress' | 'locked' | AchievementTier;

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content';
  thresholds: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    DIAMOND: number;
  };
  xpRewards: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    DIAMOND: number;
  };
}

interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  currentTier: AchievementTier;
  currentValue: number;
  unlockedAt: string;
  updatedAt: string;
  definition: AchievementDefinition;
  progress: {
    current: number;
    required: number;
    percentage: number;
  } | null;
}

interface UserStats {
  xp: number;
  level: number;
  achievements: UserAchievement[];
}

// Tier visual configuration with dynamic glows
const tierConfig = {
  BRONZE: {
    border: 'border-orange-700/30',
    shadow: 'shadow-lg shadow-orange-900/10',
    glow: 'hover:shadow-xl hover:shadow-orange-900/20',
    gradient: 'from-orange-600 to-amber-700',
    bg: 'bg-orange-50/50 dark:bg-orange-950/20',
    text: 'text-orange-700 dark:text-orange-400',
    icon: 'bg-gradient-to-br from-orange-600 to-amber-700',
    badgeText: 'text-orange-100',
  },
  SILVER: {
    border: 'border-slate-400/30',
    shadow: 'shadow-lg shadow-slate-400/10',
    glow: 'hover:shadow-xl hover:shadow-slate-400/20',
    gradient: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50/50 dark:bg-slate-950/20',
    text: 'text-slate-700 dark:text-slate-300',
    icon: 'bg-gradient-to-br from-slate-400 to-slate-600',
    badgeText: 'text-slate-100',
  },
  GOLD: {
    border: 'border-yellow-500/30',
    shadow: 'shadow-lg shadow-yellow-500/10',
    glow: 'hover:shadow-xl hover:shadow-yellow-500/20',
    gradient: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-50/50 dark:bg-yellow-950/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    badgeText: 'text-yellow-100',
  },
  PLATINUM: {
    border: 'border-cyan-400/30',
    shadow: 'shadow-lg shadow-cyan-400/10',
    glow: 'hover:shadow-xl hover:shadow-cyan-400/20',
    gradient: 'from-cyan-400 to-blue-500',
    bg: 'bg-cyan-50/50 dark:bg-cyan-950/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    icon: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    badgeText: 'text-cyan-100',
  },
  DIAMOND: {
    border: 'border-indigo-400/50',
    shadow: 'shadow-xl shadow-indigo-500/20',
    glow: 'hover:shadow-2xl hover:shadow-indigo-500/30 animate-pulse-glow',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    bg: 'bg-gradient-to-br from-indigo-50/50 via-purple-50/50 to-pink-50/50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    icon: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500',
    badgeText: 'text-indigo-100',
  },
};

// Icon mapping
const iconMap: Record<string, any> = {
  '📚': BookOpen,
  '🔥': Flame,
  '🎯': Target,
  '📂': FileText,
  '💬': MessageCircle,
  '⚡': Zap,
  '📝': FileText,
  '🎴': BookOpen,
  '🤖': MessageCircle,
  '🌅': Clock,
  '🦉': Clock,
  '💎': Sparkles,
  '🎓': Award,
  '🏃': TrendingUp,
  '📅': Calendar,
  '🏆': Trophy,
  '🔍': Target,
  '📋': FileText,
  '🤝': Star,
  '🌍': Crown,
};

// XP calculation for levels
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

export default function Achievements() {
  const [filter, setFilter] = useState<FilterOption>('all');

  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['achievements'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/progress`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const data = await response.json();
      // Transform data to match expected format
      return {
        xp: data.xp || 0,
        level: data.level || 1,
        achievements: data.achievements || [],
      };
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  const currentLevel = stats?.level || 1;
  const currentXP = stats?.xp || 0;
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - Array.from({ length: currentLevel - 1 }, (_, i) => getXPForLevel(i + 1)).reduce((a, b) => a + b, 0);
  const xpProgress = xpInCurrentLevel > 0 ? (xpInCurrentLevel / xpForNextLevel) * 100 : 0;

  const achievements = stats?.achievements || [];

  // Categorize achievements
  const unlocked = achievements.filter((a) => a.currentTier !== 'BRONZE' || a.currentValue >= a.definition.thresholds.BRONZE);
  const inProgress = achievements.filter((a) => a.currentValue > 0 && a.currentValue < a.definition.thresholds[getNextTier(a.currentTier) || a.currentTier]);
  const locked = achievements.filter((a) => a.currentValue === 0);

  // Apply filters
  let filteredAchievements = achievements;
  if (filter === 'unlocked') {
    filteredAchievements = unlocked;
  } else if (filter === 'in-progress') {
    filteredAchievements = inProgress;
  } else if (filter === 'locked') {
    filteredAchievements = locked;
  } else if (['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(filter)) {
    filteredAchievements = achievements.filter((a) => a.currentTier === filter);
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-heading mb-2">
            Achievements
          </h1>
          <p className="text-body">
            Track your progress and unlock rewards across 5 tiers
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 glass-panel rounded-lg">
          <Trophy className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span className="text-sm font-medium text-heading">
            {unlocked.length} / {achievements.length}
          </span>
        </div>
      </div>

      {/* Level Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">Level {currentLevel}</h2>
                  <p className="text-white/80">Keep up the amazing work!</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{currentXP.toLocaleString()}</div>
              <div className="text-white/80 text-sm">Total XP</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-white/90">
              <span>{xpInCurrentLevel.toLocaleString()} XP</span>
              <span>{xpForNextLevel.toLocaleString()} XP to Level {currentLevel + 1}</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-white rounded-full shadow-lg"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      {achievements.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'glass-panel text-body hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Filter className="w-4 h-4 inline mr-2" />
            All
          </button>
          <button
            onClick={() => setFilter('unlocked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'unlocked'
                ? 'bg-green-500 text-white shadow-lg'
                : 'glass-panel text-body hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 inline mr-2" />
            Unlocked ({unlocked.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'in-progress'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'glass-panel text-body hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            In Progress ({inProgress.length})
          </button>
          <button
            onClick={() => setFilter('locked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === 'locked'
                ? 'bg-slate-500 text-white shadow-lg'
                : 'glass-panel text-body hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Locked ({locked.length})
          </button>
          
          <div className="w-px bg-slate-300 dark:bg-slate-700 mx-2" />
          
          {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'] as AchievementTier[]).map((tier) => {
            const config = tierConfig[tier];
            const count = achievements.filter((a) => a.currentTier === tier).length;
            return (
              <button
                key={tier}
                onClick={() => setFilter(tier)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === tier
                    ? `${config.icon} text-white shadow-lg`
                    : `glass-panel ${config.text} hover:bg-slate-100 dark:hover:bg-slate-800`
                }`}
              >
                {tier} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Achievement Grid */}
      {achievements.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-xl">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Achievement System Coming Soon!
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              The 5-tier achievement system is currently being set up. Keep studying and your progress will be tracked automatically once it's live!
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Bronze</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                <span className="text-slate-600 dark:text-slate-400">Silver</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Gold</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-slate-600 dark:text-slate-400">Platinum</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-slate-600 dark:text-slate-400">Diamond</span>
              </div>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredAchievements.map((achievement, index) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  index={index}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12 glass-panel rounded-xl">
              <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-muted">No achievements found for this filter</p>
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

// Helper function to get next tier
function getNextTier(currentTier: AchievementTier): AchievementTier | null {
  const tiers: AchievementTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tiers.length - 1) return null;
  return tiers[currentIndex + 1];
}

// Achievement Card Component
function AchievementCard({ achievement, index }: { achievement: UserAchievement; index: number }) {
  const tier = tierConfig[achievement.currentTier];
  const Icon = iconMap[achievement.definition.icon] || Trophy;
  const isLocked = achievement.currentValue === 0;
  const nextTier = getNextTier(achievement.currentTier);
  const progress = achievement.progress;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-panel rounded-xl p-4 relative overflow-hidden group transition-all duration-300 ${
        isLocked ? 'opacity-60 grayscale' : ''
      } ${tier.border} ${tier.shadow} ${tier.glow}`}
    >
      {/* Shimmer effect for Diamond tier */}
      {achievement.currentTier === 'DIAMOND' && !isLocked && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-14 h-14 rounded-xl ${tier.icon} flex items-center justify-center shadow-lg ${isLocked ? 'grayscale opacity-50' : ''}`}>
            {isLocked ? (
              <Lock className="w-7 h-7 text-white" />
            ) : (
              <Icon className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${tier.icon} ${tier.badgeText}`}>
              {achievement.currentTier}
            </span>
            {!isLocked && (
              <span className="text-xs text-muted">
                +{achievement.definition.xpRewards[achievement.currentTier]} XP
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <h3 className="font-bold text-heading mb-1 line-clamp-1">
          {achievement.definition.name}
        </h3>
        <p className="text-sm text-body mb-3 line-clamp-2">
          {achievement.definition.description}
        </p>

        {/* Progress Bar */}
        {progress && nextTier && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-body">
              <span>Progress to {nextTier}</span>
              <span className="font-medium">
                {progress.current.toLocaleString()} / {progress.required.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, progress.percentage)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full ${tier.icon} rounded-full`}
              />
            </div>
          </div>
        )}

        {/* Unlocked Date */}
        {!isLocked && (
          <div className="flex items-center gap-1 text-xs text-muted mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3" />
            <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Locked State */}
        {isLocked && (
          <div className="flex items-center gap-1 text-xs text-muted mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Gift className="w-3 h-3" />
            <span>Unlock to earn {achievement.definition.xpRewards.BRONZE} XP</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
