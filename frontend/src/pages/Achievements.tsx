// import { useState } from 'react'; // Removed unused import
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
  Users,
  Brain,
  Rocket
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button'; 
import toast from 'react-hot-toast';

// --- Types ---
type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'RUBY';

interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // We'll map string names to Lucide icons
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
  xpRewards?: Record<AchievementTier, number>;
}

interface UserAchievement {
  id: string;
  currentTier: AchievementTier;
  currentValue: number;
  definition: AchievementDefinition;
  progress: {
    current: number;
    required: number;
    percentage: number;
  } | null;
}

// --- Config ---

const TIER_ORDER: AchievementTier[] = ['RUBY', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

const TIER_CONFIG = {
  BRONZE: {
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-900',
    gradient: 'from-orange-400 to-amber-600',
    label: 'Bronze',
  },
  SILVER: {
    color: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    border: 'border-slate-200 dark:border-slate-700',
    gradient: 'from-slate-300 to-slate-500',
    label: 'Silver',
  },
  GOLD: {
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-100 dark:bg-yellow-950/40',
    border: 'border-yellow-200 dark:border-yellow-900',
    gradient: 'from-yellow-400 to-amber-500',
    label: 'Gold',
  },
  PLATINUM: {
    color: 'text-cyan-700 dark:text-cyan-400',
    bg: 'bg-cyan-100 dark:bg-cyan-950/40',
    border: 'border-cyan-200 dark:border-cyan-900',
    gradient: 'from-cyan-400 to-blue-500',
    label: 'Platinum',
  },
  RUBY: {
    color: 'text-rose-700 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-900',
    gradient: 'from-rose-500 to-red-600',
    label: 'Ruby',
  },
};

const CATEGORY_MAP: Record<string, { label: string; icon: any }> = {
  study: { label: 'General Study', icon: BookOpen },
  social: { label: 'Community', icon: Users },
  skill: { label: 'Skills', icon: Brain },
  streak: { label: 'Study Streak', icon: Flame },
  content: { label: 'Content', icon: Zap },
  mastery: { label: 'Mastery', icon: Crown },
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
    'message-circle': Users,
    'file-text': BookOpen,
  };
  return icons[iconName.toLowerCase()] || Trophy;
};

// --- Components ---

const AchievementCard = ({ achievement }: { achievement: UserAchievement }) => {
  const Icon = getIcon(achievement.definition.icon);
  const tier = TIER_CONFIG[achievement.currentTier];
  const progress = achievement.progress?.percentage || 0;

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${tier.bg} ${tier.border} transition-transform hover:scale-[1.02] duration-200`}>
      {/* Icon with Gradient Background */}
      <div className={`shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br ${tier.gradient} flex items-center justify-center text-white shadow-sm`}>
        <Icon className="w-6 h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <h4 className={`font-semibold text-sm truncate pr-2 ${tier.color}`}>
            {achievement.definition.name}
          </h4>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/20 ${tier.color} uppercase tracking-wider`}>
            {tier.label}
          </span>
        </div>
        
        <p className="text-xs text-slate-600 dark:text-slate-400 truncate mb-2">
          {achievement.definition.description}
        </p>

        {/* Compact Progress Bar */}
        <div className="w-full h-1.5 bg-white/40 dark:bg-black/10 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${tier.gradient}`} 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Hidden Component for Export
const PlayerCardExport = ({ 
  user, 
  achievements 
}: { 
  user: any, 
  achievements: UserAchievement[] 
}) => {
  // Sort by Tier (Ruby -> Bronze)
  const sortedAchievements = [...achievements].sort((a, b) => {
    return TIER_ORDER.indexOf(a.currentTier) - TIER_ORDER.indexOf(b.currentTier);
  });

  return (
    <div 
      id="player-card-export" 
      className="fixed left-[-9999px] top-0 w-[800px] bg-slate-900 text-white p-8 rounded-3xl overflow-hidden font-sans"
    >
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-6 mb-8 border-b border-white/10 pb-6">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-600 p-[2px]">
          <img 
            src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`} 
            alt="Avatar" 
            className="w-full h-full rounded-2xl bg-slate-800 object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold">{user?.username || 'Thynkr Student'}</h2>
          <div className="flex items-center gap-3 mt-2">
             <span className="px-3 py-1 rounded-full bg-white/10 text-sm font-medium border border-white/5">
                Level {Math.floor((user?.xp || 0) / 1000) + 1}
             </span>
             <span className="text-slate-400 text-sm">
                {achievements.length} Achievements Unlocked
             </span>
          </div>
        </div>
        <div className="ml-auto">
            <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
      </div>

      {/* Checkerboard Grid */}
      <div className="relative z-10">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Achievement Showcase</h3>
        <div className="grid grid-cols-8 gap-3">
          {sortedAchievements.map((achievement) => {
             const Icon = getIcon(achievement.definition.icon);
             const tier = TIER_CONFIG[achievement.currentTier];
             return (
               <div 
                 key={achievement.id} 
                 className={`aspect-square rounded-xl bg-gradient-to-br ${tier.gradient} flex items-center justify-center shadow-lg relative group border border-white/10`}
               >
                 <Icon className="w-6 h-6 text-white drop-shadow-md" />
                 {/* Tier Indicator Dot */}
                 <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white/80 ring-1 ring-black/20 shadow-sm" />
               </div>
             );
          })}
          {/* Fill empty spots for visual balance if needed (minimum of 8 slots to look like a row) */}
          {Array.from({ length: Math.max(0, 8 - (sortedAchievements.length % 8 === 0 && sortedAchievements.length > 0 ? 0 : sortedAchievements.length % 8)) }).map((_, i) => (
             <div key={`empty-${i}`} className="aspect-square rounded-xl bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 pt-4 flex justify-between items-center text-xs text-slate-500 border-t border-white/5">
        <span>Generated by Thynkr.ai</span>
        <span>{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
};

// --- Main Page Component ---

export default function Achievements() {
  const { user } = useAuth();
  
  // Mock Data (Replace with API call)
  const { data: stats } = useQuery({
    queryKey: ['achievements', user?.id],
    queryFn: async () => {
      // Keep existing mock structure for now until API is live
      return {
        xp: 12500,
        level: 12,
        achievements: [
          {
             id: '1', currentTier: 'GOLD', currentValue: 100, 
             definition: { id: 'def1', name: 'Study Master', description: 'Study for 100 hours', icon: 'book', category: 'study' },
             progress: { current: 100, required: 100, percentage: 100 }
          },
          {
             id: '2', currentTier: 'PLATINUM', currentValue: 50, 
             definition: { id: 'def2', name: 'Streak King', description: '30 day streak', icon: 'flame', category: 'streak' },
             progress: { current: 30, required: 30, percentage: 100 }
          },
          {
             id: '3', currentTier: 'BRONZE', currentValue: 5, 
             definition: { id: 'def3', name: 'Commenter', description: 'Post 10 comments', icon: 'message-circle', category: 'social' },
             progress: { current: 5, required: 10, percentage: 50 }
          },
          {
            id: '4', currentTier: 'RUBY', currentValue: 1000, 
            definition: { id: 'def4', name: 'Quiz Wizard', description: 'Score 100% on 50 quizzes', icon: 'target', category: 'mastery' },
            progress: { current: 50, required: 50, percentage: 100 }
         },
         {
          id: '5', currentTier: 'SILVER', currentValue: 1000, 
          definition: { id: 'def5', name: 'Note Taker', description: 'Create 20 notes', icon: 'file-text', category: 'study' },
          progress: { current: 20, required: 50, percentage: 40 }
       },
        ]
      } as unknown as { xp: number; achievements: UserAchievement[] };
    },
    initialData: { xp: 0, achievements: [] } 
  });

  const handleExport = async () => {
    const element = document.getElementById('player-card-export');
    if (!element) return;

    try {
      toast.loading('Generating player card...', { id: 'export' });
      const canvas = await html2canvas(element, {
        backgroundColor: '#0f172a', // Match slate-900
        scale: 2, // Retina quality
        useCORS: true, // Allow cross-origin images (important for avatar)
        allowTaint: true,
      });
      
      const link = document.createElement('a');
      link.download = `thynkr-stats-${user?.username || 'user'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast.success('Card downloaded!', { id: 'export' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate card', { id: 'export' });
    }
  };

  // Group achievements
  const groupedAchievements = stats.achievements.reduce((acc, ach) => {
    const cat = ach.definition.category;
    // Map to our display categories
    let displayCat = 'General';
    if (cat === 'streak') displayCat = 'Study Streak';
    else if (cat === 'mastery') displayCat = 'Mastery';
    else if (cat === 'social') displayCat = 'Community';
    else if (CATEGORY_MAP[cat]) displayCat = CATEGORY_MAP[cat].label; // Fallback to map label

    if (!acc[displayCat]) acc[displayCat] = [];
    acc[displayCat].push(ach);
    return acc;
  }, {} as Record<string, UserAchievement[]>);

  // Group Order
  const groupOrder = ['Study Streak', 'Mastery', 'Community', 'General Study', 'Skills', 'Content'];

  return (
    <PageContainer>
      <PageContainer.Header
        subtitle="Track your progress and showcase your milestones."
        actions={
          <Button onClick={handleExport} className="gap-2" variant="outline">
            <Share2 className="w-4 h-4" />
            Share Progress
          </Button>
        }
      >
        Achievements
      </PageContainer.Header>

      <PageContainer.Section>
        <div className="space-y-10">
          {Object.entries(groupedAchievements)
            .sort(([a], [b]) => {
                const idxA = groupOrder.indexOf(a);
                const idxB = groupOrder.indexOf(b);
                return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            })
            .map(([category, achievements]) => (
            achievements.length > 0 && (
              <motion.div 
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                   {/* Try to find icon for category label */}
                   {(() => {
                      const Entry = Object.values(CATEGORY_MAP).find(c => c.label === category);
                      const Icon = Entry?.icon || Star;
                      return <Icon className="w-5 h-5 text-brand-500" />;
                   })()}
                   {category}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <AchievementCard key={achievement.id} achievement={achievement} />
                  ))}
                </div>
              </motion.div>
            )
          ))}

          {stats.achievements.length === 0 && (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white">No achievements yet</h3>
              <p className="text-slate-500 dark:text-slate-400">Start studying to unlock your first achievement!</p>
            </div>
          )}
        </div>
      </PageContainer.Section>

      {/* Hidden Export Component */}
      <PlayerCardExport user={user} achievements={stats.achievements} />
    </PageContainer>
  );
}
