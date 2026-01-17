import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import PageContainer from '@/components/layout/PageContainer';
import { api } from '@/lib/api';
import { 
  TIER_CONFIG, 
  CATEGORY_CONFIG, 
  getIcon, 
  TIER_ORDER, 
  UserAchievement 
} from '@/features/gamification/gamification.utils';
import { Trophy, Share2, Crown, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ShareProfileModal } from '@/features/gamification/ShareProfileModal';

const PublicLevelBanner = ({ user }: { user: any }) => {
  return (
    <div className="bg-zinc-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-lg mb-8 flex flex-col md:flex-row items-center gap-6">
       <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-lg shadow-blue-500/50 shrink-0">
          <div className="w-full h-full rounded-xl bg-zinc-900 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase tracking-wide">Level</div>
              <div className="text-3xl font-bold text-white">{user.level}</div>
            </div>
          </div>
       </div>
       <div className="text-center md:text-left">
         <h1 className="text-3xl font-bold text-white mb-1">{user.username}</h1>
         <div className="flex items-center gap-4 text-slate-400 justify-center md:justify-start">
            <span>Started {new Date(user.joinedAt).toLocaleDateString()}</span>
            <span>•</span>
            <span className="text-blue-400 font-bold">{user.xp.toLocaleString()} Total XP</span>
         </div>
       </div>
    </div>
  );
};

export default function PublicAchievements() {
  const { username } = useParams<{ username: string }>();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data } = await api.get(`/users/${username}/achievements`);
      return data;
    },
    enabled: !!username,
    retry: false
  });

  const user = profile?.user;
  const achievements = (profile?.achievements || []) as UserAchievement[];

  const enrichedAchievements = useMemo(() => {
     return achievements.map(a => ({
         ...a,
         unlocked: !!a.unlockedAt // Ensure boolean
     }));
  }, [achievements]);

  const achievementsByCategory = useMemo(() => {
    const grouped: Record<string, UserAchievement[]> = {};
    enrichedAchievements.forEach((achievement) => {
      const category = achievement.definition.category;
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(achievement);
    });
    
    // Sort
    Object.keys(grouped).forEach(cat => {
        grouped[cat].sort((a, b) => {
             if (a.unlocked && !b.unlocked) return -1;
             if (!a.unlocked && b.unlocked) return 1;
             // Compare tiers
             if (a.currentTier && b.currentTier) {
                 return TIER_ORDER.indexOf(a.currentTier) - TIER_ORDER.indexOf(b.currentTier);
             }
             return 0;
        });
    });
    return grouped;
  }, [enrichedAchievements]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      </PageContainer>
    );
  }

  if (error || !user) {
    return (
      <PageContainer>
         <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-2">User not found</h2>
            <p className="text-slate-400">The user "{username}" does not exist or has a private profile.</p>
         </div>
      </PageContainer>
    );
  }

  const unlockedCount = enrichedAchievements.filter(a => a.unlocked).length;

  return (
    <PageContainer>
       <PageContainer.Header 
         title="Player Profile"
         subtitle={`${unlockedCount} Achievements Unlocked`}
         actions={
           <Button onClick={() => setIsShareModalOpen(true)} variant="primary" className="gap-2">
             <Share2 size={16} /> Share
           </Button>
         }
       >
         <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>thynkr.ca</span>
            <span>/</span>
            <span className="text-white">u</span>
            <span>/</span>
            <span className="text-white">{user.username}</span>
         </div>
       </PageContainer.Header>

       <PageContainer.Section>
          <PublicLevelBanner user={user} />
          
          <div className="space-y-12 pb-20">
             {Object.entries(achievementsByCategory).map(([category, list]) => {
                const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
                const Icon = config?.icon || Trophy;
                
                return (
                  <div key={category}>
                    <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-2">
                       <div className={`p-2 rounded-lg bg-gradient-to-br ${config?.gradient || 'from-gray-700 to-gray-600'}`}>
                           <Icon className="w-5 h-5 text-white" />
                       </div>
                       <div>
                           <h3 className="text-xl font-bold text-white">{config?.title || category}</h3>
                           <p className="text-sm text-slate-400">{config?.description}</p>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {list.map(achievement => {
                            const isLocked = !achievement.unlocked;
                            const tier = isLocked ? TIER_CONFIG.BRONZE : TIER_CONFIG[achievement.currentTier];
                            const AchievementIcon = getIcon(achievement.definition.icon);
                            
                            return (
                                <div key={achievement.id} className={`relative group p-4 rounded-xl border transition-all duration-300 ${
                                    isLocked 
                                     ? 'bg-slate-900/40 border-slate-800/60 opacity-60 grayscale'
                                     : `bg-slate-900/80 ${tier.border} ${tier.bg} hover:border-opacity-100`
                                }`}>
                                   <div className="flex items-start gap-4">
                                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                                          isLocked ? 'bg-slate-800' : tier.iconBg
                                      } shadow-lg`}>
                                         {isLocked ? <Lock size={20} className="text-slate-500" /> : <AchievementIcon size={24} className="text-white" />}
                                      </div>
                                      <div>
                                         <h4 className="font-bold text-white text-sm mb-1 line-clamp-1">{achievement.definition.name}</h4>
                                         <p className="text-xs text-slate-400 line-clamp-2">{achievement.definition.description}</p>
                                         {!isLocked && (
                                             <div className={`mt-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.gradient} text-white uppercase`}>
                                                 {tier.label}
                                             </div>
                                         )}
                                      </div>
                                   </div>
                                </div>
                            );
                        })}
                    </div>
                  </div>
                );
             })}
          </div>
       </PageContainer.Section>
       
       <ShareProfileModal 
         isOpen={isShareModalOpen}
         onClose={() => setIsShareModalOpen(false)}
         user={user}
         achievements={enrichedAchievements}
       />
    </PageContainer>
  );
}
