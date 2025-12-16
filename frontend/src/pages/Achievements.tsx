import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { motion } from 'framer-motion';
import {
  Trophy,
  Star,
  Flame,
  Brain,
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
  Rocket,
  CheckCircle2,
  Lock,
  Gift,
  Medal,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface UserStats {
  xp: number;
  level: number;
  achievements: Array<{
    id: string;
    unlockedAt: string;
  }>;
  streak: {
    current: number;
    longest: number;
    totalDays: number;
    totalMinutes: number;
  };
  weeklyStats: {
    sessionsCount: number;
    totalMinutes: number;
  };
  quizPerformance: {
    recentAttempts: number;
    averageScore: number;
    perfectScores: number;
  };
  filesStudied: number;
  totalQuizzes: number;
  totalFlashcards: number;
  tutorSessions: number;
}

// Achievement categories
type AchievementCategory = 'streak' | 'quiz' | 'study' | 'mastery' | 'special' | 'social';
type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: typeof Trophy;
  xpReward: number;
  requirement: (stats: UserStats) => boolean;
  progress?: (stats: UserStats) => { current: number; total: number };
}

// XP calculation for levels (exponential curve)
const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(level, 1.5));
};

// Comprehensive achievement definitions
const achievements: Achievement[] = [
  // STREAK ACHIEVEMENTS
  {
    id: 'first-steps',
    name: 'First Steps',
    description: 'Start your learning journey',
    category: 'streak',
    tier: 'bronze',
    icon: Flame,
    xpReward: 50,
    requirement: (stats) => stats.streak.current >= 1,
    progress: (stats) => ({ current: Math.min(stats.streak.current, 1), total: 1 }),
  },
  {
    id: 'getting-started',
    name: 'Getting Started',
    description: 'Maintain a 3-day study streak',
    category: 'streak',
    tier: 'bronze',
    icon: Flame,
    xpReward: 100,
    requirement: (stats) => stats.streak.current >= 3,
    progress: (stats) => ({ current: Math.min(stats.streak.current, 3), total: 3 }),
  },
  {
    id: 'week-warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day study streak',
    category: 'streak',
    tier: 'silver',
    icon: Flame,
    xpReward: 250,
    requirement: (stats) => stats.streak.current >= 7,
    progress: (stats) => ({ current: Math.min(stats.streak.current, 7), total: 7 }),
  },
  {
    id: 'two-week-champion',
    name: 'Two-Week Champion',
    description: 'Maintain a 14-day study streak',
    category: 'streak',
    tier: 'gold',
    icon: Flame,
    xpReward: 500,
    requirement: (stats) => stats.streak.current >= 14,
    progress: (stats) => ({ current: Math.min(stats.streak.current, 14), total: 14 }),
  },
  {
    id: 'monthly-master',
    name: 'Monthly Master',
    description: 'Maintain a 30-day study streak',
    category: 'streak',
    tier: 'platinum',
    icon: Crown,
    xpReward: 1000,
    requirement: (stats) => stats.streak.current >= 30,
    progress: (stats) => ({ current: Math.min(stats.streak.current, 30), total: 30 }),
  },
  {
    id: 'streak-legend',
    name: 'Streak Legend',
    description: 'Maintain a 100-day study streak',
    category: 'streak',
    tier: 'diamond',
    icon: Crown,
    xpReward: 5000,
    requirement: (stats) => stats.streak.current >= 100,
    progress: (stats) => ({ current: Math.min(stats.streak.current, 100), total: 100 }),
  },

  // QUIZ ACHIEVEMENTS
  {
    id: 'quiz-novice',
    name: 'Quiz Novice',
    description: 'Complete your first quiz',
    category: 'quiz',
    tier: 'bronze',
    icon: Brain,
    xpReward: 50,
    requirement: (stats) => stats.totalQuizzes >= 1,
    progress: (stats) => ({ current: Math.min(stats.totalQuizzes, 1), total: 1 }),
  },
  {
    id: 'quiz-enthusiast',
    name: 'Quiz Enthusiast',
    description: 'Complete 10 quizzes',
    category: 'quiz',
    tier: 'silver',
    icon: Brain,
    xpReward: 200,
    requirement: (stats) => stats.totalQuizzes >= 10,
    progress: (stats) => ({ current: Math.min(stats.totalQuizzes, 10), total: 10 }),
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Complete 50 quizzes',
    category: 'quiz',
    tier: 'gold',
    icon: Brain,
    xpReward: 750,
    requirement: (stats) => stats.totalQuizzes >= 50,
    progress: (stats) => ({ current: Math.min(stats.totalQuizzes, 50), total: 50 }),
  },
  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    description: 'Achieve 80%+ average quiz score',
    category: 'quiz',
    tier: 'silver',
    icon: Target,
    xpReward: 300,
    requirement: (stats) => stats.quizPerformance.averageScore >= 80,
    progress: (stats) => ({ 
      current: Math.min(stats.quizPerformance.averageScore, 80), 
      total: 80 
    }),
  },
  {
    id: 'perfect-score',
    name: 'Perfect Mind',
    description: 'Achieve 95%+ average quiz score',
    category: 'quiz',
    tier: 'gold',
    icon: Star,
    xpReward: 750,
    requirement: (stats) => stats.quizPerformance.averageScore >= 95,
    progress: (stats) => ({ 
      current: Math.min(stats.quizPerformance.averageScore, 95), 
      total: 95 
    }),
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Score 100% on 5 quizzes',
    category: 'quiz',
    tier: 'platinum',
    icon: Sparkles,
    xpReward: 1500,
    requirement: (stats) => stats.quizPerformance.perfectScores >= 5,
    progress: (stats) => ({ 
      current: Math.min(stats.quizPerformance.perfectScores, 5), 
      total: 5 
    }),
  },

  // STUDY TIME ACHIEVEMENTS
  {
    id: 'dedicated-learner',
    name: 'Dedicated Learner',
    description: 'Study for 60+ minutes total',
    category: 'study',
    tier: 'bronze',
    icon: Clock,
    xpReward: 100,
    requirement: (stats) => stats.streak.totalMinutes >= 60,
    progress: (stats) => ({ 
      current: Math.min(stats.streak.totalMinutes, 60), 
      total: 60 
    }),
  },
  {
    id: 'study-champion',
    name: 'Study Champion',
    description: 'Study for 300+ minutes total',
    category: 'study',
    tier: 'silver',
    icon: Trophy,
    xpReward: 300,
    requirement: (stats) => stats.streak.totalMinutes >= 300,
    progress: (stats) => ({ 
      current: Math.min(stats.streak.totalMinutes, 300), 
      total: 300 
    }),
  },
  {
    id: 'study-warrior',
    name: 'Study Warrior',
    description: 'Study for 1000+ minutes total',
    category: 'study',
    tier: 'gold',
    icon: Rocket,
    xpReward: 1000,
    requirement: (stats) => stats.streak.totalMinutes >= 1000,
    progress: (stats) => ({ 
      current: Math.min(stats.streak.totalMinutes, 1000), 
      total: 1000 
    }),
  },
  {
    id: 'time-master',
    name: 'Time Master',
    description: 'Study for 5000+ minutes total',
    category: 'study',
    tier: 'diamond',
    icon: Crown,
    xpReward: 5000,
    requirement: (stats) => stats.streak.totalMinutes >= 5000,
    progress: (stats) => ({ 
      current: Math.min(stats.streak.totalMinutes, 5000), 
      total: 5000 
    }),
  },

  // MASTERY ACHIEVEMENTS
  {
    id: 'material-collector',
    name: 'Material Collector',
    description: 'Study 5+ unique files',
    category: 'mastery',
    tier: 'bronze',
    icon: FileText,
    xpReward: 100,
    requirement: (stats) => stats.filesStudied >= 5,
    progress: (stats) => ({ current: Math.min(stats.filesStudied, 5), total: 5 }),
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Study 20+ unique files',
    category: 'mastery',
    tier: 'silver',
    icon: BookOpen,
    xpReward: 400,
    requirement: (stats) => stats.filesStudied >= 20,
    progress: (stats) => ({ current: Math.min(stats.filesStudied, 20), total: 20 }),
  },
  {
    id: 'library-master',
    name: 'Library Master',
    description: 'Study 50+ unique files',
    category: 'mastery',
    tier: 'gold',
    icon: Award,
    xpReward: 1000,
    requirement: (stats) => stats.filesStudied >= 50,
    progress: (stats) => ({ current: Math.min(stats.filesStudied, 50), total: 50 }),
  },
  {
    id: 'flashcard-beginner',
    name: 'Flashcard Beginner',
    description: 'Complete 50 flashcard reviews',
    category: 'mastery',
    tier: 'bronze',
    icon: BookOpen,
    xpReward: 150,
    requirement: (stats) => stats.totalFlashcards >= 50,
    progress: (stats) => ({ current: Math.min(stats.totalFlashcards, 50), total: 50 }),
  },
  {
    id: 'flashcard-expert',
    name: 'Flashcard Expert',
    description: 'Complete 500 flashcard reviews',
    category: 'mastery',
    tier: 'gold',
    icon: Sparkles,
    xpReward: 800,
    requirement: (stats) => stats.totalFlashcards >= 500,
    progress: (stats) => ({ current: Math.min(stats.totalFlashcards, 500), total: 500 }),
  },

  // SOCIAL/SPECIAL ACHIEVEMENTS
  {
    id: 'ai-curious',
    name: 'AI Curious',
    description: 'Have your first AI tutor conversation',
    category: 'social',
    tier: 'bronze',
    icon: MessageCircle,
    xpReward: 100,
    requirement: (stats) => stats.tutorSessions >= 1,
    progress: (stats) => ({ current: Math.min(stats.tutorSessions, 1), total: 1 }),
  },
  {
    id: 'ai-collaborator',
    name: 'AI Collaborator',
    description: 'Complete 10 AI tutor sessions',
    category: 'social',
    tier: 'silver',
    icon: MessageCircle,
    xpReward: 350,
    requirement: (stats) => stats.tutorSessions >= 10,
    progress: (stats) => ({ current: Math.min(stats.tutorSessions, 10), total: 10 }),
  },
  {
    id: 'active-learner',
    name: 'Active Learner',
    description: 'Complete 10+ study sessions this week',
    category: 'special',
    tier: 'silver',
    icon: Zap,
    xpReward: 250,
    requirement: (stats) => stats.weeklyStats.sessionsCount >= 10,
    progress: (stats) => ({ 
      current: Math.min(stats.weeklyStats.sessionsCount, 10), 
      total: 10 
    }),
  },
  {
    id: 'consistency-king',
    name: 'Consistency King',
    description: 'Study 20+ days in total',
    category: 'special',
    tier: 'gold',
    icon: Calendar,
    xpReward: 600,
    requirement: (stats) => stats.streak.totalDays >= 20,
    progress: (stats) => ({ 
      current: Math.min(stats.streak.totalDays, 20), 
      total: 20 
    }),
  },
  {
    id: 'level-5',
    name: 'Rising Star',
    description: 'Reach level 5',
    category: 'special',
    tier: 'silver',
    icon: TrendingUp,
    xpReward: 0, // No XP reward for level achievements
    requirement: (stats) => stats.level >= 5,
    progress: (stats) => ({ current: Math.min(stats.level, 5), total: 5 }),
  },
  {
    id: 'level-10',
    name: 'Skilled Scholar',
    description: 'Reach level 10',
    category: 'special',
    tier: 'gold',
    icon: Medal,
    xpReward: 0,
    requirement: (stats) => stats.level >= 10,
    progress: (stats) => ({ current: Math.min(stats.level, 10), total: 10 }),
  },
  {
    id: 'level-25',
    name: 'Master Mind',
    description: 'Reach level 25',
    category: 'special',
    tier: 'platinum',
    icon: Crown,
    xpReward: 0,
    requirement: (stats) => stats.level >= 25,
    progress: (stats) => ({ current: Math.min(stats.level, 25), total: 25 }),
  },
  {
    id: 'level-50',
    name: 'Learning Legend',
    description: 'Reach level 50',
    category: 'special',
    tier: 'diamond',
    icon: Sparkles,
    xpReward: 0,
    requirement: (stats) => stats.level >= 50,
    progress: (stats) => ({ current: Math.min(stats.level, 50), total: 50 }),
  },
];

const tierConfig = {
  bronze: {
    color: 'from-amber-600 to-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-600 dark:border-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-amber-500/50',
  },
  silver: {
    color: 'from-slate-400 to-slate-600',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-400 dark:border-slate-400',
    text: 'text-slate-700 dark:text-slate-300',
    glow: 'shadow-slate-500/50',
  },
  gold: {
    color: 'from-yellow-400 to-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-500 dark:border-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-400',
    glow: 'shadow-yellow-500/50',
  },
  platinum: {
    color: 'from-cyan-400 to-blue-500',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-500 dark:border-cyan-400',
    text: 'text-cyan-700 dark:text-cyan-400',
    glow: 'shadow-cyan-500/50',
  },
  diamond: {
    color: 'from-purple-400 via-pink-500 to-blue-500',
    bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-blue-950/30',
    border: 'border-purple-500 dark:border-purple-400',
    text: 'text-purple-700 dark:text-purple-300',
    glow: 'shadow-purple-500/50',
  },
};

const categoryIcons = {
  streak: Flame,
  quiz: Brain,
  study: Clock,
  mastery: BookOpen,
  special: Sparkles,
  social: MessageCircle,
};

const categoryColors = {
  streak: 'text-orange-500',
  quiz: 'text-blue-500',
  study: 'text-green-500',
  mastery: 'text-purple-500',
  special: 'text-pink-500',
  social: 'text-cyan-500',
};

export default function Achievements() {
  const { data: stats, isLoading } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/progress`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      
      // Mock additional stats for now (will be replaced with real backend data)
      return {
        ...data,
        xp: 2450,
        level: 7,
        achievements: [
          { id: 'first-steps', unlockedAt: new Date().toISOString() },
          { id: 'getting-started', unlockedAt: new Date().toISOString() },
        ],
        totalQuizzes: data.quizPerformance?.recentAttempts || 0,
        totalFlashcards: 0,
        tutorSessions: 0,
        quizPerformance: {
          ...data.quizPerformance,
          perfectScores: 0,
        },
      };
    },
  });

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  const currentLevel = stats?.level || 1;
  const currentXP = stats?.xp || 0;
  const xpForNextLevel = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - Array.from({ length: currentLevel - 1 }, (_, i) => getXPForLevel(i + 1)).reduce((a, b) => a + b, 0);
  const xpProgress = (xpInCurrentLevel / xpForNextLevel) * 100;

  const unlockedAchievementIds = new Set(stats?.achievements.map((a) => a.id) || []);
  const unlockedAchievements = achievements.filter((a) => unlockedAchievementIds.has(a.id));
  const lockedAchievements = achievements.filter((a) => !unlockedAchievementIds.has(a.id));

  // Sort achievements by category and tier
  const sortedUnlocked = [...unlockedAchievements].sort((a, b) => {
    const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
    return tierOrder[b.tier] - tierOrder[a.tier];
  });

  const groupedLocked = lockedAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<AchievementCategory, Achievement[]>);

  return (
    <PageContainer>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Achievements
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your progress and unlock rewards
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {unlockedAchievements.length} / {achievements.length}
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

      {/* Unlocked Achievements */}
      {unlockedAchievements.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Unlocked Achievements
            </h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">
              ({unlockedAchievements.length})
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedUnlocked.map((achievement, index) => {
              const Icon = achievement.icon;
              const tier = tierConfig[achievement.tier];
              const unlockData = stats?.achievements.find((a) => a.id === achievement.id);

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl border-2 ${tier.border} ${tier.bg} relative overflow-hidden group hover:shadow-lg ${tier.glow} transition-all duration-300`}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`text-xs font-semibold uppercase ${tier.text}`}>
                          {achievement.tier}
                        </span>
                        {achievement.xpReward > 0 && (
                          <span className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                            +{achievement.xpReward} XP
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      {achievement.description}
                    </p>
                    
                    {unlockData && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-500">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          Unlocked {new Date(unlockData.unlockedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked Achievements by Category */}
      {Object.entries(groupedLocked).map(([category, categoryAchievements]) => {
        const CategoryIcon = categoryIcons[category as AchievementCategory];
        const categoryColor = categoryColors[category as AchievementCategory];
        
        return (
          <div key={category} className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
              <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                {category} Achievements
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                ({categoryAchievements.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map((achievement, index) => {
                const tier = tierConfig[achievement.tier];
                const progress = achievement.progress?.(stats!);
                const progressPercent = progress ? (progress.current / progress.total) * 100 : 0;

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden opacity-75"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-slate-400" />
                      </div>
                      <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-500">
                        {achievement.tier}
                      </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500 mb-3">
                      {achievement.description}
                    </p>
                    
                    {progress && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>Progress</span>
                          <span>
                            {progress.current.toLocaleString()} / {progress.total.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${tier.color} rounded-full transition-all duration-500`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {achievement.xpReward > 0 && (
                      <div className="mt-2 text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                        <Gift className="w-3 h-3" />
                        <span>Reward: {achievement.xpReward} XP</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </PageContainer>
  );
}
