/**
 * GameCard Component
 * Professional SaaS-style game selection card with minimalist design
 * Features icon in soft square, category tags, Pro badge, and hover effects
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Lock, type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

// =============================================================================
// Types
// =============================================================================

export type GameCategory = 'focus' | 'speed' | 'memory' | 'logic' | 'challenge';

export interface GameCardProps {
  /** Unique identifier for the game */
  id: string;
  /** Game title */
  title: string;
  /** Short description of the game */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon color theme */
  iconColor?: 'blue' | 'green' | 'orange' | 'purple' | 'rose' | 'amber' | 'teal';
  /** Category tags to display */
  categories?: GameCategory[];
  /** Whether this is a Pro-only game */
  isPro?: boolean;
  /** Whether the user has Pro access */
  userHasPro?: boolean;
  /** Whether the game is coming soon */
  comingSoon?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional className */
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const ICON_COLORS = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
  },
};

const CATEGORY_STYLES: Record<GameCategory, { bg: string; text: string; label: string }> = {
  focus: {
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Focus',
  },
  speed: {
    bg: 'bg-orange-50 dark:bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Speed',
  },
  memory: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    text: 'text-purple-700 dark:text-purple-400',
    label: 'Memory',
  },
  logic: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    text: 'text-blue-700 dark:text-blue-400',
    label: 'Logic',
  },
  challenge: {
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    text: 'text-rose-700 dark:text-rose-400',
    label: 'Challenge',
  },
};

// =============================================================================
// Component
// =============================================================================

export default function GameCard({
  title,
  description,
  icon: Icon,
  iconColor = 'blue',
  categories = [],
  isPro = false,
  userHasPro = false,
  comingSoon = false,
  onClick,
  className,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isLocked = isPro && !userHasPro;
  const isDisabled = comingSoon || isLocked;
  const colors = ICON_COLORS[iconColor];

  const handleClick = () => {
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isDisabled}
      whileHover={!isDisabled ? { y: -2 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      className={clsx(
        'relative w-full p-5 text-left',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'rounded-2xl',
        'transition-all duration-200',
        isDisabled
          ? 'opacity-60 cursor-not-allowed'
          : [
              'cursor-pointer',
              'hover:border-blue-400/50 dark:hover:border-blue-500/50',
              'hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50',
            ],
        className
      )}
    >
      {/* Pro Badge - Top Right */}
      {isPro && (
        <div className="absolute top-4 right-4">
          <span
            className={clsx(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
              userHasPro
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            )}
          >
            {isLocked && <Lock className="w-2.5 h-2.5" />}
            PRO
          </span>
        </div>
      )}

      {/* Coming Soon Badge */}
      {comingSoon && !isPro && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Soon
          </span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex items-start gap-4">
        {/* Icon in Soft Square */}
        <div
          className={clsx(
            'flex-shrink-0 p-3 rounded-xl',
            colors.bg
          )}
        >
          <Icon className={clsx('w-6 h-6', colors.text)} />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 pr-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1 truncate">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
            {description}
          </p>

          {/* Category Tags */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {categories.map((category) => {
                const style = CATEGORY_STYLES[category];
                return (
                  <span
                    key={category}
                    className={clsx(
                      'inline-flex items-center px-2 py-0.5 rounded-md',
                      'text-xs font-medium',
                      style.bg,
                      style.text
                    )}
                  >
                    {style.label}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Play Arrow - Slides in on Hover */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{
            opacity: isHovered && !isDisabled ? 1 : 0,
            x: isHovered && !isDisabled ? 0 : -10,
          }}
          transition={{ duration: 0.15 }}
          className="absolute right-5 top-1/2 -translate-y-1/2"
        >
          <div className="p-2 rounded-full bg-blue-500 text-white">
            <ArrowRight className="w-4 h-4" />
          </div>
        </motion.div>
      </div>
    </motion.button>
  );
}

// =============================================================================
// Skeleton Component for Loading States
// =============================================================================

export function GameCardSkeleton() {
  return (
    <div
      className={clsx(
        'w-full p-5',
        'bg-white dark:bg-slate-900',
        'border border-slate-200 dark:border-slate-800',
        'rounded-2xl',
        'animate-pulse'
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon skeleton */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700" />

        {/* Text skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-14 rounded-md bg-slate-100 dark:bg-slate-800" />
            <div className="h-5 w-16 rounded-md bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
