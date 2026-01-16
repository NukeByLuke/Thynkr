import React, { useState } from 'react';
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
    border: 'border-stone-400',
    bg: 'bg-stone-100/80 dark:bg-stone-900/20',
    text: 'text-stone-700 dark:text-stone-300',
    gradient: 'from-stone-400 to-amber-500',
    label: 'Bronze',
  },
  SILVER: {
    border: 'border-slate-300',
    bg: 'bg-slate-50/80 dark:bg-slate-800/20',
    text: 'text-slate-600 dark:text-slate-300',
    gradient: 'from-slate-200 to-slate-400',
    label: 'Silver',
  },
  GOLD: {
    border: 'border-yellow-400',
    bg: 'bg-yellow-50/80 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    gradient: 'from-yellow-300 to-yellow-400',
    label: 'Gold',
  },
  PLATINUM: {
    border: 'border-cyan-300',
    bg: 'bg-cyan-50/80 dark:bg-cyan-900/20',
    text: 'text-cyan-600 dark:text-cyan-300',
    gradient: 'from-cyan-300 to-teal-400',
    label: 'Platinum',
  },
  RUBY: {
    border: 'border-rose-300',
    bg: 'bg-rose-50/80 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-300',
    gradient: 'from-rose-300 to-pink-400',
    label: 'Ruby',
  },
  DIAMOND: {
    border: 'border-purple-300',
    bg: 'bg-purple-50/80 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-300',
    gradient: 'from-purple-300 to-indigo-400',
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
  const [tooltipPosition, setTooltipPosition] = useState<'right' | 'left'>('right');
  const cardRef = React.useRef<HTMLDivElement>(null);
  const Icon = getIcon(achievement.definition.icon);
  const tier = achievement.currentTier ? TIER_CONFIG[achievement.currentTier] : TIER_CONFIG.BRONZE;
  const isLocked = !achievement.unlocked;

  const handleHoverStart = () => {
    setHoveredCard(true);
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = 288; // w-72 = 18rem = 288px
      const spaceOnRight = window.innerWidth - rect.right;
      const spaceOnLeft = rect.left;
      
      if (spaceOnRight < tooltipWidth + 20 && spaceOnLeft > tooltipWidth + 20) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition('right');
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      onHoverStart={handleHoverStart}
      onHoverEnd={() => setHoveredCard(false)}
      whileHover={{ scale: 1.15, zIndex: 50 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {/* Main Card */}
      <div
        className={`aspect-square rounded-xl border-2 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isLocked
            ? 'border-slate-300/50 dark:border-slate-700/50 bg-slate-100/50 dark:bg-slate-900/30 shadow-sm'
            : `${tier.border} ${tier.bg} dark:bg-opacity-30 shadow-lg hover:shadow-2xl ring-2 ring-transparent hover:ring-white/20`
        } ${isLocked ? 'grayscale opacity-60' : ''}`}
      >
        {/* Enhanced Shimmer effect for unlocked cards on hover */}
        {!isLocked && hoveredCard && (
          <>
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent transform -skew-x-12 blur-sm"
            />
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 to-transparent transform -skew-x-12"
            />
          </>
        )}

        {/* Glow effect for unlocked achievements */}
        {!isLocked && (
          <motion.div
            animate={{ opacity: hoveredCard ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
            className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-20 blur-xl`}
          />
        )}

        {/* Diamond pulse animation */}
        {!isLocked && achievement.currentTier === 'DIAMOND' && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
          />
        )}

        {/* Lock Icon for locked achievements */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Lock className="w-8 h-8 text-slate-400 dark:text-slate-600" />
          </div>
        )}

        {/* Achievement Icon */}
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-xl relative z-20 ${
            isLocked ? 'opacity-30 scale-90' : 'group-hover:scale-110'
          } transition-all duration-300`}
        >
          <Icon className="w-6 h-6" />
        </div>
      </div>

      {/* Tooltip on Hover - Shows for both locked and unlocked */}
      <AnimatePresence>
        {hoveredCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`absolute z-[100] top-0 w-72 pointer-events-none ${
              tooltipPosition === 'right' ? 'left-full ml-3' : 'right-full mr-3'
            }`}
          >
            <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-4 relative">
              {/* Tooltip arrow */}
              <div className={`absolute top-4 w-3 h-3 rotate-45 bg-slate-900/95 dark:bg-slate-800/95 ${
                tooltipPosition === 'right' 
                  ? '-left-1.5 border-l border-b border-slate-700/50'
                  : '-right-1.5 border-r border-t border-slate-700/50'
              }`} />
              
              <div className="relative z-10">
                {/* Tier badge */}
                {!isLocked && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${tier.text} bg-gradient-to-r ${tier.gradient} text-white uppercase tracking-wider shadow-lg`}>
                      {tier.label}
                    </span>
                  </div>
                )}
                
                <h4 className="font-bold text-base text-white mb-1.5 flex items-center gap-2">
                  {isLocked && <Lock className="w-4 h-4 text-slate-400" />}
                  {achievement.definition.name}
                </h4>
                
                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                  {achievement.definition.description}
                </p>
                
                {achievement.progress && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400 font-medium">
                      <span>{isLocked ? 'Locked' : 'Progress'}</span>
                      <span>{isLocked ? '0%' : `${Math.round(achievement.progress.percentage)}%`}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${isLocked ? 0 : achievement.progress.percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${tier.gradient} shadow-lg relative overflow-hidden`}
                      >
                        {!isLocked && achievement.progress.percentage > 0 && (
                          <motion.div
                            animate={{ x: ['0%', '100%'] }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                          />
                        )}
                      </motion.div>
                    </div>
                    {achievement.progress.current !== undefined && achievement.progress.required && (
                      <div className="text-xs text-slate-400 text-center">
                        {achievement.progress.current} / {achievement.progress.required}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
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
            const tier = achievement.currentTier ? TIER_CONFIG[achievement.currentTier] : TIER_CONFIG.BRONZE;
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
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6">
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
