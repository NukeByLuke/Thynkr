import React from 'react';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { motion } from 'framer-motion';
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
  thresholds?: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    RUBY: number;
    DIAMOND?: number;
  };
  xpRewards?: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
    RUBY: number;
    DIAMOND?: number;
  };
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
    // Ruby red/pink (renamed from PLATINUM)
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
  PLATINUM: {
    // Legacy Platinum (keeping for backwards compatibility)
    border: 'border-slate-400/60 dark:border-slate-500/40',
    borderHover: 'group-hover:border-slate-300/80 dark:group-hover:border-slate-400/60',
    bg: 'bg-slate-500/5 dark:bg-transparent',
    text: 'text-slate-700 dark:text-slate-300',
    iconBg: 'bg-gradient-to-br from-slate-400 to-slate-600',
    glow: 'shadow-lg shadow-slate-400/20 hover:shadow-slate-400/40',
    gradient: 'from-slate-400 to-slate-600',
    label: 'Platinum',
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
                {progress.toFixed(1)}%
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

const AchievementCard = ({ achievement, index }: AchievementCardProps) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPosition, setTooltipPosition] = React.useState<'left' | 'right'>('right');
  const [selectedTierIndex, setSelectedTierIndex] = React.useState(0);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  const Icon = getIcon(achievement.definition.icon);
  const tier = achievement.currentTier ? TIER_CONFIG[achievement.currentTier] : TIER_CONFIG.BRONZE;
  const isLocked = !achievement.unlocked;
  const formattedDate = achievement.unlockedAt 
    ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  // Get tier history (all tiers up to current) - moved inside useMemo
  const tierHistory = React.useMemo(() => {
    if (!achievement.currentTier) return [];
    const tierIndex = TIER_ORDER.indexOf(achievement.currentTier);
    return TIER_ORDER.slice(0, tierIndex + 1).reverse();
  }, [achievement.currentTier]);

  // Horizontal tooltip positioning based on card position
  React.useEffect(() => {
    if (showTooltip && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // Estimated tooltip width
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;
      const margin = 16;
      
      // Determine grid column (0-indexed) - assuming 10 columns on large screens
      const columnIndex = index % 10;
      
      // Show on right for left half (columns 0-4), left for right half (columns 5-9)
      if (columnIndex < 5) {
        // Left side of grid - show tooltip on right
        setTooltipPosition(spaceRight > tooltipWidth + margin ? 'right' : 'left');
      } else {
        // Right side of grid - show tooltip on left
        setTooltipPosition(spaceLeft > tooltipWidth + margin ? 'left' : 'right');
      }
      
      // Reset to first tier when tooltip opens
      setSelectedTierIndex(0);
    }
  }, [showTooltip, index]);
  
  // Keyboard navigation for tier cycling
  React.useEffect(() => {
    if (!showTooltip || tierHistory.length === 0) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedTierIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
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
      {/* Main Square Icon Card */}
      <div
        className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
          isLocked
            ? 'border-slate-300/50 dark:border-slate-700/50 bg-slate-100/50 dark:bg-slate-900/30 shadow-sm grayscale opacity-60'
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
        {!isLocked && achievement.definition.category === 'mastery' && (
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
            <motion.div
              initial={{ x: '-150%' }}
              animate={{ x: '250%' }}
              transition={{ duration: 0.6, ease: 'easeInOut', delay: 0.1 }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/70 dark:via-white/30 to-transparent transform -skew-x-12"
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

      {/* Horizontal Tooltip with Tier-Specific Colors */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: tooltipPosition === 'left' ? 10 : -10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`absolute ${
            tooltipPosition === 'left' ? 'right-full mr-4' : 'left-full ml-4'
          } top-1/2 -translate-y-1/2 w-80 pointer-events-auto z-[100]`}
        >
          <div className="relative">
            {/* Tooltip arrow with tier-specific color */}
            <div 
              className={`absolute ${
                tooltipPosition === 'left' ? '-right-1.5' : '-left-1.5'
              } top-1/2 -translate-y-1/2 w-3 h-3 ${
                tooltipPosition === 'left' ? 'rotate-45' : '-rotate-45'
              } bg-gradient-to-br ${tier.gradient}`}
            />
            
            {/* Tooltip content with tier-specific border */}
            <div className={`relative rounded-xl shadow-2xl overflow-hidden border-2 ${tier.border} ${
              achievement.definition.category === 'mastery' ? 'border-violet-400/80 shadow-violet-500/50' : ''
            }`}>
              {/* Content background with better contrast */}
              <div className="relative bg-slate-900/98 dark:bg-slate-800/98 backdrop-blur-xl rounded-xl p-5">
                {/* Tier badge and title */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-white mb-1.5 flex items-center gap-2 leading-tight">
                      {isLocked && <Lock className="w-4 h-4 text-slate-400" />}
                      {achievement.definition.name}
                    </h4>
                    {!isLocked && (
                      <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r ${tier.gradient} text-white uppercase tracking-widest shadow-lg ring-1 ring-white/30`}>
                        {tier.label}
                      </span>
                    )}
                  </div>
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                    isLocked ? 'bg-slate-700/50' : tier.iconBg
                  } shadow-lg`}>
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : (
                      <Icon className="w-5 h-5 text-white" />
                    )}
                  </div>
                </div>
                
                {/* Description with better readability */}
                <p className="text-sm text-slate-200 dark:text-slate-300 mb-4 leading-relaxed">
                  {achievement.definition.description}
                </p>

                {/* Interactive Tier Viewer - Only show if unlocked and has history */}
                {!isLocked && tierHistory.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Tier History ({selectedTierIndex + 1}/{tierHistory.length})
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5">Use arrow keys to navigate</p>
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
                      // Check if mastery using definition category instead
                      const isMasteryCat = achievement.definition.category === 'mastery';
                      return (
                        <motion.div
                          key={displayTier}
                          initial={{ opacity: 0, x: selectedTierIndex > 0 ? -10 : 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`p-4 rounded-lg bg-gradient-to-br ${displayConfig.gradient} bg-opacity-10 border-2 ${displayConfig.border} ${
                            isMasteryCat ? 'shadow-lg shadow-violet-500/30' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-base font-bold ${displayConfig.text} ${
                              isMasteryCat ? 'text-violet-300' : ''
                            }`}>
                              {displayConfig.label} Tier
                            </span>
                            <span className={`text-xs font-bold text-white px-2.5 py-1 rounded-full ${
                              isMasteryCat ? 'bg-gradient-to-r from-violet-600 to-blue-600' : 'bg-black/30'
                            }`}>
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
                
                {/* Progress section */}
                {achievement.progress && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className={isLocked ? 'text-slate-400' : 'text-slate-300'}>
                        {isLocked ? 'Locked' : 'Progress'}
                      </span>
                      <span className={isLocked ? 'text-slate-400' : 'text-white'}>
                        {isLocked ? '0%' : `${Math.round(achievement.progress.percentage)}%`}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${isLocked ? 0 : achievement.progress.percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full bg-gradient-to-r ${tier.gradient} shadow-lg relative overflow-hidden`}
                      >
                        {!isLocked && achievement.progress.percentage > 0 && (
                          <motion.div
                            animate={{ x: ['0%', '100%'] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          />
                        )}
                      </motion.div>
                    </div>
                    {achievement.progress.current !== undefined && achievement.progress.required && (
                      <div className="text-xs text-slate-300 dark:text-slate-400 text-center pt-1 font-medium">
                        {Math.floor(achievement.progress.current).toLocaleString()} / {Math.floor(achievement.progress.required).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
                
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
        </motion.div>
      )}
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
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config?.gradient || 'from-slate-500 to-slate-700'} flex items-center justify-center shadow-lg`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
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
                      {categoryAchievements.map((achievement, idx) => (
                        <AchievementCard key={achievement.id} achievement={achievement} index={idx} />
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

      {/* Hidden Export Component */}
      <PlayerCardExport user={user} achievements={enrichedAchievements} />
    </PageContainer>
  );
}
