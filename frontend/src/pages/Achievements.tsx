import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import {
  Trophy,
  Star,
  Flame,
  BookOpen,
  Target,
  Zap,
  Award,
  Crown,
  Share2,
  Lock,
  Users,
  Brain,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

// --- Types ---
type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'RUBY' | 'DIAMOND';

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
}

interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  currentTier: AchievementTier;
  currentValue: number;
  unlockedAt: Date | null;
  updatedAt: Date;
  definition: AchievementDefinition;
  progress: {
    current: number;
    required: number;
    percentage: number;
  } | null;
  unlocked: boolean;
}

// --- Config ---

const TIER_ORDER: AchievementTier[] = ['DIAMOND', 'RUBY', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

const TIER_CONFIG = {
  BRONZE: {
    border: 'border-orange-600',
    bg: 'bg-orange-50/50',
    text: 'text-orange-700',
    gradient: 'from-orange-400 to-amber-600',
    label: 'Bronze',
  },
  SILVER: {
    border: 'border-slate-400',
    bg: 'bg-slate-50/50',
    text: 'text-slate-600',
    gradient: 'from-slate-300 to-slate-500',
    label: 'Silver',
  },
  GOLD: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-50/50',
    text: 'text-yellow-700',
    gradient: 'from-yellow-400 to-amber-500',
    label: 'Gold',
  },
  PLATINUM: {
    border: 'border-cyan-500',
    bg: 'bg-cyan-50/50',
    text: 'text-cyan-700',
    gradient: 'from-cyan-400 to-blue-500',
    label: 'Platinum',
  },
  RUBY: {
    border: 'border-rose-600',
    bg: 'bg-rose-50/50',
    text: 'text-rose-700',
    gradient: 'from-rose-500 to-red-600',
    label: 'Ruby',
  },
  DIAMOND: {
    border: 'border-indigo-500',
    bg: 'bg-indigo-50/50',
    text: 'text-indigo-700',
    gradient: 'from-indigo-400 to-purple-600',
    label: 'Diamond',
  },
};

// --- Helper Functions ---

const getIcon = (iconName: string) => {
  const icons: Record<string, any> = {
    trophy: Trophy,
    star: Star,
    flame: Flame,
    book: BookOpen,
    target: Target,
    zap: Zap,
    award: Award,
    crown: Crown,
    rocket: Rocket,
    users: Users,
    brain: Brain,
    sparkles: Sparkles,
    'message-circle': Users,
    'file-text': BookOpen,
  };
  return icons[iconName.toLowerCase()] || Trophy;
};

// --- Components ---

interface AchievementCardProps {
  achievement: UserAchievement;
}

const AchievementCard = ({ achievement }: AchievementCardProps) => {
  const [hoveredCard, setHoveredCard] = useState(false);
  const Icon = getIcon(achievement.definition.icon);
  const tier = TIER_CONFIG[achievement.currentTier];
  const isLocked = !achievement.unlocked;

  return (
    <motion.div
      className="relative"
      onHoverStart={() => setHoveredCard(true)}
      onHoverEnd={() => setHoveredCard(false)}
      whileHover={!isLocked ? { scale: 1.05 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Main Card */}
      <div
        className={`aspect-square rounded-xl border-2 ${
          isLocked
            ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
            : `${tier.border} ${tier.bg} dark:bg-opacity-20`
        } flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isLocked ? 'grayscale' : ''
        }`}
      >
        {/* Shimmer effect for unlocked cards on hover */}
        {!isLocked && hoveredCard && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
          />
        )}

        {/* Diamond pulse animation */}
        {!isLocked && achievement.currentTier === 'DIAMOND' && (
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"
          />
        )}

        {/* Lock Icon for locked achievements */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
        )}

        {/* Achievement Icon */}
        <div
          className={`w-16 h-16 rounded-lg bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-lg ${
            isLocked ? 'opacity-20' : ''
          }`}
        >
          <Icon className="w-8 h-8" />
        </div>

        {/* Tier Badge */}
        {!isLocked && (
          <div className="mt-3">
            <span
              className={`text-[10px] font-bold px-2 py-1 rounded-full ${tier.text} bg-white/80 dark:bg-black/20 uppercase tracking-wider`}
            >
              {tier.label}
            </span>
          </div>
        )}
      </div>

      {/* Tooltip on Hover (Unlocked only) */}
      <AnimatePresence>
        {hoveredCard && !isLocked && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 pointer-events-none"
          >
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
              {achievement.definition.name}
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              {achievement.definition.description}
            </p>
            {achievement.progress && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(achievement.progress.percentage)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${tier.gradient} transition-all duration-300`}
                    style={{ width: `${achievement.progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Hidden Export Component ---

interface PlayerCardExportProps {
  user: any;
  achievements: UserAchievement[];
}

const PlayerCardExport = ({ user, achievements }: PlayerCardExportProps) => {
  // Filter only unlocked achievements and sort by tier
  const unlockedAchievements = achievements
    .filter((a) => a.unlocked)
    .sort((a, b) => TIER_ORDER.indexOf(a.currentTier) - TIER_ORDER.indexOf(b.currentTier));

  return (
    <div
      id="player-card-export"
      className="fixed left-[-9999px] top-0 w-[900px] bg-slate-900 text-white p-10 rounded-3xl overflow-hidden font-sans"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-6 mb-10 border-b border-white/10 pb-8">
        <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 p-[3px]">
          <img
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`}
            alt="Avatar"
            className="w-full h-full rounded-2xl bg-slate-800 object-cover"
          />
        </div>
        <div className="flex-1">
          <h2 className="text-4xl font-bold mb-2">{user?.username || 'Thynkr Student'}</h2>
          <div className="flex items-center gap-4">
            <span className="px-4 py-1.5 rounded-full bg-white/10 text-sm font-medium border border-white/5">
              Level {Math.floor((user?.xp || 0) / 1000) + 1}
            </span>
            <span className="text-slate-300 text-sm">
              {unlockedAchievements.length} Achievement{unlockedAchievements.length !== 1 ? 's' : ''} Unlocked
            </span>
          </div>
        </div>
        <Trophy className="w-16 h-16 text-yellow-400" />
      </div>

      {/* Achievement Checkerboard Grid */}
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5">
          Achievement Showcase
        </h3>
        <div className="grid grid-cols-10 gap-3">
          {unlockedAchievements.map((achievement) => {
            const Icon = getIcon(achievement.definition.icon);
            const tier = TIER_CONFIG[achievement.currentTier];
            return (
              <div
                key={achievement.id}
                className={`aspect-square rounded-lg bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-xl relative group`}
              >
                <Icon className="w-7 h-7 text-white drop-shadow-lg" />
                {/* Tier indicator dot */}
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/60 ring-1 ring-black/10 shadow-sm" />
              </div>
            );
          })}
          {/* Fill empty spots for visual balance */}
          {Array.from({
            length: Math.max(0, 10 - (unlockedAchievements.length % 10 === 0 && unlockedAchievements.length > 0 ? 0 : unlockedAchievements.length % 10)),
          }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="aspect-square rounded-lg bg-white/5 border border-white/5"
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-10 pt-6 flex justify-between items-center text-xs text-slate-500 border-t border-white/5">
        <span>Generated by Thynkr.ai</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function Achievements() {
  const { user } = useAuth();

  // Fetch achievements from backend
  const { data: achievements, isLoading, error } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const response = await api.get('/progress/achievements');
      return response.data as UserAchievement[];
    },
    enabled: !!user?.id,
  });

  // Add unlocked property based on unlockedAt field
  const enrichedAchievements = achievements?.map(achievement => ({
    ...achievement,
    unlocked: achievement.unlockedAt !== null,
  })) || [];

  const handleExport = async () => {
    const element = document.getElementById('player-card-export');
    if (!element) return;

    try {
      toast.loading('Generating your player card...', { id: 'export' });
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a', // Match slate-900
        scale: 2, // Retina quality
        useCORS: true,
        allowTaint: true,
      });

      const link = document.createElement('a');
      link.download = `thynkr-achievements-${user?.username || 'user'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Player card downloaded!', { id: 'export' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate player card', { id: 'export' });
    }
  };

  const unlockedCount = enrichedAchievements.filter((a) => a.unlocked).length;
  const totalCount = enrichedAchievements.length;

  if (isLoading) {
    return (
      <PageContainer>
        <PageContainer.Header subtitle="Loading achievements...">
          Achievements
        </PageContainer.Header>
        <PageContainer.Section>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        </PageContainer.Section>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageContainer.Header subtitle="Error loading achievements">
          Achievements
        </PageContainer.Header>
        <PageContainer.Section>
          <div className="text-center py-20 text-red-500">
            Failed to load achievements. Please try again.
          </div>
        </PageContainer.Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageContainer.Header
        subtitle={`${unlockedCount} of ${totalCount} achievements unlocked`}
        actions={
          <Button onClick={handleExport} className="gap-2" variant="primary">
            <Share2 className="w-4 h-4" />
            Share Profile
          </Button>
        }
      >
        Achievements
      </PageContainer.Header>

      <PageContainer.Section>
        <div className="space-y-8">
          {/* Achievement Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {enrichedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>

          {/* Empty State */}
          {enrichedAchievements.length === 0 && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                No achievements yet
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Start studying to unlock your first achievement!
              </p>
            </div>
          )}
        </div>
      </PageContainer.Section>

      {/* Hidden Export Component */}
      <PlayerCardExport user={user} achievements={enrichedAchievements} />
    </PageContainer>
  );
}
