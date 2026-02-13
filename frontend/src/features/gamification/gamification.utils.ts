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

export type AchievementTier = 'COPPER' | 'GOLD' | 'RUBY' | 'DIAMOND' | 'AMETHYST' | 'MASTERY';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
  thresholds?: {
    COPPER: number;
    GOLD: number;
    RUBY: number;
    DIAMOND: number;
    AMETHYST: number;
    MASTERY?: number;
  };
  xpRewards?: {
    COPPER: number;
    GOLD: number;
    RUBY: number;
    DIAMOND: number;
    AMETHYST: number;
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

export const TIER_ORDER: AchievementTier[] = ['MASTERY', 'AMETHYST', 'DIAMOND', 'RUBY', 'GOLD', 'COPPER'];

export const TIER_CONFIG = {
  COPPER: {
    border: 'border-amber-700/60 dark:border-amber-600/40',
    borderHover: 'group-hover:border-amber-600/80 dark:group-hover:border-amber-500/60',
    bg: 'bg-orange-500/5 dark:bg-transparent',
    text: 'text-amber-800 dark:text-amber-400',
    iconBg: 'bg-gradient-to-br from-amber-600 to-orange-700',
    glow: 'shadow-lg shadow-amber-600/20 hover:shadow-amber-600/40',
    gradient: 'from-amber-700 to-orange-600', 
    label: 'Copper',
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
    border: 'border-red-600/60 dark:border-red-500/40',
    borderHover: 'group-hover:border-red-500/80 dark:group-hover:border-red-400/60',
    bg: 'bg-red-500/5 dark:bg-transparent',
    text: 'text-red-700 dark:text-red-400',
    iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
    glow: 'shadow-lg shadow-red-500/20 hover:shadow-red-500/40',
    gradient: 'from-red-500 to-rose-600',
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
  AMETHYST: {
    border: 'border-purple-600/60 dark:border-purple-500/40',
    borderHover: 'group-hover:border-purple-500/80 dark:group-hover:border-purple-400/60',
    bg: 'bg-purple-500/5 dark:bg-transparent',
    text: 'text-purple-700 dark:text-purple-400',
    iconBg: 'bg-gradient-to-br from-purple-600 to-violet-700',
    glow: 'shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40',
    gradient: 'from-purple-600 to-violet-700',
    label: 'Amethyst',
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
    gradient: 'from-violet-500 to-indigo-500',
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
