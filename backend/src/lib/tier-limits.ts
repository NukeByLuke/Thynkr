// Tier-based usage limits and configuration
import prisma from '../db/client';
import { normalizeRole } from '../middleware/auth.middleware';

export interface TierLimits {
  uploadsPerMonth: number;
  aiRequestsPerMonth: number;
  ttsMaxCharactersPerRequest: number;
  ttsMaxRequestsPerDay: number;
  canCreatePrivateCourses: boolean;
  canCreatePublicCourses: boolean;
  canUseTutor: boolean;
  hasEmailSupport: boolean;
  hasPrioritySupport: boolean;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  BASIC: {
    uploadsPerMonth: 5,
    aiRequestsPerMonth: 50,
    ttsMaxCharactersPerRequest: 500,
    ttsMaxRequestsPerDay: 10,
    canCreatePrivateCourses: false,
    canCreatePublicCourses: false,
    canUseTutor: false,
    hasEmailSupport: false,
    hasPrioritySupport: false,
  },
  STANDARD: {
    uploadsPerMonth: 50,
    aiRequestsPerMonth: 500,
    ttsMaxCharactersPerRequest: 2000,
    ttsMaxRequestsPerDay: 100,
    canCreatePrivateCourses: true,
    canCreatePublicCourses: false,
    canUseTutor: false,
    hasEmailSupport: true,
    hasPrioritySupport: false,
  },
  PREMIUM: {
    uploadsPerMonth: -1, // unlimited
    aiRequestsPerMonth: -1, // unlimited
    ttsMaxCharactersPerRequest: -1, // unlimited
    ttsMaxRequestsPerDay: -1, // unlimited
    canCreatePrivateCourses: true,
    canCreatePublicCourses: true,
    canUseTutor: true,
    hasEmailSupport: true,
    hasPrioritySupport: true,
  },
  ADMIN: {
    uploadsPerMonth: -1,
    aiRequestsPerMonth: -1,
    ttsMaxCharactersPerRequest: -1,
    ttsMaxRequestsPerDay: -1,
    canCreatePrivateCourses: true,
    canCreatePublicCourses: true,
    canUseTutor: true,
    hasEmailSupport: true,
    hasPrioritySupport: true,
  },
};

export function getTierLimits(role: string): TierLimits {
  const normalizedRole = normalizeRole(role);
  return TIER_LIMITS[normalizedRole] || TIER_LIMITS.BASIC;
}

export async function getMonthlyUploadCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const count = await prisma.uploadedFile.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  return count;
}

export async function getMonthlyAIRequestCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Count study sessions that use AI (summary, notes, quiz, flashcards, tutor)
  const count = await prisma.studySession.count({
    where: {
      userId,
      activityType: {
        in: ['SUMMARY_VIEW', 'NOTES_VIEW', 'QUIZ_ATTEMPT', 'FLASHCARD_STUDY', 'TUTOR_CHAT'],
      },
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  return count;
}

export async function canUploadFile(
  userId: string,
  role: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const limits = getTierLimits(role);

  if (limits.uploadsPerMonth === -1) {
    return { allowed: true };
  }

  const currentCount = await getMonthlyUploadCount(userId);
  const remaining = limits.uploadsPerMonth - currentCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Monthly upload limit reached (${limits.uploadsPerMonth} files). Upgrade to get more uploads.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining };
}

export async function canUseAI(
  userId: string,
  role: string
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const limits = getTierLimits(role);

  if (limits.aiRequestsPerMonth === -1) {
    return { allowed: true };
  }

  const currentCount = await getMonthlyAIRequestCount(userId);
  const remaining = limits.aiRequestsPerMonth - currentCount;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Monthly AI usage limit reached (${limits.aiRequestsPerMonth} requests). Upgrade to get more AI power.`,
      remaining: 0,
    };
  }

  return { allowed: true, remaining };
}

/**
 * Get TTS request count for today
 */
export async function getDailyTTSRequestCount(userId: string): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.studySession.count({
    where: {
      userId,
      activityType: 'TTS_GENERATE',
      createdAt: {
        gte: startOfDay,
      },
    },
  });

  return count;
}

/**
 * Check if user can use TTS with text of given length
 */
export async function canUseTTS(
  userId: string,
  role: string,
  textLength: number
): Promise<{ allowed: boolean; reason?: string; remaining?: number }> {
  const limits = getTierLimits(role);

  // Check character limit per request
  if (limits.ttsMaxCharactersPerRequest !== -1 && textLength > limits.ttsMaxCharactersPerRequest) {
    return {
      allowed: false,
      reason: `Text too long. Maximum ${limits.ttsMaxCharactersPerRequest} characters allowed for your plan.`,
      remaining: 0,
    };
  }

  // Check daily request limit
  if (limits.ttsMaxRequestsPerDay !== -1) {
    const currentCount = await getDailyTTSRequestCount(userId);
    const remaining = limits.ttsMaxRequestsPerDay - currentCount;

    if (remaining <= 0) {
      return {
        allowed: false,
        reason: `Daily TTS limit reached (${limits.ttsMaxRequestsPerDay} requests). Upgrade to get unlimited voice generation.`,
        remaining: 0,
      };
    }

    return { allowed: true, remaining };
  }

  return { allowed: true };
}

export interface UsageStats {
  uploads: {
    used: number;
    limit: number;
    remaining: number;
    unlimited: boolean;
  };
  aiRequests: {
    used: number;
    limit: number;
    remaining: number;
    unlimited: boolean;
  };
  features: {
    privateCourses: boolean;
    publicCourses: boolean;
    aiTutor: boolean;
    emailSupport: boolean;
    prioritySupport: boolean;
  };
}

export async function getUserUsageStats(userId: string, role: string): Promise<UsageStats> {
  const limits = getTierLimits(role);
  const uploadCount = await getMonthlyUploadCount(userId);
  const aiCount = await getMonthlyAIRequestCount(userId);

  return {
    uploads: {
      used: uploadCount,
      limit: limits.uploadsPerMonth,
      remaining:
        limits.uploadsPerMonth === -1 ? -1 : Math.max(0, limits.uploadsPerMonth - uploadCount),
      unlimited: limits.uploadsPerMonth === -1,
    },
    aiRequests: {
      used: aiCount,
      limit: limits.aiRequestsPerMonth,
      remaining:
        limits.aiRequestsPerMonth === -1 ? -1 : Math.max(0, limits.aiRequestsPerMonth - aiCount),
      unlimited: limits.aiRequestsPerMonth === -1,
    },
    features: {
      privateCourses: limits.canCreatePrivateCourses,
      publicCourses: limits.canCreatePublicCourses,
      aiTutor: limits.canUseTutor,
      emailSupport: limits.hasEmailSupport,
      prioritySupport: limits.hasPrioritySupport,
    },
  };
}
