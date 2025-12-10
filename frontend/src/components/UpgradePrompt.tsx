/* eslint-disable react-hooks/rules-of-hooks */
import { Link } from 'react-router-dom';
import { Lock, Crown, Zap, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export type RequiredTier = 'STANDARD' | 'PREMIUM';

interface UpgradePromptProps {
  requiredTier: RequiredTier;
  feature: string;
  className?: string;
  variant?: 'inline' | 'card' | 'modal' | 'banner';
}

const tierInfo: Record<RequiredTier, { name: string; icon: React.ReactNode; color: string }> = {
  STANDARD: {
    name: 'Standard',
    icon: <Zap className="w-5 h-5" />,
    color: 'primary',
  },
  PREMIUM: {
    name: 'Premium',
    icon: <Crown className="w-5 h-5" />,
    color: 'purple',
  },
};

export default function UpgradePrompt({
  requiredTier,
  feature,
  className = '',
  variant = 'card',
}: UpgradePromptProps) {
  const tier = tierInfo[requiredTier];

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 ${className}`}
      >
        <Lock className="w-3.5 h-3.5" />
        <span>{tier.name} feature</span>
      </span>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`bg-gradient-to-r from-primary-600 to-purple-600 text-white px-4 py-3 rounded-lg ${className}`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {tier.icon}
            <span className="font-medium">
              Upgrade to {tier.name} to unlock {feature}
            </span>
          </div>
          <Link to="/pricing">
            <Button
              variant="outline"
              size="sm"
              className="!border-white !text-white hover:!bg-white/10"
            >
              View Plans <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div
      className={`bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center ${className}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
        <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {feature} requires {tier.name}
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Upgrade your plan to unlock this feature and take your learning to the next level.
      </p>

      <Link to="/pricing">
        <Button variant="primary" className="inline-flex items-center gap-2">
          Upgrade to {tier.name}
          {tier.icon}
        </Button>
      </Link>
    </div>
  );
}

// Helper hook to check if user has access to a tier
export function useTierAccess(userRole: string | undefined): {
  hasBasicAccess: boolean;
  hasStandardAccess: boolean;
  hasPremiumAccess: boolean;
  isAdmin: boolean;
} {
  // Normalize legacy roles
  const role = userRole === 'FREE' ? 'BASIC' : userRole === 'PRO' ? 'STANDARD' : userRole;

  const tierLevel: Record<string, number> = {
    BASIC: 1,
    STANDARD: 2,
    PREMIUM: 3,
    ADMIN: 4,
  };

  const level = tierLevel[role || 'BASIC'] || 1;

  return {
    hasBasicAccess: level >= 1,
    hasStandardAccess: level >= 2,
    hasPremiumAccess: level >= 3,
    isAdmin: level >= 4,
  };
}

// Feature-to-tier mapping for consistent gating
export const FEATURE_TIERS = {
  // Basic features (everyone)
  aiSummaries: 'BASIC',
  flashcards: 'BASIC',
  basicNotes: 'BASIC',
  basicQuizzes: 'BASIC',

  // Standard features
  privateCourses: 'STANDARD',
  shareLinks: 'STANDARD',
  increasedUploads: 'STANDARD',
  increasedAI: 'STANDARD',
  emailSupport: 'STANDARD',

  // Premium features
  aiTutor: 'PREMIUM',
  publicCourses: 'PREMIUM',
  unlimitedUploads: 'PREMIUM',
  unlimitedAI: 'PREMIUM',
  prioritySupport: 'PREMIUM',
  earlyAccess: 'PREMIUM',
} as const;

export type FeatureKey = keyof typeof FEATURE_TIERS;

export function canAccessFeature(userRole: string | undefined, feature: FeatureKey): boolean {
  const { hasBasicAccess, hasStandardAccess, hasPremiumAccess, isAdmin } = useTierAccess(userRole);
  const requiredTier = FEATURE_TIERS[feature];

  if (isAdmin) return true;

  switch (requiredTier) {
    case 'BASIC':
      return hasBasicAccess;
    case 'STANDARD':
      return hasStandardAccess;
    case 'PREMIUM':
      return hasPremiumAccess;
    default:
      return false;
  }
}
