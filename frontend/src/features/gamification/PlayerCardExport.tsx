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

// Tier colors (hex for inline styles) - slightly lower opacity for glassier feel
const tierColors: Record<AchievementTier, { border: string; bg: string; text: string }> = {
  COPPER: { border: '#d97706', bg: 'rgba(217, 119, 6, 0.08)', text: '#d97706' },
  GOLD: { border: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', text: '#eab308' },
  RUBY: { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', text: '#ef4444' },
  DIAMOND: { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)', text: '#06b6d4' },
  AMETHYST: { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.08)', text: '#a855f7' },
  MASTERY: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.08)', text: '#8b5cf6' },
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

    // Colors based on theme
    const colors = {
      bg: isDark
        ? 'linear-gradient(135deg, #020617 0%, #172554 100%)'
        : 'linear-gradient(135deg, #fdfbf7 0%, #fff1f2 100%)',
      text: isDark ? '#ffffff' : '#1e293b',
      textMuted: isDark ? '#94a3b8' : '#64748b',
      textSubtle: isDark ? '#64748b' : '#94a3b8',
      cardBg: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
      cardBorder: isDark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.3)',
      avatarBg: isDark ? '#1e293b' : '#f1f5f9',
      avatarFallback: isDark ? '#a855f7' : '#ec4899',
      badgeBg: isDark
        ? 'linear-gradient(90deg, rgba(236, 72, 153, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)'
        : 'linear-gradient(90deg, rgba(236, 72, 153, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
      badgeBorder: isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.4)',
      badgeText: isDark ? '#f0abfc' : '#c026d3',
      emptyBg: isDark ? 'rgba(30, 41, 59, 0.3)' : 'rgba(226, 232, 240, 0.4)',
      emptyBorder: isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(148, 163, 184, 0.4)',
      emptyText: isDark ? 'rgba(71, 85, 105, 0.6)' : 'rgba(100, 116, 139, 0.6)',
      blobPink: isDark ? 'rgba(236, 72, 153, 0.12)' : 'rgba(236, 72, 153, 0.08)',
      blobPurple: isDark ? 'rgba(168, 85, 247, 0.10)' : 'rgba(168, 85, 247, 0.06)',
    };

    const formatXP = (xp: number) => {
      if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`;
      return xp.toString();
    };

    // Get top 6 unlocked achievements (most recent first)
    const unlockedAchievements = achievements
      .filter((a) => a.unlocked)
      .sort((a, b) => {
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
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Background Blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            background: `radial-gradient(circle, ${colors.blobPink} 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-100px',
            width: '500px',
            height: '500px',
            background: `radial-gradient(circle, ${colors.blobPurple} 0%, transparent 70%)`,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        {/* Main Content */}
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            padding: '36px 48px',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Row - Avatar + Name + Stats */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '100px',
                height: '100px',
                minWidth: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
                padding: '3px',
                marginRight: '20px',
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  width: '94px',
                  height: '94px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: colors.avatarBg,
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
                  <span
                    style={{
                      fontSize: '44px',
                      fontWeight: 700,
                      color: colors.avatarFallback,
                      lineHeight: 1,
                    }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Name + Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h1
                style={{
                  fontSize: '48px',
                  fontWeight: 800,
                  color: colors.text,
                  margin: 0,
                  marginBottom: '4px',
                  letterSpacing: '-1.5px',
                  lineHeight: 1.1,
                }}
              >
                {user.username}
              </h1>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  background: colors.badgeBg,
                  border: `1px solid ${colors.badgeBorder}`,
                  borderRadius: '10px',
                  padding: '3px 10px',
                  width: 'fit-content',
                }}
              >
                <Star size={11} color="#fbbf24" fill="#fbbf24" style={{ marginRight: '4px' }} />
                <span
                  style={{ fontSize: '11px', fontWeight: 600, color: colors.badgeText, lineHeight: 1.4 }}
                >
                  Thynkr Scholar
                </span>
              </div>
            </div>

            {/* Stats on the right - editorial style without icons */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline' }}>
              <div style={{ textAlign: 'center', marginRight: '48px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '6px',
                  }}
                >
                  Level
                </span>
                <span style={{ fontSize: '42px', fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                  {user.level}
                </span>
              </div>
              <div style={{ textAlign: 'center', marginRight: '48px' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '6px',
                  }}
                >
                  XP
                </span>
                <span style={{ fontSize: '42px', fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                  {formatXP(user.xp)}
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '6px',
                  }}
                >
                  Unlocked
                </span>
                <span style={{ fontSize: '42px', fontWeight: 800, color: colors.text, lineHeight: 1 }}>
                  {totalUnlocked}
                </span>
              </div>
            </div>
          </div>

          {/* Achievements Section */}
          <div
            style={{
              background: colors.cardBg,
              borderRadius: '16px',
              border: `1px solid ${colors.cardBorder}`,
              padding: '32px',
              flex: 1,
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
              <Award size={16} color={isDark ? '#f0abfc' : '#c026d3'} style={{ marginRight: '8px' }} />
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                Latest Unlocks
              </span>
            </div>

            {/* Achievement Grid - 6 square cards with refined styling */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: '24px',
                maxWidth: '100%',
              }}
            >
              {unlockedAchievements.map((achievement) => {
                const IconComponent =
                  iconMap[achievement.definition.icon?.toLowerCase()] || Trophy;
                const tier = tierColors[achievement.currentTier] || tierColors.COPPER;
                const label = tierLabels[achievement.currentTier] || 'Copper';

                return (
                  <div
                    key={achievement.id}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      borderRadius: '12px',
                      border: `2px solid ${tier.border}`,
                      background: tier.bg,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxSizing: 'border-box',
                      padding: '12px',
                    }}
                  >
                    {/* Icon */}
                    <IconComponent size={32} color={tier.text} style={{ marginBottom: '8px' }} />
                    {/* Tier Label */}
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: tier.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}

              {/* Empty slots if less than 6 */}
              {Array.from({ length: Math.max(0, 6 - unlockedAchievements.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '12px',
                    border: `2px dashed ${colors.emptyBorder}`,
                    background: colors.emptyBg,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    padding: '12px',
                  }}
                >
                  <Trophy size={32} color={colors.emptyText} style={{ marginBottom: '8px' }} />
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: colors.emptyText,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Locked
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '48px',
              display: 'flex',
              alignItems: 'center',
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ec4899',
                marginRight: '6px',
              }}
            />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: colors.textSubtle,
                letterSpacing: '0.1em',
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