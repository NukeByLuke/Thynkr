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

export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'RUBY' | 'DIAMOND' | 'MASTERY';

export interface AchievementDefinition {
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

export interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  currentTier: AchievementTier; 
  currentValue: number;
  unlockedAt: Date | string | null;
  updatedAt: Date | string;
  definition: AchievementDefinition;
  progress: {
    current: number;
    required: number;
    percentage: number;
  } | null;
  unlocked: boolean;
}

export const TIER_ORDER: AchievementTier[] = ['MASTERY', 'DIAMOND', 'RUBY', 'GOLD', 'SILVER', 'BRONZE'];

export const TIER_CONFIG = {
  BRONZE: {
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

export const getIcon = (iconName: string) => {
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

export const CATEGORY_CONFIG = {
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
