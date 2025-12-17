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

type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'RUBY';
type FilterOption = 'all' | 'unlocked' | 'in-progress' | 'locked' | AchievementTier;

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
  thresholds: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    RUBY: number;
  };
  xpRewards: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    RUBY: number;
  };
  isMastery?: boolean;
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
  RUBY: {
    border: 'border-red-500/50',
    shadow: 'shadow-xl shadow-red-600/20',
    glow: 'hover:shadow-2xl hover:shadow-red-600/30 animate-pulse-glow',
    gradient: 'from-red-600 via-rose-500 to-pink-600',
    bg: 'bg-gradient-to-br from-red-50/50 via-rose-50/50 to-pink-50/50 dark:from-red-950/20 dark:via-rose-950/20 dark:to-pink-950/20',
    text: 'text-red-700 dark:text-red-300',
    icon: 'bg-gradient-to-br from-red-600 via-rose-500 to-pink-600',
    badgeText: 'text-red-100',
  },
};

// Special styling for Mastery achievements
const masteryConfig = {
  border: 'border-amber-500/60 border-2',
  shadow: 'shadow-2xl shadow-amber-600/30',
  glow: 'hover:shadow-3xl hover:shadow-amber-600/40 animate-pulse-glow',
  gradient: 'from-amber-500 via-yellow-400 to-amber-600',
  bg: 'bg-gradient-to-br from-amber-50/80 via-yellow-50/80 to-amber-50/80 dark:from-amber-950/30 dark:via-yellow-950/30 dark:to-amber-950/30',
  text: 'text-amber-700 dark:text-amber-300',
  icon: 'bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600',
  badgeText: 'text-amber-900',
  ring: 'ring-2 ring-amber-400/50 ring-offset-2 ring-offset-slate-900',
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
  '👑': Crown,
  '⭐': Star,
  '🌟': Sparkles,
};

// XP calculation for levels
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Default achievement definitions to show when backend doesn't have data yet
const DEFAULT_ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'scholar', name: 'Scholar', description: 'Total hours spent studying', icon: '📚', category: 'study', thresholds: { BRONZE: 10, SILVER: 50, GOLD: 100, PLATINUM: 500, RUBY: 1000 }, xpRewards: { BRONZE: 50, SILVER: 200, GOLD: 500, PLATINUM: 2000, RUBY: 5000 } },
  { id: 'streak_master', name: 'Streak Master', description: 'Consecutive days of studying', icon: '🔥', category: 'streak', thresholds: { BRONZE: 3, SILVER: 7, GOLD: 14, PLATINUM: 30, RUBY: 100 }, xpRewards: { BRONZE: 50, SILVER: 150, GOLD: 400, PLATINUM: 1500, RUBY: 4000 } },
  { id: 'quiz_whiz', name: 'Quiz Whiz', description: 'Perfect quiz scores achieved', icon: '🎯', category: 'skill', thresholds: { BRONZE: 1, SILVER: 5, GOLD: 10, PLATINUM: 25, RUBY: 50 }, xpRewards: { BRONZE: 50, SILVER: 200, GOLD: 450, PLATINUM: 1800, RUBY: 4500 } },
  { id: 'librarian', name: 'Librarian', description: 'Study materials uploaded', icon: '📂', category: 'content', thresholds: { BRONZE: 5, SILVER: 20, GOLD: 50, PLATINUM: 150, RUBY: 500 }, xpRewards: { BRONZE: 50, SILVER: 180, GOLD: 420, PLATINUM: 1600, RUBY: 4200 } },
  { id: 'socialite', name: 'Socialite', description: 'Study sessions shared with others', icon: '💬', category: 'social', thresholds: { BRONZE: 3, SILVER: 10, GOLD: 25, PLATINUM: 75, RUBY: 200 }, xpRewards: { BRONZE: 50, SILVER: 170, GOLD: 400, PLATINUM: 1500, RUBY: 4000 } },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Quiz questions answered in under 5 seconds', icon: '⚡', category: 'skill', thresholds: { BRONZE: 10, SILVER: 50, GOLD: 150, PLATINUM: 500, RUBY: 1500 }, xpRewards: { BRONZE: 50, SILVER: 190, GOLD: 470, PLATINUM: 1900, RUBY: 4700 } },
  { id: 'note_taker', name: 'Note Taker', description: 'AI-generated notes created', icon: '📝', category: 'content', thresholds: { BRONZE: 5, SILVER: 25, GOLD: 75, PLATINUM: 200, RUBY: 600 }, xpRewards: { BRONZE: 50, SILVER: 180, GOLD: 440, PLATINUM: 1700, RUBY: 4400 } },
  { id: 'flashcard_master', name: 'Flashcard Master', description: 'Flashcard sets completed', icon: '🎴', category: 'study', thresholds: { BRONZE: 3, SILVER: 15, GOLD: 40, PLATINUM: 120, RUBY: 350 }, xpRewards: { BRONZE: 50, SILVER: 175, GOLD: 430, PLATINUM: 1650, RUBY: 4300 } },
  { id: 'tutor_enthusiast', name: 'Tutor Enthusiast', description: 'AI tutor conversations started', icon: '🤖', category: 'study', thresholds: { BRONZE: 5, SILVER: 20, GOLD: 60, PLATINUM: 180, RUBY: 500 }, xpRewards: { BRONZE: 50, SILVER: 185, GOLD: 450, PLATINUM: 1750, RUBY: 4500 } },
  { id: 'early_bird', name: 'Early Bird', description: 'Study sessions started before 8 AM', icon: '🌅', category: 'streak', thresholds: { BRONZE: 5, SILVER: 15, GOLD: 35, PLATINUM: 100, RUBY: 300 }, xpRewards: { BRONZE: 50, SILVER: 165, GOLD: 410, PLATINUM: 1550, RUBY: 4100 } },
  { id: 'night_owl', name: 'Night Owl', description: 'Study sessions after 10 PM', icon: '🦉', category: 'streak', thresholds: { BRONZE: 5, SILVER: 15, GOLD: 35, PLATINUM: 100, RUBY: 300 }, xpRewards: { BRONZE: 50, SILVER: 165, GOLD: 410, PLATINUM: 1550, RUBY: 4100 } },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Hard difficulty quizzes completed with 100% score', icon: '💎', category: 'skill', thresholds: { BRONZE: 1, SILVER: 3, GOLD: 8, PLATINUM: 20, RUBY: 50 }, xpRewards: { BRONZE: 50, SILVER: 220, GOLD: 520, PLATINUM: 2100, RUBY: 5200 } },
  { id: 'course_creator', name: 'Course Creator', description: 'Study courses created', icon: '🎓', category: 'content', thresholds: { BRONZE: 1, SILVER: 3, GOLD: 8, PLATINUM: 20, RUBY: 50 }, xpRewards: { BRONZE: 50, SILVER: 210, GOLD: 500, PLATINUM: 2000, RUBY: 5000 } },
  { id: 'marathon_runner', name: 'Marathon Runner', description: 'Single study sessions over 2 hours', icon: '🏃', category: 'study', thresholds: { BRONZE: 1, SILVER: 5, GOLD: 15, PLATINUM: 40, RUBY: 100 }, xpRewards: { BRONZE: 50, SILVER: 195, GOLD: 480, PLATINUM: 1850, RUBY: 4800 } },
  { id: 'consistent_learner', name: 'Consistent Learner', description: 'Weeks with at least 5 study days', icon: '📅', category: 'streak', thresholds: { BRONZE: 2, SILVER: 6, GOLD: 15, PLATINUM: 35, RUBY: 80 }, xpRewards: { BRONZE: 50, SILVER: 175, GOLD: 440, PLATINUM: 1700, RUBY: 4400 } },
  { id: 'game_champion', name: 'Game Champion', description: 'Arcade game sessions won', icon: '🏆', category: 'skill', thresholds: { BRONZE: 3, SILVER: 10, GOLD: 30, PLATINUM: 80, RUBY: 200 }, xpRewards: { BRONZE: 50, SILVER: 190, GOLD: 460, PLATINUM: 1800, RUBY: 4600 } },
  { id: 'knowledge_seeker', name: 'Knowledge Seeker', description: 'Unique topics studied', icon: '🔍', category: 'study', thresholds: { BRONZE: 5, SILVER: 15, GOLD: 40, PLATINUM: 100, RUBY: 250 }, xpRewards: { BRONZE: 50, SILVER: 175, GOLD: 435, PLATINUM: 1700, RUBY: 4350 } },
  { id: 'summary_specialist', name: 'Summary Specialist', description: 'AI summaries generated', icon: '📋', category: 'content', thresholds: { BRONZE: 10, SILVER: 40, GOLD: 100, PLATINUM: 300, RUBY: 800 }, xpRewards: { BRONZE: 50, SILVER: 185, GOLD: 455, PLATINUM: 1800, RUBY: 4550 } },
  { id: 'community_helper', name: 'Community Helper', description: 'Study packs shared publicly', icon: '🤝', category: 'social', thresholds: { BRONZE: 2, SILVER: 8, GOLD: 20, PLATINUM: 50, RUBY: 150 }, xpRewards: { BRONZE: 50, SILVER: 195, GOLD: 470, PLATINUM: 1850, RUBY: 4700 } },
  { id: 'multilingual', name: 'Multilingual', description: 'Different languages used for study materials', icon: '🌍', category: 'skill', thresholds: { BRONZE: 2, SILVER: 3, GOLD: 5, PLATINUM: 8, RUBY: 12 }, xpRewards: { BRONZE: 50, SILVER: 250, GOLD: 600, PLATINUM: 2400, RUBY: 6000 } },
  { id: 'mastery_scholar', name: 'Scholar Mastery', description: 'Achieve ultimate study dedication - 5000 total study hours', icon: '👑', category: 'mastery', thresholds: { BRONZE: 5000, SILVER: 5000, GOLD: 5000, PLATINUM: 5000, RUBY: 5000 }, xpRewards: { BRONZE: 10000, SILVER: 10000, GOLD: 10000, PLATINUM: 10000, RUBY: 10000 }, isMastery: true },
  { id: 'mastery_perfectionist', name: 'Perfect Mastery', description: 'The ultimate perfectionist - 500 perfect hard quiz scores', icon: '⭐', category: 'mastery', thresholds: { BRONZE: 500, SILVER: 500, GOLD: 500, PLATINUM: 500, RUBY: 500 }, xpRewards: { BRONZE: 15000, SILVER: 15000, GOLD: 15000, PLATINUM: 15000, RUBY: 15000 }, isMastery: true },
  { id: 'mastery_streak', name: 'Eternal Flame', description: 'Never let the flame die - 365 day study streak', icon: '🔥', category: 'mastery', thresholds: { BRONZE: 365, SILVER: 365, GOLD: 365, PLATINUM: 365, RUBY: 365 }, xpRewards: { BRONZE: 20000, SILVER: 20000, GOLD: 20000, PLATINUM: 20000, RUBY: 20000 }, isMastery: true },
  { id: 'mastery_content', name: 'Content King', description: 'Master of creation - 1000 study materials created', icon: '📚', category: 'mastery', thresholds: { BRONZE: 1000, SILVER: 1000, GOLD: 1000, PLATINUM: 1000, RUBY: 1000 }, xpRewards: { BRONZE: 12000, SILVER: 12000, GOLD: 12000, PLATINUM: 12000, RUBY: 12000 }, isMastery: true },
  { id: 'mastery_social', name: 'Community Legend', description: 'Inspire the world - 500 materials shared publicly', icon: '🌟', category: 'mastery', thresholds: { BRONZE: 500, SILVER: 500, GOLD: 500, PLATINUM: 500, RUBY: 500 }, xpRewards: { BRONZE: 10000, SILVER: 10000, GOLD: 10000, PLATINUM: 10000, RUBY: 10000 }, isMastery: true },
];

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
      
      // Create achievements by merging backend data with default definitions
      const userAchievementsMap = new Map(
        (data.achievements || []).map((a: any) => [a.achievementId, a])
      );
      
      const allAchievements: UserAchievement[] = DEFAULT_ACHIEVEMENTS.map((def) => {
        const userAch = userAchievementsMap.get(def.id);
        if (userAch) {
          return { ...userAch, definition: def } as UserAchievement;
        }
        // Create locked achievement
        return {
          id: `locked-${def.id}`,
          userId: data.userId || '',
          achievementId: def.id,
          currentTier: 'BRONZE' as AchievementTier,
          currentValue: 0,
          unlockedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          definition: def,
          progress: {
            current: 0,
            required: def.thresholds.BRONZE,
            percentage: 0,
          },
        } as UserAchievement;
      });
      
      return {
        xp: data.xp || 0,
        level: data.level || 1,
        achievements: allAchievements,
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
  } else if (['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY'].includes(filter)) {
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
          
          {(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY'] as AchievementTier[]).map((tier) => {
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

      {/* Achievement Grid */}
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
    </PageContainer>
  );
}

// Helper function to get next tier
function getNextTier(currentTier: AchievementTier): AchievementTier | null {
  const tiers: AchievementTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'RUBY'];
  const currentIndex = tiers.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === tiers.length - 1) return null;
  return tiers[currentIndex + 1];
}

// Achievement Card Component
function AchievementCard({ achievement, index }: { achievement: UserAchievement; index: number }) {
  const isMastery = achievement.definition.isMastery || achievement.definition.category === 'mastery';
  const tier = isMastery ? masteryConfig : tierConfig[achievement.currentTier];
  const Icon = iconMap[achievement.definition.icon] || Trophy;
  const isLocked = achievement.currentValue === 0;
  const nextTier = isMastery ? null : getNextTier(achievement.currentTier);
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
      {/* Shimmer effect for Ruby tier and Mastery */}
      {((achievement.currentTier === 'RUBY' && !isMastery) || (isMastery && !isLocked)) && (
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
              {isMastery ? 'MASTERY' : achievement.currentTier}
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

        {/* Progress Bar - only for non-mastery achievements */}
        {progress && nextTier && !isMastery && (
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

        {/* Progress for Mastery achievements */}
        {isMastery && progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-body">
              <span>Progress</span>
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
            <span>Unlock to earn {isMastery ? achievement.definition.xpRewards.BRONZE : achievement.definition.xpRewards.BRONZE} XP</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
