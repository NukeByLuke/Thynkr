import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Trophy,
  Star,
  Flame,
  BookOpen,
  Target,
  Award,
  Crown,
  Rocket,
  Users,
  Brain,
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
  Share2,
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
  theme: 'light' | 'dark';
}

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  trophy: Trophy,
  star: Star,
  flame: Flame,
  book: BookOpen,
  target: Target,
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

// Tier styling configuration
const tierStyles: Record<AchievementTier, { 
  border: string; 
  bg: string; 
  text: string; 
  gradient: string;
  shadow: string; 
}> = {
  COPPER: { 
    border: '#f59e0b', 
    bg: 'rgba(251, 191, 36, 0.1)', 
    text: '#d97706',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    shadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
  },
  GOLD: { 
    border: '#fbbf24', 
    bg: 'rgba(251, 191, 36, 0.15)', 
    text: '#b45309',
    gradient: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
    shadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
  },
  RUBY: { 
    border: '#f43f5e', 
    bg: 'rgba(244, 63, 94, 0.1)', 
    text: '#e11d48',
    gradient: 'linear-gradient(135deg, #fb7185, #e11d48)',
    shadow: '0 4px 12px rgba(244, 63, 94, 0.2)'
  },
  DIAMOND: { 
    border: '#06b6d4', 
    bg: 'rgba(6, 182, 212, 0.1)', 
    text: '#0891b2',
    gradient: 'linear-gradient(135deg, #22d3ee, #0891b2)',
    shadow: '0 4px 12px rgba(6, 182, 212, 0.2)'
  },
  AMETHYST: { 
    border: '#a855f7', 
    bg: 'rgba(168, 85, 247, 0.1)', 
    text: '#9333ea',
    gradient: 'linear-gradient(135deg, #c084fc, #9333ea)',
    shadow: '0 4px 12px rgba(168, 85, 247, 0.2)'
  },
  MASTERY: { 
    border: '#6366f1', 
    bg: 'rgba(99, 102, 241, 0.1)', 
    text: '#4f46e5',
    gradient: 'linear-gradient(135deg, #818cf8, #4f46e5)',
    shadow: '0 4px 12px rgba(99, 102, 241, 0.25)'
  },
};

const tierLabels: Record<AchievementTier, string> = {
  COPPER: 'Copper',
  GOLD: 'Gold',
  RUBY: 'Ruby',
  DIAMOND: 'Diamond',
  AMETHYST: 'Amethyst',
  MASTERY: 'Mastery',
};

// Theme-aware profile export card
export const PlayerCardExport = forwardRef<HTMLDivElement, PlayerCardExportProps>(
  ({ user, achievements, theme }, ref) => {
    const isDark = theme === 'dark';

    // Theme palette
    const colors = {
      bg: isDark ? '#0f172a' : '#f8fafc',
      text: isDark ? '#f1f5f9' : '#0f172a',
      textMuted: isDark ? '#94a3b8' : '#64748b',
      cardBg: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
      cardBorder: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(226, 232, 240, 0.8)',
      statBg: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(241, 245, 249, 0.5)',
      blob1: isDark ? '#4f46e5' : '#c084fc',
      blob2: isDark ? '#ec4899' : '#818cf8',
    };

    const formatXP = (xp: number) => {
      if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
      return xp.toString();
    };

    // Get top 6 unlocked achievements
    const unlockedAchievements = achievements
      .filter((a) => a.unlocked)
      .sort((a, b) => {
        // Prioritize tier value roughly for display, then date
        const tierValue = { MASTERY: 6, DIAMOND: 5, AMETHYST: 4, RUBY: 3, GOLD: 2, COPPER: 1 };
        const scoreA = tierValue[a.currentTier] || 0;
        const scoreB = tierValue[b.currentTier] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        const dateA = a.unlockedAt ? new Date(a.unlockedAt).getTime() : 0;
        const dateB = b.unlockedAt ? new Date(b.unlockedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);

    const totalUnlocked = achievements.filter((a) => a.unlocked).length;

    return (
      <div
        ref={ref}
        id="player-card-export"
        style={{
          width: '1200px',
          height: '630px',
          background: colors.bg,
          fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* === Background Ambient Effects === */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-10%',
            width: '600px',
            height: '600px',
            background: colors.blob1,
            filter: 'blur(120px)',
            opacity: 0.15,
            borderRadius: '50%',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-10%',
            width: '700px',
            height: '700px',
            background: colors.blob2,
            filter: 'blur(140px)',
            opacity: 0.15,
            borderRadius: '50%',
            zIndex: 0,
          }}
        />

        {/* === Main Container === */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '48px',
            gap: '32px',
          }}
        >
          {/* === Header Section: Profile & Stats === */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Left: User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Avatar */}
              <div
                style={{
                  width: '110px',
                  height: '110px',
                  padding: '4px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #c026d3, #4f46e5)',
                  boxShadow: '0 10px 25px rgba(79, 70, 229, 0.2)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    backgroundColor: colors.bg,
                    backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    color: '#c026d3',
                    textTransform: 'uppercase',
                  }}
                >
                  {!user.avatarUrl && user.username[0]}
                </div>
              </div>

              {/* Name & Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h1
                  style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    margin: 0,
                    lineHeight: 1,
                    color: colors.text,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {user.username}
                </h1>
                
                {/* Scholar Badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: isDark ? 'rgba(234, 179, 8, 0.1)' : '#fffbeb',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: '100px',
                    width: 'fit-content',
                    marginTop: '10px',
                  }}
                >
                  <Star size={14} fill="#fbbf24" stroke="#d97706" />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#d97706',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginTop: '-2px',
                    }}
                  >
                    Thynkr Scholar
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Stats Cards */}
            <div style={{ display: 'flex', gap: '16px' }}>
              {[
                { label: 'Level', value: user.level },
                { label: 'Total XP', value: formatXP(user.xp) },
                { label: 'Unlocked', value: totalUnlocked },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '100px',
                    padding: '16px 24px 20px 24px',
                    backgroundColor: colors.statBg,
                    borderRadius: '16px',
                    border: `1px solid ${colors.cardBorder}`,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: colors.textMuted,
                      marginBottom: '4px',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {stat.label}
                  </span>
                  <span
                    style={{
                      fontSize: '32px',
                      fontWeight: 800,
                      color: colors.text,
                      lineHeight: 1,
                    }}
                  >
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* === Main Content: Achievements Showcase === */}
          <div
            style={{
              flex: 1,
              backgroundColor: colors.cardBg,
              borderRadius: '24px',
              border: `1px solid ${colors.cardBorder}`,
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '24px' }}>
              <Trophy size={20} color="#c026d3" />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: colors.textMuted,
                  marginTop: '-6px',
                }}
              >
                Top Achievements
              </span>
            </div>

            {/* Achievements Grid */}
            <div
              style={{
                display: 'flex',
                gap: '24px',
                justifyContent: 'center',
                alignItems: 'center',
                flex: 1,
              }}
            >
              {unlockedAchievements.map((achievement) => {
                const IconComponent = iconMap[achievement.definition.icon?.toLowerCase()] || Trophy;
                const tier = tierStyles[achievement.currentTier] || tierStyles.COPPER;
                const label = tierLabels[achievement.currentTier];

                return (
                  <div
                    key={achievement.id}
                    style={{
                      width: '140px',
                      height: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px 12px',
                      backgroundColor: tier.bg,
                      border: `2px solid ${tier.border}`,
                      borderRadius: '16px',
                      boxShadow: tier.shadow,
                      boxSizing: 'border-box',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Glass Shine */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '40%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Icon */}
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: tier.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      }}
                    >
                      <IconComponent size={28} color="#ffffff" strokeWidth={2.5} />
                    </div>

                    {/* Text Details */}
                    <div>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '10px',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          color: tier.text,
                          opacity: 0.8,
                          marginBottom: '4px',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          display: 'block',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: colors.text,
                          lineHeight: 1.2,
                        }}
                      >
                        {achievement.definition.name}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Fill Empties if needed (optional styling for empties) */}
              {Array.from({ length: Math.max(0, 6 - unlockedAchievements.length) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  style={{
                    width: '140px',
                    height: '180px',
                    borderRadius: '16px',
                    border: `2px dashed ${colors.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    opacity: 0.5,
                  }}
                >
                  <Award size={32} color={colors.textMuted} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === Footer: Branding === */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '48px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 20,
          }}
        >
           <img 
              src={isDark ? '/brand/brain-dark.png' : '/brand/brain-light.png'}
              alt="Thynkr"
              style={{
                width: '24px', 
                height: '24px', 
                objectFit: 'contain'
              }}
           />
           <span style={{ 
               fontSize: '14px', 
               fontWeight: 700, 
               color: colors.text,
               letterSpacing: '-0.02em',
               marginTop: '-4px'
           }}>
             thynkr.study
           </span>
        </div>
      </div>
    );
  }
);

PlayerCardExport.displayName = 'PlayerCardExport';
