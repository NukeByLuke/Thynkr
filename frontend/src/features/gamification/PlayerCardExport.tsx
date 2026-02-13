import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { 
  Trophy, Star, Zap, Flame, BookOpen, Target, Award, Crown, 
  Rocket, Users, Brain, Sparkles, Clock, Sun, Moon, Calendar,
  Search, Heart, Globe, Layers, GraduationCap, Library, FileText, Share2
} from 'lucide-react';
import type { UserAchievement, AchievementTier } from './gamification.utils';

interface PlayerCardExportProps {
  user: {
    username: string;
    avatarUrl?: string | null;
    xp: number;
    level: number;
  };
  achievements: UserAchievement[];
}

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy, star: Star, flame: Flame, book: BookOpen, target: Target,
  zap: Zap, award: Award, crown: Crown, rocket: Rocket, users: Users,
  brain: Brain, sparkles: Sparkles, clock: Clock, sun: Sun, moon: Moon,
  calendar: Calendar, search: Search, heart: Heart, globe: Globe, layers: Layers,
  'graduation-cap': GraduationCap, library: Library, 'file-text': FileText, 'share-2': Share2,
};

// Tier border colors (hex for inline styles)
const tierColors: Record<AchievementTier, string> = {
  BRONZE: '#b45309',    // amber-700
  GOLD: '#eab308',      // yellow-500
  RUBY: '#ef4444',      // red-500
  DIAMOND: '#22d3ee',   // cyan-400
  AMETHYST: '#9333ea',  // purple-600
  MASTERY: '#8b5cf6',   // violet-500
};

// Premium "Midnight" design - all inline styles for html2canvas
export const PlayerCardExport = forwardRef<HTMLDivElement, PlayerCardExportProps>(
  ({ user, achievements }, ref) => {
    const formatXP = (xp: number) => {
      if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
      return xp.toString();
    };

    // Get top 8 unlocked achievements (most recent first)
    const unlockedAchievements = achievements
      .filter(a => a.unlocked)
      .sort((a, b) => {
        const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
        const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 8);

    const totalUnlocked = achievements.filter(a => a.unlocked).length;

    return (
      <div
        ref={ref}
        id="player-card-export"
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #020617 0%, #172554 100%)',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Background Blobs */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        }} />
        <div style={{
          position: 'absolute', bottom: '-150px', left: '-100px', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        }} />

        {/* Main Content */}
        <div style={{
          position: 'relative', zIndex: 10, padding: '40px 56px',
          height: '100%', boxSizing: 'border-box',
        }}>
          {/* Header Row - Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
            {/* Avatar */}
            <div style={{
              width: '120px', height: '120px', minWidth: '120px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
              padding: '3px', marginRight: '28px', boxSizing: 'border-box',
            }}>
              <div style={{
                width: '114px', height: '114px', borderRadius: '50%', overflow: 'hidden',
                background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                ) : (
                  <span style={{ fontSize: '52px', fontWeight: 700, color: '#a855f7', lineHeight: 1 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name + Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h1 style={{
                fontSize: '56px', fontWeight: 800, color: '#ffffff', margin: 0,
                marginBottom: '8px', letterSpacing: '-2px', lineHeight: '1.1',
              }}>
                {user.username}
              </h1>
              <div style={{
                display: 'inline-flex', alignItems: 'center',
                background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '16px',
                padding: '6px 16px', width: 'fit-content',
              }}>
                <Star size={16} color="#fbbf24" fill="#fbbf24" style={{ marginRight: '6px' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#f0abfc', lineHeight: '1.4' }}>
                  Thynkr Scholar
                </span>
              </div>
            </div>

            {/* Stats on the right */}
            <div style={{ marginLeft: 'auto', display: 'flex' }}>
              <div style={{ textAlign: 'center', marginRight: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <Star size={18} color="#fbbf24" fill="#fbbf24" style={{ marginRight: '6px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Level</span>
                </div>
                <span style={{ fontSize: '40px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{user.level}</span>
              </div>
              <div style={{ textAlign: 'center', marginRight: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <Zap size={18} color="#a855f7" fill="#a855f7" style={{ marginRight: '6px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>XP</span>
                </div>
                <span style={{ fontSize: '40px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{formatXP(user.xp)}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <Trophy size={18} color="#ec4899" style={{ marginRight: '6px' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Unlocked</span>
                </div>
                <span style={{ fontSize: '40px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{totalUnlocked}</span>
              </div>
            </div>
          </div>

          {/* Latest Unlocks Section */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px',
            border: '1px solid rgba(148, 163, 184, 0.1)', padding: '24px 28px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <Award size={20} color="#f0abfc" style={{ marginRight: '10px' }} />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Latest Unlocks
              </span>
            </div>

            {/* Achievement Grid - 8 items */}
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {unlockedAchievements.map((achievement, idx) => {
                const IconComponent = iconMap[achievement.definition.icon?.toLowerCase()] || Trophy;
                const borderColor = tierColors[achievement.currentTier] || tierColors.BRONZE;
                
                return (
                  <div
                    key={achievement.id}
                    style={{
                      width: '120px', marginRight: idx < 7 ? '16px' : 0, marginBottom: '0',
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                    }}
                  >
                    {/* Icon Circle */}
                    <div style={{
                      width: '56px', height: '56px', borderRadius: '50%',
                      background: 'rgba(30, 41, 59, 0.8)',
                      border: `3px solid ${borderColor}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '8px',
                    }}>
                      <IconComponent size={26} color={borderColor} />
                    </div>
                    {/* Name */}
                    <span style={{
                      fontSize: '11px', fontWeight: 600, color: '#94a3b8',
                      textAlign: 'center', lineHeight: '1.3',
                      maxWidth: '110px', overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {achievement.definition.name}
                    </span>
                  </div>
                );
              })}

              {/* Empty slots if less than 8 */}
              {Array.from({ length: Math.max(0, 8 - unlockedAchievements.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  style={{
                    width: '120px', marginRight: idx + unlockedAchievements.length < 7 ? '16px' : 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}
                >
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'rgba(30, 41, 59, 0.4)',
                    border: '3px dashed rgba(71, 85, 105, 0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '8px',
                  }}>
                    <Trophy size={26} color="rgba(71, 85, 105, 0.5)" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(71, 85, 105, 0.5)', textAlign: 'center' }}>
                    Locked
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Branding */}
          <div style={{
            position: 'absolute', bottom: '20px', right: '32px',
            display: 'flex', alignItems: 'center', zIndex: 20,
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899', marginRight: '8px' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', letterSpacing: '2px', textTransform: 'uppercase' }}>
              thynkr.study
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PlayerCardExport.displayName = 'PlayerCardExport';