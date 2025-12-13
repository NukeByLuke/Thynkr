/**
 * useGameAccess Hook
 * Manages game access logic including daily credits for free users
 * and hosting restrictions for multiplayer games.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// =============================================================================
// Constants
// =============================================================================

const DAILY_GAME_CREDITS = 3;
const CREDITS_STORAGE_KEY = 'thynkr_game_credits';

interface StoredCredits {
  credits: number;
  date: string; // ISO date string (YYYY-MM-DD)
}

// =============================================================================
// Types
// =============================================================================

export type AccessCheckResult =
  | { allowed: true }
  | { allowed: false; reason: 'no_credits' | 'hosting_restricted' };

export type TierType = 'FREE' | 'PRO';

export interface GameAccessState {
  /** User's current tier */
  tier: TierType;
  /** Remaining daily credits for solo games (Free tier only) */
  creditsRemaining: number;
  /** Total daily credits allowed */
  creditsTotal: number;
  /** Whether user can host multiplayer games */
  canHost: boolean;
  /** Check if user can play a solo game (consumes a credit if Free) */
  checkSoloAccess: () => AccessCheckResult;
  /** Check if user can host a multiplayer game */
  checkHostAccess: () => AccessCheckResult;
  /** Consume a credit when starting a solo game */
  consumeCredit: () => void;
  /** Show upgrade modal state */
  showUpgradeModal: boolean;
  /** Reason for showing modal */
  upgradeReason: 'no_credits' | 'hosting_restricted' | null;
  /** Open the upgrade modal with a specific reason */
  openUpgradeModal: (reason: 'no_credits' | 'hosting_restricted') => void;
  /** Close the upgrade modal */
  closeUpgradeModal: () => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getStoredCredits(): StoredCredits {
  try {
    const stored = localStorage.getItem(CREDITS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as StoredCredits;
      // Check if it's still today
      if (parsed.date === getTodayDateString()) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  // Reset to full credits for a new day
  return { credits: DAILY_GAME_CREDITS, date: getTodayDateString() };
}

function setStoredCredits(credits: number): void {
  const data: StoredCredits = {
    credits,
    date: getTodayDateString(),
  };
  localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(data));
}

// =============================================================================
// Hook Implementation
// =============================================================================

export function useGameAccess(): GameAccessState {
  const { user } = useAuth();

  // Determine tier based on user role
  const tier: TierType = useMemo(() => {
    if (!user) return 'FREE';
    return ['STANDARD', 'PREMIUM', 'ADMIN'].includes(user.role) ? 'PRO' : 'FREE';
  }, [user]);

  // Credits state (only relevant for FREE tier)
  const [creditsRemaining, setCreditsRemaining] = useState<number>(() => {
    if (tier === 'PRO') return DAILY_GAME_CREDITS;
    return getStoredCredits().credits;
  });

  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'no_credits' | 'hosting_restricted' | null>(
    null
  );

  // Sync credits from localStorage on mount and when tier changes
  useEffect(() => {
    if (tier === 'FREE') {
      const stored = getStoredCredits();
      setCreditsRemaining(stored.credits);
    } else {
      // Pro users always have full credits (unlimited)
      setCreditsRemaining(DAILY_GAME_CREDITS);
    }
  }, [tier]);

  // Check if user can play a solo game
  const checkSoloAccess = useCallback((): AccessCheckResult => {
    // Pro users always have access
    if (tier === 'PRO') {
      return { allowed: true };
    }

    // Free users need credits
    if (creditsRemaining <= 0) {
      return { allowed: false, reason: 'no_credits' };
    }

    return { allowed: true };
  }, [tier, creditsRemaining]);

  // Check if user can host a multiplayer game
  const checkHostAccess = useCallback((): AccessCheckResult => {
    // Only Pro users can host
    if (tier === 'PRO') {
      return { allowed: true };
    }

    return { allowed: false, reason: 'hosting_restricted' };
  }, [tier]);

  // Consume a credit when starting a solo game
  const consumeCredit = useCallback(() => {
    // Pro users don't consume credits
    if (tier === 'PRO') return;

    const newCredits = Math.max(0, creditsRemaining - 1);
    setCreditsRemaining(newCredits);
    setStoredCredits(newCredits);
  }, [tier, creditsRemaining]);

  // Modal controls
  const openUpgradeModal = useCallback((reason: 'no_credits' | 'hosting_restricted') => {
    setUpgradeReason(reason);
    setShowUpgradeModal(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setShowUpgradeModal(false);
    setUpgradeReason(null);
  }, []);

  // Can host is true only for Pro users
  const canHost = tier === 'PRO';

  return {
    tier,
    creditsRemaining,
    creditsTotal: DAILY_GAME_CREDITS,
    canHost,
    checkSoloAccess,
    checkHostAccess,
    consumeCredit,
    showUpgradeModal,
    upgradeReason,
    openUpgradeModal,
    closeUpgradeModal,
  };
}

export default useGameAccess;
