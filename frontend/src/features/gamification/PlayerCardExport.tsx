import { forwardRef } from 'react';
import { Trophy, Star, Zap } from 'lucide-react';

interface PlayerCardExportProps {
  user: {
    username: string;
    avatarUrl?: string | null;
    xp: number;
    level: number;
  };
  totalAchievements: number;
}

// Premium "Midnight" design - all inline styles for html2canvas compatibility
export const PlayerCardExport = forwardRef<HTMLDivElement, PlayerCardExportProps>(
  ({ user, totalAchievements }, ref) => {
    const formatXP = (xp: number) => {
      if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
      return xp.toString();
    };

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
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Background Decorative Blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            padding: '56px 64px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Section - User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {/* Avatar with Gradient Border */}
            <div
              style={{
                width: '188px',
                height: '188px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                padding: '4px',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span style={{ fontSize: '80px', fontWeight: 700, color: '#a855f7' }}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* User Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h1
                style={{
                  fontSize: '72px',
                  fontWeight: 800,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-2px',
                  lineHeight: 1,
                }}
              >
                {user.username}
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  borderRadius: '20px',
                  padding: '8px 20px',
                  marginTop: '8px',
                  width: 'fit-content',
                }}
              >
                <Star size={18} color="#fbbf24" fill="#fbbf24" />
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#f0abfc' }}>
                  Thynkr Scholar
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Section - Stats Grid */}
          <div
            style={{
              marginTop: 'auto',
              background: 'rgba(15, 23, 42, 0.5)',
              borderRadius: '20px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              padding: '32px 40px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px',
            }}
          >
            {/* Level */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Star size={24} color="#fbbf24" fill="#fbbf24" />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                  }}
                >
                  Level
                </span>
              </div>
              <span style={{ fontSize: '56px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {user.level}
              </span>
            </div>

            {/* Total XP */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={24} color="#a855f7" fill="#a855f7" />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                  }}
                >
                  Total XP
                </span>
              </div>
              <span style={{ fontSize: '56px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {formatXP(user.xp)}
              </span>
            </div>

            {/* Achievements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Trophy size={24} color="#ec4899" />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                  }}
                >
                  Achievements
                </span>
              </div>
              <span style={{ fontSize: '56px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {totalAchievements}
              </span>
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              right: '32px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ec4899',
              }}
            />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#64748b',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              thynkr.study
            </span>
          </div>
        </div>
      </div>
    );
  }
);

PlayerCardExport.displayName = 'PlayerCardExport';
