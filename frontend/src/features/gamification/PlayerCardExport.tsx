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
        {/* Background with Thynkr brand colors (fuchsia/pink/orange) */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-900/25 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-pink-900/20 via-transparent to-transparent" />
        
        {/* Decorative Orbs - Thynkr brand gradient */}
        <div className="absolute top-[-150px] left-[-150px] w-[450px] h-[450px] bg-fuchsia-500/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-pink-500/20 blur-[140px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/10 blur-[100px] rounded-full" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full p-16 justify-between">
          
          {/* Header Section */}
          <div className="flex items-center gap-10">
            {/* Avatar with Fuchsia Ring */}
            <div className="relative group flex-shrink-0">
               <div className="absolute -inset-1.5 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-500 rounded-full blur-md opacity-90"></div>
               <div className="relative w-36 h-36 rounded-full border-[3px] border-fuchsia-500/30 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center shadow-2xl">
                 {user.avatarUrl ? (
                   <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" crossOrigin="anonymous" />
                 ) : (
                   <span className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-fuchsia-300 to-pink-500">{user.username.charAt(0).toUpperCase()}</span>
                 )}
               </div>
               
               {/* Level Badge */}
               <div className="absolute -bottom-2 -right-2 bg-slate-950 p-1.5 rounded-full shadow-xl">
                 <div className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-orange-500 text-white font-bold px-5 py-2 rounded-full border-2 border-fuchsia-400/30 shadow-lg flex items-center gap-1.5">
                   <span className="text-white text-base">LEVEL {user.level}</span>
                 </div>
               </div>
            </div>

            {/* User Info */}
            <div className="flex flex-col flex-1 gap-3">
              <h1 className="text-6xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-white via-fuchsia-100 to-pink-200 tracking-tight drop-shadow-lg leading-tight">
                {user.username}
              </h1>
              <p className="text-fuchsia-300/80 font-semibold text-xl flex items-center gap-2 mb-3">
                Thynkr Scholar
              </p>

              {/* Stat Badges */}
              <div className="flex items-center gap-5">
                <div className="px-6 py-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-fuchsia-500/30 flex items-center gap-3 backdrop-blur-md shadow-lg">
                   <Trophy size={22} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                   <span className="text-base font-bold text-slate-200">{user.xp.toLocaleString()} XP</span>
                </div>
                <div className="px-6 py-3 rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-fuchsia-500/30 flex items-center gap-3 backdrop-blur-md shadow-lg">
                   <Award size={22} className="text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]" />
                   <span className="text-base font-bold text-slate-200">{totalAchievements} Achievements</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {featuredStats && featuredStats.length > 0 && (
            <div className="grid grid-cols-3 gap-8 border-t border-fuchsia-500/20 pt-10 mt-6">
              {featuredStats.map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-3 group">
                  <div className="flex items-center gap-3 text-fuchsia-300/70 mb-2">
                    <stat.icon size={24} className={`${stat.color} group-hover:scale-110 transition-transform drop-shadow-lg`} />
                    <span className="text-base font-bold uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white to-fuchsia-200">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Branding Footer */}
          <div className="absolute bottom-8 right-10 flex items-center gap-3 opacity-80">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 shadow-[0_0_12px_rgba(236,72,153,0.8)]" />
            <span className="text-sm font-bold tracking-[0.25em] text-fuchsia-200/70 uppercase">
              thynkr.study
            </span>
          </div>

        </div>
      </div>
    );
  }
);

PlayerCardExport.displayName = 'PlayerCardExport';
