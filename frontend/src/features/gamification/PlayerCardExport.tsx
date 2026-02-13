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

// Note: Using inline styles for text because bg-clip-text doesn't work with html2canvas
export const PlayerCardExport = forwardRef<HTMLDivElement, PlayerCardExportProps>(
  ({ user, totalAchievements, featuredStats }, ref) => {
    return (
      <div
        ref={ref}
        id="player-card-export"
        style={{
          width: '1200px',
          height: '630px',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #0f172a 0%, #020617 50%, #0f172a 100%)',
        }}
      >
        {/* Background orbs - using divs with background colors */}
        <div style={{
          position: 'absolute',
          top: '-150px',
          left: '-150px',
          width: '450px',
          height: '450px',
          background: 'radial-gradient(circle, rgba(217,70,219,0.35) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-100px',
          right: '-100px',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(236,72,153,0.25) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '200px',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />

        {/* Content Container */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '48px 56px',
          justifyContent: 'space-between',
        }}>
          
          {/* Header Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Ring glow */}
              <div style={{
                position: 'absolute',
                inset: '-6px',
                background: 'linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #f97316 100%)',
                borderRadius: '50%',
                filter: 'blur(8px)',
                opacity: 0.8,
              }} />
              <div style={{
                position: 'relative',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                border: '4px solid rgba(217,70,219,0.4)',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    crossOrigin="anonymous" 
                  />
                ) : (
                  <span style={{ fontSize: '64px', fontWeight: 700, color: '#f0abfc' }}>
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Level Badge */}
              <div style={{
                position: 'absolute',
                bottom: '-8px',
                right: '-8px',
                background: '#020617',
                padding: '4px',
                borderRadius: '50px',
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #d946ef 0%, #ec4899 50%, #f97316 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '14px',
                  padding: '8px 18px',
                  borderRadius: '50px',
                  letterSpacing: '0.5px',
                }}>
                  LEVEL {user.level}
                </div>
              </div>
            </div>

            {/* User Info */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '8px' }}>
              <h1 style={{
                fontSize: '56px',
                fontWeight: 800,
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-1px',
                lineHeight: 1.1,
              }}>
                {user.username}
              </h1>
              <p style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#f0abfc',
                margin: '0 0 12px 0',
              }}>
                Thynkr Scholar
              </p>

              {/* Stat Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(217,70,219,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Trophy size={20} color="#fbbf24" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
                    {user.xp.toLocaleString()} XP
                  </span>
                </div>
                <div style={{
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: 'rgba(30,41,59,0.8)',
                  border: '1px solid rgba(217,70,219,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  <Award size={20} color="#e879f9" />
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
                    {totalAchievements} Achievements
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {featuredStats && featuredStats.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '32px',
              borderTop: '1px solid rgba(217,70,219,0.2)',
              paddingTop: '32px',
              marginTop: '24px',
            }}>
              {featuredStats.map((stat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <stat.icon size={22} color={
                      stat.color?.includes('amber') ? '#fbbf24' : 
                      stat.color?.includes('fuchsia') ? '#e879f9' : 
                      stat.color?.includes('pink') ? '#f472b6' : '#94a3b8'
                    } />
                    <span style={{ 
                      fontSize: '13px', 
                      fontWeight: 700, 
                      color: '#cbd5e1',
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}>
                      {stat.label}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '48px', 
                    fontWeight: 800, 
                    color: '#ffffff',
                  }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Branding Footer */}
          <div style={{
            position: 'absolute',
            bottom: '24px',
            right: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #ec4899, #d946ef)',
            }} />
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '3px',
              color: '#a78bfa',
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
