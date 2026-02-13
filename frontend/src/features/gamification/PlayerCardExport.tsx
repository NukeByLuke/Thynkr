import { forwardRef } from 'react';
import { Trophy, Award, Star, Zap, LucideIcon } from 'lucide-react';

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

// Simple design optimized for html2canvas export
export const PlayerCardExport = forwardRef<HTMLDivElement, PlayerCardExportProps>(
  ({ user, totalAchievements }, ref) => {
    return (
      <div
        ref={ref}
        id="player-card-export"
        style={{
          width: '1200px',
          height: '630px',
          background: '#0f172a',
          fontFamily: 'Inter, -apple-system, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '24px',
        }}
      >
        {/* Gradient accent bar at top */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'linear-gradient(90deg, #ec4899, #d946ef, #f97316)',
        }} />

        {/* Main content */}
        <div style={{
          padding: '60px 80px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Top section - Avatar and info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
            {/* Avatar with border */}
            <div style={{
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              border: '5px solid #d946ef',
              overflow: 'hidden',
              flexShrink: 0,
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  crossOrigin="anonymous"
                />
              ) : (
                <span style={{ fontSize: '72px', fontWeight: 700, color: '#d946ef' }}>
                  {user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* User info */}
            <div>
              <h1 style={{
                fontSize: '64px',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-2px',
              }}>
                {user.username}
              </h1>
              <p style={{
                fontSize: '24px',
                color: '#d946ef',
                margin: '8px 0 0 0',
                fontWeight: 600,
              }}>
                Thynkr Scholar
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: '40px',
            marginTop: 'auto',
            paddingTop: '48px',
            borderTop: '2px solid #334155',
          }}>
            {/* Level */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Star size={28} color="#fbbf24" fill="#fbbf24" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Level
                </span>
              </div>
              <span style={{ fontSize: '72px', fontWeight: 800, color: '#ffffff' }}>
                {user.level}
              </span>
            </div>

            {/* XP */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Zap size={28} color="#d946ef" fill="#d946ef" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Total XP
                </span>
              </div>
              <span style={{ fontSize: '72px', fontWeight: 800, color: '#ffffff' }}>
                {user.xp >= 1000 ? `${(user.xp / 1000).toFixed(1)}k` : user.xp}
              </span>
            </div>

            {/* Achievements */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <Trophy size={28} color="#ec4899" />
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '2px' }}>
                  Achievements
                </span>
              </div>
              <span style={{ fontSize: '72px', fontWeight: 800, color: '#ffffff' }}>
                {totalAchievements}
              </span>
            </div>
          </div>

          {/* Footer branding */}
          <div style={{
            position: 'absolute',
            bottom: '32px',
            right: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#d946ef',
            }} />
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: '#64748b',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}>
              thynkr.study
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PlayerCardExport.displayName = 'PlayerCardExport';
