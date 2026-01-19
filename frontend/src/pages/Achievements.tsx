import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { motion } from 'framer-motion';
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
  Clock,
  Sun,
  Moon,
  Calendar,
  Search,
  Heart,
  Globe,
  Layers,
  GraduationCap,
  Library,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useLayout } from '@/contexts/LayoutContext';

import { ShareProfileModal } from '@/features/gamification/ShareProfileModal';

// --- Types ---
type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'RUBY' | 'DIAMOND' | 'MASTERY';

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
  thresholds?: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    RUBY: number;
    DIAMOND: number;
    MASTERY?: number;
  };
  xpRewards?: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    RUBY: number;
    DIAMOND: number;
    MASTERY?: number;
  };
}

interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  currentTier: AchievementTier; // Note: Prisma returns string, cast to this
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

const TIER_ORDER: AchievementTier[] = ['MASTERY', 'DIAMOND', 'RUBY', 'GOLD', 'SILVER', 'BRONZE'];

const TIER_CONFIG = {
  BRONZE: {
    // Rich amber-brown for Bronze
    border: 'border-amber-700/60 dark:border-amber-600/40',
    borderHover: 'group-hover:border-amber-600/80 dark:group-hover:border-amber-500/60',
    bg: 'bg-orange-500/5 dark:bg-transparent',
    text: 'text-amber-800 dark:text-amber-400',
    iconBg: 'bg-gradient-to-br from-amber-600 to-orange-700',
    glow: 'shadow-lg shadow-amber-600/20 hover:shadow-amber-600/40',
    gradient: 'from-amber-700 to-orange-600', 
    label: 'Bronze',
  },
  SILVER: {
    // Clean slate-gray for Silver
    border: 'border-slate-400/60 dark:border-slate-500/40',
    borderHover: 'group-hover:border-slate-300/80 dark:group-hover:border-slate-400/60',
    bg: 'bg-slate-500/5 dark:bg-transparent',
    text: 'text-slate-700 dark:text-slate-300',
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    glow: 'shadow-lg shadow-slate-400/20 hover:shadow-slate-400/40',
    gradient: 'from-slate-400 to-slate-600', 
    label: 'Silver',
  },
  GOLD: {
    // Warm yellow-amber Gold
    border: 'border-yellow-600/60 dark:border-yellow-500/40',
    borderHover: 'group-hover:border-yellow-500/80 dark:group-hover:border-yellow-400/60',
    bg: 'bg-yellow-500/5 dark:bg-transparent',
    text: 'text-yellow-700 dark:text-yellow-400',
    iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-600',
    glow: 'shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40',
    gradient: 'from-yellow-500 to-amber-600',
    label: 'Gold',
  },
  RUBY: {
    // Ruby red/pink
    border: 'border-pink-600/60 dark:border-pink-500/40',
    borderHover: 'group-hover:border-pink-500/80 dark:group-hover:border-pink-400/60',
    bg: 'bg-pink-500/5 dark:bg-transparent',
    text: 'text-pink-700 dark:text-pink-400',
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
    glow: 'shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40',
    gradient: 'from-rose-500 to-pink-600',
    label: 'Ruby',
  },
  DIAMOND: {
    // Diamond cyan/blue
    border: 'border-cyan-600/60 dark:border-cyan-500/40',
    borderHover: 'group-hover:border-cyan-500/80 dark:group-hover:border-cyan-400/60',
    bg: 'bg-cyan-500/5 dark:bg-transparent',
    text: 'text-cyan-700 dark:text-cyan-400',
    iconBg: 'bg-gradient-to-br from-cyan-400 to-blue-600',
    glow: 'shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40',
    gradient: 'from-cyan-400 to-blue-600',
    label: 'Diamond',
  },
  MASTERY: {
    // EPIC Mastery tier - lavender/violet with blue gradients!
    border: 'border-violet-400/80 dark:border-violet-300/60',
    borderHover: 'group-hover:border-violet-300 dark:group-hover:border-violet-200',
    bg: 'bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-blue-500/10',
    text: 'text-violet-400 dark:text-violet-300',
    iconBg: 'bg-gradient-to-br from-violet-500 via-purple-500 via-indigo-500 to-blue-600',
    glow: 'shadow-2xl shadow-violet-500/60 hover:shadow-violet-400/80',
    gradient: 'from-violet-500 via-purple-500 via-indigo-500 to-blue-600',
    label: 'Mastery',
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
    clock: Clock,
    sun: Sun,
    moon: Moon,
    calendar: Calendar,
    search: Search,
    heart: Heart,
    globe: Globe,
    layers: Layers,
    'graduation-cap': GraduationCap,
    library: Library,
    'file-text': FileText,
    'share-2': Share2,
  };
  return icons[iconName.toLowerCase()] || Trophy;
};

// Category configurations with icons
const CATEGORY_CONFIG = {
  study: {
    title: 'Study Skills',
    icon: BookOpen,
    description: 'Master your study habits and dedication',
    gradient: 'from-blue-500 to-cyan-500',
  },
  social: {
    title: 'Social',
    icon: Users,
    description: 'Share knowledge and collaborate',
    gradient: 'from-pink-500 to-rose-500',
  },
  skill: {
    title: 'Skill',
    icon: Brain,
    description: 'Demonstrate mastery and precision',
    gradient: 'from-purple-500 to-indigo-500',
  },
  streak: {
    title: 'Consistency',
    icon: Flame,
    description: 'Build lasting study habits',
    gradient: 'from-orange-500 to-red-500',
  },
  content: {
    title: 'Content Creation',
    icon: FileText,
    description: 'Create and organize learning materials',
    gradient: 'from-emerald-500 to-teal-500',
  },
  mastery: {
    title: 'Mastery',
    icon: Crown,
    description: 'Ultimate achievements for dedication',
    gradient: 'from-yellow-500 to-amber-500',
  },
};

// --- Components ---

interface LevelBannerProps {
  level: number;
  currentXp: number;
  xpForNextLevel: number;
  totalXp: number;
}

const LevelBanner = ({ level, currentXp, xpForNextLevel, totalXp }: LevelBannerProps) => {
  const progress = (currentXp / xpForNextLevel) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/40 dark:bg-zinc-950/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg mb-8"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* Level Badge */}
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-lg shadow-blue-500/50">
              <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-wide">Level</div>
                  <div className="text-3xl font-bold text-white">{level}</div>
                </div>
              </div>
            </div>
            {/* Animated ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(59, 130, 246, 0.5), transparent)',
                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                maskComposite: 'exclude',
                padding: '2px',
              }}
            />
          </div>
        </div>

        {/* Progress Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white">Level {level}</h3>
              <p className="text-slate-400 text-sm">
                {Math.floor(currentXp).toLocaleString()} / {Math.floor(xpForNextLevel).toLocaleString()} XP
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Total XP Earned</div>
              <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                {Math.floor(totalXp).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-4 bg-zinc-800/50 rounded-full overflow-hidden border border-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 relative overflow-hidden shadow-lg shadow-blue-500/30"
            >
              {/* Animated shine effect */}
              <motion.div
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12"
              />
            </motion.div>
            {/* Progress text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-lg">
                {Math.round(progress)}%
              </span>
            </div>
          </div>

          {/* Next level indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span>
              {Math.floor(xpForNextLevel - currentXp).toLocaleString()} XP until Level {level + 1}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AchievementCardProps {
  achievement: UserAchievement;
  index: number; // For determining left/right positioning
}

const AchievementCard = ({ achievement }: Omit<AchievementCardProps, 'index'>) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState<'left' | 'right'>('right');
  const [selectedTierIndex, setSelectedTierIndex] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  const Icon = getIcon(achievement.definition.icon);
  const isMastery = achievement.definition.category === 'mastery';

  // Determine effective current tier code for the CARD (always current)
  // Logic: Locked -> Bronze (or Mastery if category is mastery), Unlocked -> achievement.currentTier or MASTERY
  let currentTierCode: AchievementTier = achievement.currentTier || 'BRONZE';
  if (isMastery) {
     // Force mastery visual if it's a mastery achievement
     currentTierCode = 'MASTERY'; 
  } else if (!achievement.unlocked) {
     currentTierCode = 'BRONZE';
  }
  
  const tier = TIER_CONFIG[currentTierCode];
  const isLocked = !achievement.unlocked;
  const formattedDate = achievement.unlockedAt 
    ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Get tier history (BRONZE -> SILVER -> ... -> CURRENT)
  const tierHistory: AchievementTier[] = React.useMemo(() => {
    if (isMastery) return ['MASTERY'];
    
    // Explicit progression order
    const PROGRESS_ORDER: AchievementTier[] = ['BRONZE', 'SILVER', 'GOLD', 'RUBY', 'DIAMOND'];
    
    // If locked or no tier, show Bronze
    if (!achievement.currentTier) return ['BRONZE'];

    const currentIdx = PROGRESS_ORDER.indexOf(achievement.currentTier);
    if (currentIdx === -1) return ['BRONZE'];

    // Return all tiers up to current
    return PROGRESS_ORDER.slice(0, currentIdx + 1);
  }, [achievement.currentTier, isMastery]);

  React.useEffect(() => {
    if (showTooltip) {
      // Reset to highest unlocked tier when opening tooltip
      setSelectedTierIndex(tierHistory.length - 1);
    }
  }, [showTooltip, tierHistory.length]);

  // Determine config for the TOOLTIP (based on selected history)
  const viewedTierCode = tierHistory[selectedTierIndex] || currentTierCode;
  const tooltipTier = TIER_CONFIG[viewedTierCode];

  // Horizontal tooltip positioning based on card position
  React.useEffect(() => {
    if (showTooltip && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = 340; // Estimated tooltip width (w-80 is 320px + padding/border)
      const margin = 20;

      // Simple space check - prefer right if it fits, otherwise left
      const spaceRight = window.innerWidth - rect.right;
      
      if (spaceRight >= tooltipWidth + margin) {
        setTooltipPosition('right');
      } else {
        setTooltipPosition('left');
      }
    }
  }, [showTooltip]);
  
  // Keyboard navigation for tier cycling with A/D support
  React.useEffect(() => {
    if (!showTooltip || tierHistory.length <= 1) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setSelectedTierIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        setSelectedTierIndex((prev) => Math.min(tierHistory.length - 1, prev + 1));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTooltip, tierHistory.length]);

  return (
    <motion.div
      ref={cardRef}
      className="relative group"
      onHoverStart={() => setShowTooltip(true)}
      onHoverEnd={() => setShowTooltip(false)}
      whileHover={{ scale: 1.1, zIndex: 50 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
    >
      {/* Main Square Icon Card (Uses 'tier' - the current status) */}
      <div
        className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isLocked
            ? 'border-slate-400/40 dark:border-slate-600/40 bg-slate-100/50 dark:bg-slate-900/30 shadow-sm grayscale opacity-60'
            : `${tier.border} ${tier.borderHover} ${tier.bg} ${tier.glow}`
        }`}
      >
        {/* Subtle background glow for unlocked */}
        {!isLocked && (
          <motion.div
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} opacity-20 blur-lg`}
          />
        )}

        {/* Diamond pulse animation */}
        {!isLocked && achievement.currentTier === 'DIAMOND' && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-500/20"
          />
        )}
        
        {/* EPIC Mastery animations */}
        {!isLocked && isMastery && (
          <>
            {/* Outer glow pulse */}
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-br from-violet-500/30 via-purple-500/30 to-blue-500/30 blur-xl"
            />
            {/* Inner shimmer */}
            <motion.div
              animate={{ 
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.05, 1],
                rotate: [0, 5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-br from-violet-400/20 via-purple-400/20 via-indigo-400/20 to-blue-500/20"
            />
            {/* Sparkle effect */}
            <motion.div
              animate={{ 
                opacity: [0, 0.8, 0],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
            />
          </>
        )}

        {/* Shimmer effect on hover for unlocked */}
        {!isLocked && showTooltip && (
          <>
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 dark:via-white/20 to-transparent transform -skew-x-12 blur-sm"
            />
          </>
        )}

        {/* Achievement Icon */}
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center relative z-20 transition-all duration-300 ${
            isLocked 
              ? 'bg-slate-300/50 dark:bg-slate-700/50 opacity-40' 
              : `${tier.iconBg} shadow-xl group-hover:scale-110`
          }`}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 text-slate-400 dark:text-slate-600" />
          ) : (
            <Icon className="w-6 h-6 text-white drop-shadow-lg" />
          )}
        </div>
      </div>

      {/* Horizontal Tooltip with Tier-Specific Colors (Uses 'tooltipTier') */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: tooltipPosition === 'left' ? 10 : -10, y: "-50%", scale: 0.95 }}
          animate={{ opacity: 1, x: 0, y: "-50%", scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`absolute ${
            tooltipPosition === 'left' ? 'right-full mr-4' : 'left-full ml-4'
          } top-1/2 w-80 pointer-events-auto z-[100]`}
        >
          <div className="relative">
            {/* Tooltip arrow with tier-specific gradient matching TIER_THEMES */}
            <div 
              className={`absolute ${
                tooltipPosition === 'left' ? '-right-1.5' : '-left-1.5'
              } top-1/2 -translate-y-1/2 w-3 h-3 ${
                tooltipPosition === 'left' ? 'rotate-45' : '-rotate-45'
              } bg-gradient-to-br ${
                isLocked 
                  ? 'from-slate-500 to-slate-600'
                  : isMastery
                    ? 'from-violet-500 to-purple-600'
                    : viewedTierCode === 'BRONZE'
                      ? 'from-orange-500 to-amber-600'
                      : viewedTierCode === 'SILVER'
                        ? 'from-slate-400 to-zinc-500'
                        : viewedTierCode === 'GOLD'
                          ? 'from-yellow-400 to-amber-500'
                          : viewedTierCode === 'RUBY'
                            ? 'from-red-500 to-pink-600'
                            : 'from-cyan-400 to-blue-500'
              }`}
            />
            
            {/* Tooltip content with tier-specific border matching notification TIER_THEMES */}
            <div className={`relative rounded-xl overflow-hidden border-2 ${
              isLocked 
                ? 'border-slate-500/30 shadow-xl shadow-slate-500/10'
                : isMastery
                  ? 'border-violet-400/50 shadow-2xl shadow-violet-500/30'
                  : viewedTierCode === 'BRONZE'
                    ? 'border-orange-500/30 shadow-2xl shadow-orange-500/20'
                    : viewedTierCode === 'SILVER'
                      ? 'border-slate-400/30 shadow-2xl shadow-slate-400/20'
                      : viewedTierCode === 'GOLD'
                        ? 'border-yellow-400/30 shadow-2xl shadow-yellow-400/20'
                        : viewedTierCode === 'RUBY'
                          ? 'border-red-500/30 shadow-2xl shadow-red-500/20'
                          : 'border-cyan-400/30 shadow-2xl shadow-cyan-400/20'
            }`}>
              {/* Content background with better contrast */}
              <div className="relative bg-slate-900/98 dark:bg-slate-800/98 backdrop-blur-xl rounded-xl overflow-hidden">
                {/* Top gradient accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${
                  isLocked 
                    ? 'from-slate-500 to-slate-600'
                    : isMastery
                      ? 'from-violet-500 via-purple-500 to-blue-600'
                      : viewedTierCode === 'BRONZE'
                        ? 'from-orange-500 to-amber-600'
                        : viewedTierCode === 'SILVER'
                          ? 'from-slate-400 to-zinc-500'
                          : viewedTierCode === 'GOLD'
                            ? 'from-yellow-400 to-amber-500'
                            : viewedTierCode === 'RUBY'
                              ? 'from-red-500 to-pink-600'
                              : 'from-cyan-400 to-blue-500'
                }`} />
                
                <div className="p-5">
                {/* Tier badge and title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-white mb-1.5 flex items-center gap-2 leading-tight">
                      {isLocked && <Lock className="w-4 h-4 text-slate-400" />}
                      {achievement.definition.name}
                    </h4>
                    {!isLocked && (
                      <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${tooltipTier.gradient} text-white uppercase tracking-widest shadow-lg ring-1 ring-white/30`}>
                        {tooltipTier.label}
                      </span>
                    )}
                  </div>
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                    isLocked ? 'bg-slate-700/50' : tooltipTier.iconBg
                  } shadow-lg`}>
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-sm text-slate-200 dark:text-slate-300 mb-4 leading-relaxed">
                  {achievement.definition.description}
                </p>

                {/* Interactive Tier Viewer - Only show if unlocked and has multiple levels */}
                {!isLocked && tierHistory.length > 1 && (
                  <div className="mb-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Tier History ({selectedTierIndex + 1}/{tierHistory.length})
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">Use arrow keys or A/D</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTierIndex((prev) => Math.max(0, prev - 1));
                          }}
                          disabled={selectedTierIndex === 0}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-700/70 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors text-white"
                        >
                          ←
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTierIndex((prev) => Math.min(tierHistory.length - 1, prev + 1));
                          }}
                          disabled={selectedTierIndex === tierHistory.length - 1}
                          className="px-2.5 py-1 text-xs font-medium bg-slate-700/70 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors text-white"
                        >
                          →
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const displayTier = tierHistory[selectedTierIndex];
                      const displayConfig = TIER_CONFIG[displayTier];
                      const threshold = achievement.definition.thresholds?.[displayTier];
                      const xpReward = achievement.definition.xpRewards?.[displayTier];

                      return (
                        <motion.div
                          key={displayTier}
                          initial={{ opacity: 0, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`p-4 rounded-lg bg-gradient-to-br ${displayConfig.gradient} bg-opacity-10 border-2 ${displayConfig.border}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-bold ${displayConfig.text}`}>
                              {displayConfig.label} Tier
                            </span>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-full bg-gradient-to-r ${displayConfig.gradient} text-white shadow-lg ring-1 ring-white/20`}>
                              <Zap className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                              +{xpReward ? Math.floor(xpReward).toLocaleString() : '0'} XP
                            </span>
                          </div>
                          <div className="text-xs text-slate-200 font-medium">
                            Required: {threshold ? Math.floor(threshold).toLocaleString() : '0'}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </div>
                )}

                {/* Progress Section - Enhanced with current tier color */}
                {(() => {
                  const PROGRESS_ORDER: AchievementTier[] = ['BRONZE', 'SILVER', 'GOLD', 'RUBY', 'DIAMOND'];
                  
                  // Determine next tier and current tier for display
                  let nextTier: AchievementTier | null = null;
                  let displayTierConfig = null;
                  let isLockedProgress = false;
                  
                  if (isLocked) {
                    // Locked - show progress toward Bronze with gray bar
                    nextTier = 'BRONZE';
                    isLockedProgress = true;
                    displayTierConfig = TIER_CONFIG['BRONZE']; // Use bronze config for locked
                  } else if (achievement.currentTier && !isMastery) {
                    // Unlocked - use CURRENT tier color for the bar
                    displayTierConfig = TIER_CONFIG[achievement.currentTier];
                    // Find next tier after current
                    const currentIndex = PROGRESS_ORDER.indexOf(achievement.currentTier);
                    if (currentIndex !== -1 && currentIndex < PROGRESS_ORDER.length - 1) {
                      nextTier = PROGRESS_ORDER[currentIndex + 1];
                    }
                  }
                  
                  if (!nextTier || !achievement.definition.thresholds || !displayTierConfig) return null;
                  
                  const nextTierConfig = TIER_CONFIG[nextTier];
                  const threshold = achievement.definition.thresholds[nextTier];
                  const xpReward = achievement.definition.xpRewards?.[nextTier];
                  
                  if (!threshold) return null;
                  
                  const currentValue = achievement.currentValue || 0;
                  const progress = Math.min(100, (currentValue / threshold) * 100);
                  
                  return (
                    <div className="mb-4">
                      <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3.5">
                        {isLockedProgress ? 'Progress to Unlock' : `Progress to ${nextTierConfig.label}`}
                      </h5>
                      <div className="space-y-3">
                        {/* Info Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`text-sm font-bold flex items-center gap-1.5 ${
                              isLockedProgress 
                                ? 'text-amber-400' 
                                : nextTierConfig.text
                            }`}>
                              {isLockedProgress && <Trophy className="w-4 h-4" />}
                              {nextTierConfig.label} Tier
                            </span>
                            {xpReward && (
                              <span className={`text-[10px] px-2 py-1.5 rounded-md font-black flex items-center gap-1 ${
                                isLockedProgress 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : `bg-gradient-to-r ${nextTierConfig.gradient} text-white shadow-md ring-1 ring-white/20`
                              }`}>
                                <Zap className="w-3 h-3" />
                                +{Math.floor(xpReward).toLocaleString()} XP
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-bold ${
                            isLockedProgress ? 'text-slate-400' : 'text-slate-200'
                          }`}>
                            {Math.floor(currentValue).toLocaleString()} / {Math.floor(threshold).toLocaleString()}
                          </span>
                        </div>
                        
                        {/* Enhanced Progress Bar */}
                        <div className="relative">
                          {/* Outer glow effect */}
                          <div className={`absolute -inset-0.5 bg-gradient-to-r ${
                            isLockedProgress ? 'from-slate-500 to-slate-600' : displayTierConfig.gradient
                          } rounded-full opacity-20 blur-md`} />
                          
                          {/* Progress bar container */}
                          <div className="relative h-4 bg-slate-900/80 rounded-full overflow-hidden border-2 border-slate-700/50 shadow-inner">
                            {/* Background pattern */}
                            <div className="absolute inset-0 opacity-5">
                              <div className="absolute inset-0" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                              }} />
                            </div>
                            
                            {/* Actual progress fill */}
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                              className={`h-full relative ${
                                isLockedProgress
                                  ? 'bg-gradient-to-r from-slate-500 via-slate-400 to-slate-500'
                                  : `bg-gradient-to-r ${displayTierConfig.gradient}`
                              } shadow-lg`}
                            >
                              {/* Animated shine effect */}
                              {progress > 0 && (
                                <motion.div
                                  animate={{ x: ['-100%', '200%'] }}
                                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent transform skew-x-12"
                                />
                              )}
                              
                              {/* Inner highlight */}
                              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent h-1/2" />
                            </motion.div>
                            
                            {/* Progress percentage text overlay */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wide">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}  
                
                {/* Unlock date */}
                {!isLocked && formattedDate && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-700/50">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Unlocked on {formattedDate}</span>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- Main Page Component ---

export default function Achievements() {
  const { user } = useAuth();
  const { setHideSidebar, setCustomHeaderContent } = useLayout();
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);

  // CRITICAL: Clear custom header on mount
  useEffect(() => {
    setHideSidebar(false);
    setCustomHeaderContent(null);
  }, [setHideSidebar, setCustomHeaderContent]);

  // Fetch achievements from backend
  const { data: achievements, isLoading, error } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      const response = await api.get('/progress/achievements');
      return response.data as UserAchievement[];
    },
    enabled: !!user?.id,
  });

  // Fetch user progress stats for level banner
  const { data: progressStats } = useQuery<{
    level: number;
    currentXp: number;
    xpForNextLevel: number;
    totalXp: number;
    streak: number;
  }>({
    queryKey: ['progress-stats', user?.id],
    queryFn: async () => {
      const res = await api.get('/progress/stats');
      // Map API response to component props
      return {
        level: res.data.xp.level,
        currentXp: res.data.xp.currentLevelXp,
        xpForNextLevel: res.data.xp.nextLevelXp,
        totalXp: res.data.xp.total,
        streak: res.data.streak.current,
      };
    },
    enabled: !!user?.id,
  });

  // Add unlocked property based on unlockedAt field
  const enrichedAchievements = achievements?.map(achievement => ({
    ...achievement,
    unlocked: achievement.unlockedAt !== null,
  })) || [];

  // Group achievements by category
  const achievementsByCategory = React.useMemo(() => {
    const grouped: Record<string, UserAchievement[]> = {};
    
    enrichedAchievements.forEach((achievement) => {
      const category = achievement.definition.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(achievement);
    });
    
    // Sort each category by tier (highest first) and then by unlocked status
    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => {
        // Unlocked first
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        
        // Then by tier
        if (a.currentTier && b.currentTier) {
          return TIER_ORDER.indexOf(a.currentTier) - TIER_ORDER.indexOf(b.currentTier);
        }
        
        return 0;
      });
    });
    
    return grouped;
  }, [enrichedAchievements]);

  const handleShare = () => {
    setIsShareModalOpen(true);
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
          <Button onClick={handleShare} className="gap-2" variant="primary">
            <Share2 className="w-4 h-4" />
            Share Profile
          </Button>
        }
      >
        Achievements
      </PageContainer.Header>

      <PageContainer.Section>
        <div className="space-y-8 pb-32">
          {/* Level Banner */}
          {progressStats && (
            <LevelBanner
              level={progressStats.level}
              currentXp={progressStats.currentXp}
              xpForNextLevel={progressStats.xpForNextLevel}
              totalXp={progressStats.totalXp}
            />
          )}

          {/* Categorized Achievement Grids */}
          {Object.entries(achievementsByCategory).length > 0 ? (
            <div className="space-y-12">
              {Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => {
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                const CategoryIcon = config?.icon || Trophy;
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-4"
                  >
                    {/* Category Header */}
                    <div className="flex items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {config?.title || category}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {config?.description || 'Achievement category'}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {categoryAchievements.filter((a) => a.unlocked).length} / {categoryAchievements.length} unlocked
                      </div>
                    </div>

                    {/* Achievement Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6">
                      {categoryAchievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
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

      {/* Share Modal */}
      {user && (
        <ShareProfileModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          user={{
            username: user.username,
            avatarUrl: user.avatarUrl,
            xp: progressStats?.totalXp || 0,
            level: progressStats?.level || 1
          }}
          achievements={enrichedAchievements} 
        />
      )}
    </PageContainer>
  );
}
