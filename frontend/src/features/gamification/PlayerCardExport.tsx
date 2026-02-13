import { forwardRef } from 'react';
import { Trophy, Award, LucideIcon } from 'lucide-react';

interface PlayerCardExportProps {
  user: {
    username: string;
    avatarUrl?: string | null;
    xp: number;
    level: number;
  };
  totalAchievements: number;
  featuredStats?: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color?: string;
  }[];
}

export const PlayerCardExport = forwardRef<HTMLDivElement, PlayerCardExportProps>(
  ({ user, totalAchievements, featuredStats }, ref) => {
    return (
      <div
        ref={ref}
        id="player-card-export"
        className="w-[1200px] h-[630px] bg-slate-950 text-white relative overflow-hidden flex flex-col shadow-2xl rounded-2xl"
        style={{
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Enhanced Background with Multiple Layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        
        {/* Enhanced Decorative Orbs with Animation */}
        <div className="absolute top-[-150px] left-[-150px] w-[450px] h-[450px] bg-purple-500/25 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-600/15 blur-[140px] rounded-full animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/10 dark:bg-cyan-600/10 blur-[100px] rounded-full" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          
          {/* Header Section with Enhanced Styling */}
          <div className="flex items-center gap-8">
            {/* Avatar with Enhanced Ring Effect */}
            <div className="relative group">
               <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-full blur-md opacity-90 animate-pulse" style={{ animationDuration: '3s' }}></div>
               <div className="relative w-32 h-32 rounded-full border-[3px] border-slate-800/50 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-2xl">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" crossOrigin="anonymous" />
                 ) : (
                   <span className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-slate-300 to-slate-500">{user.username.charAt(0).toUpperCase()}</span>
                 )}
               </div>
               
               {/* Enhanced Level Badge */}
               <div className="absolute -bottom-2 -right-2 bg-slate-950 p-1.5 rounded-full shadow-xl">
                 <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 text-white text-sm font-bold px-4 py-1.5 rounded-full border-2 border-slate-700/50 shadow-lg flex items-center gap-1.5">
                   <span className="text-amber-100">Lvl {user.level}</span>
                 </div>
               </div>
            </div>

            {/* Enhanced User Info */}
            <div className="flex flex-col flex-1">
              <h1 className="text-5xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight drop-shadow-lg">
                {user.username}
              </h1>
              <p className="text-slate-400 font-semibold text-lg flex items-center gap-2 mb-5">
                Scholar
              </p>

              {/* Enhanced Badges with Better Styling */}
              <div className="flex items-center gap-4">
                <div className="px-5 py-2.5 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 flex items-center gap-2.5 backdrop-blur-md shadow-lg">
                   <Trophy size={18} className="text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                   <span className="text-sm font-bold text-slate-200">{user.xp.toLocaleString()} XP</span>
                </div>
                <div className="px-5 py-2.5 rounded-full bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/60 flex items-center gap-2.5 backdrop-blur-md shadow-lg">
                   <Award size={18} className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                   <span className="text-sm font-bold text-slate-200">{totalAchievements} Achievements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Grid */}
          {featuredStats && featuredStats.length > 0 && (
            <div className="grid grid-cols-3 gap-6 border-t border-slate-800/60 pt-8 mt-4">
              {featuredStats.map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-2 group">
                  <div className="flex items-center gap-2.5 text-slate-400 mb-1.5">
                    <stat.icon size={20} className={`${stat.color} group-hover:scale-110 transition-transform drop-shadow-lg`} />
                    <span className="text-sm font-bold uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-slate-300">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced Branding Footer */}
          <div className="absolute bottom-6 right-8 flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_12px_rgba(59,130,246,0.8)] animate-pulse" style={{ animationDuration: '2s' }} />
            <span className="text-xs font-bold tracking-[0.25em] text-slate-300 uppercase">
              Generated by thynkr.study
            </span>
          </div>

        </div>
      </div>
    );
  }
);

PlayerCardExport.displayName = 'PlayerCardExport';
