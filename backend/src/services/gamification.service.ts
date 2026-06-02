/**
 * Gamification Service
 * Handles multi-tier achievement system and XP progression
 */

import { PrismaClient, AchievementTier } from '@prisma/client';

const prisma = new PrismaClient();

// ============ ACHIEVEMENT DEFINITIONS ============

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'study' | 'social' | 'skill' | 'streak' | 'content' | 'mastery';
  thresholds: {
    COPPER: number;
    GOLD: number;
    RUBY: number;
    AMETHYST: number;
    DIAMOND: number;
  };
  xpRewards: {
    COPPER: number;
    GOLD: number;
    RUBY: number;
    AMETHYST: number;
    DIAMOND: number;
  };
  isMastery?: boolean;
}

// Standard XP Rewards
const STD_XP = {
  COPPER: 100,
  GOLD: 250,
  RUBY: 500,
  AMETHYST: 1000,
  DIAMOND: 2500,
};

// Mastery XP Rewards (5x Standard approx, flattened for specific scaling)
const MASTERY_XP = {
  COPPER: 5000,
  GOLD: 10000,
  RUBY: 15000,
  AMETHYST: 20000,
  DIAMOND: 25000,
};

export const ACHIEVEMENTS: Record<string, AchievementDefinition> = {
  // ============ TIERED ACHIEVEMENTS (20) ============
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    description: 'Total hours spent studying',
    icon: 'book',
    category: 'study',
    thresholds: { COPPER: 10, GOLD: 50, RUBY: 100, AMETHYST: 500, DIAMOND: 1000 },
    xpRewards: STD_XP,
  },
  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Consecutive days of studying',
    icon: 'flame',
    category: 'streak',
    thresholds: { COPPER: 3, GOLD: 7, RUBY: 14, AMETHYST: 30, DIAMOND: 100 },
    xpRewards: STD_XP,
  },
  quiz_whiz: {
    id: 'quiz_whiz',
    name: 'Quiz Whiz',
    description: 'Perfect quiz scores achieved',
    icon: 'target',
    category: 'skill',
    thresholds: { COPPER: 1, GOLD: 5, RUBY: 10, AMETHYST: 25, DIAMOND: 50 },
    xpRewards: STD_XP,
  },
  librarian: {
    id: 'librarian',
    name: 'Librarian',
    description: 'Study materials uploaded',
    icon: 'library',
    category: 'content',
    thresholds: { COPPER: 5, GOLD: 20, RUBY: 50, AMETHYST: 150, DIAMOND: 500 },
    xpRewards: STD_XP,
  },
  socialite: {
    id: 'socialite',
    name: 'Socialite',
    description: 'Study sessions shared with others',
    icon: 'share-2',
    category: 'social',
    thresholds: { COPPER: 3, GOLD: 10, RUBY: 25, AMETHYST: 75, DIAMOND: 200 },
    xpRewards: STD_XP,
  },
  speed_demon: {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Complete quizzes quickly (under 5-10 seconds per question)',
    icon: 'zap',
    category: 'skill',
    thresholds: { COPPER: 10, GOLD: 50, RUBY: 150, AMETHYST: 500, DIAMOND: 1500 },
    xpRewards: STD_XP,
  },
  note_taker: {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'AI-generated notes created',
    icon: 'file-text',
    category: 'content',
    thresholds: { COPPER: 5, GOLD: 25, RUBY: 75, AMETHYST: 200, DIAMOND: 600 },
    xpRewards: STD_XP,
  },
  flashcard_master: {
    id: 'flashcard_master',
    name: 'Flashcard Master',
    description: 'Flashcard sets completed',
    icon: 'layers',
    category: 'study',
    thresholds: { COPPER: 3, GOLD: 15, RUBY: 40, AMETHYST: 120, DIAMOND: 350 },
    xpRewards: STD_XP,
  },

  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Study sessions started before 8 AM',
    icon: 'sun',
    category: 'streak',
    thresholds: { COPPER: 5, GOLD: 15, RUBY: 35, AMETHYST: 100, DIAMOND: 300 },
    xpRewards: STD_XP,
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Study sessions after 10 PM',
    icon: 'moon',
    category: 'streak',
    thresholds: { COPPER: 5, GOLD: 15, RUBY: 35, AMETHYST: 100, DIAMOND: 300 },
    xpRewards: STD_XP,
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Hard difficulty quizzes completed with 100% score',
    icon: 'award',
    category: 'skill',
    thresholds: { COPPER: 1, GOLD: 3, RUBY: 8, AMETHYST: 20, DIAMOND: 50 },
    xpRewards: STD_XP,
  },
  course_creator: {
    id: 'course_creator',
    name: 'Course Creator',
    description: 'Study courses created',
    icon: 'graduation-cap',
    category: 'content',
    thresholds: { COPPER: 1, GOLD: 3, RUBY: 8, AMETHYST: 20, DIAMOND: 50 },
    xpRewards: STD_XP,
  },
  marathon_runner: {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Single study sessions over 2 hours',
    icon: 'clock',
    category: 'study',
    thresholds: { COPPER: 1, GOLD: 5, RUBY: 15, AMETHYST: 40, DIAMOND: 100 },
    xpRewards: STD_XP,
  },
  consistent_learner: {
    id: 'consistent_learner',
    name: 'Consistent Learner',
    description: 'Weeks with at least 5 study days',
    icon: 'calendar',
    category: 'streak',
    thresholds: { COPPER: 2, GOLD: 6, RUBY: 15, AMETHYST: 35, DIAMOND: 80 },
    xpRewards: STD_XP,
  },

  knowledge_seeker: {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    description: 'Unique topics studied',
    icon: 'search',
    category: 'study',
    thresholds: { COPPER: 5, GOLD: 15, RUBY: 40, AMETHYST: 100, DIAMOND: 250 },
    xpRewards: STD_XP,
  },
  summary_specialist: {
    id: 'summary_specialist',
    name: 'Summary Specialist',
    description: 'AI summaries generated',
    icon: 'file-text',
    category: 'content',
    thresholds: { COPPER: 10, GOLD: 40, RUBY: 100, AMETHYST: 300, DIAMOND: 800 },
    xpRewards: STD_XP,
  },
  community_helper: {
    id: 'community_helper',
    name: 'Community Helper',
    description: 'Study packs shared publicly',
    icon: 'heart',
    category: 'social',
    thresholds: { COPPER: 2, GOLD: 8, RUBY: 20, AMETHYST: 50, DIAMOND: 150 },
    xpRewards: STD_XP,
  },
  multilingual: {
    id: 'multilingual',
    name: 'Multilingual',
    description: 'Different languages used for study materials',
    icon: 'globe',
    category: 'skill',
    thresholds: { COPPER: 2, GOLD: 3, RUBY: 5, AMETHYST: 8, DIAMOND: 12 },
    xpRewards: STD_XP,
  },

  // ============ MASTERY ACHIEVEMENTS (5) ============
  mastery_scholar: {
    id: 'mastery_scholar',
    name: 'Scholar Mastery',
    description: 'Achieve ultimate study dedication - 5000 total study hours',
    icon: 'crown',
    category: 'mastery',
    thresholds: { COPPER: 5000, GOLD: 5000, RUBY: 5000, DIAMOND: 5000, AMETHYST: 5000 },
    xpRewards: MASTERY_XP,
    isMastery: true,
  },
  mastery_perfectionist: {
    id: 'mastery_perfectionist',
    name: 'Perfect Mastery',
    description: 'The ultimate perfectionist - 500 perfect hard quiz scores',
    icon: 'trophy',
    category: 'mastery',
    thresholds: { COPPER: 500, GOLD: 500, RUBY: 500, DIAMOND: 500, AMETHYST: 500 },
    xpRewards: MASTERY_XP,
    isMastery: true,
  },
  mastery_streak: {
    id: 'mastery_streak',
    name: 'Eternal Flame',
    description: 'Never let the flame die - 365 day study streak',
    icon: 'flame',
    category: 'mastery',
    thresholds: { COPPER: 365, GOLD: 365, RUBY: 365, DIAMOND: 365, AMETHYST: 365 },
    xpRewards: MASTERY_XP,
    isMastery: true,
  },
  mastery_content: {
    id: 'mastery_content',
    name: 'Content King',
    description: 'Master of creation - 1000 study materials created',
    icon: 'crown',
    category: 'mastery',
    thresholds: { COPPER: 1000, GOLD: 1000, RUBY: 1000, DIAMOND: 1000, AMETHYST: 1000 },
    xpRewards: MASTERY_XP,
    isMastery: true,
  },
  mastery_social: {
    id: 'mastery_social',
    name: 'Community Legend',
    description: 'Inspire the world - 500 materials shared publicly',
    icon: 'trophy',
    category: 'mastery',
    thresholds: { COPPER: 500, GOLD: 500, RUBY: 500, DIAMOND: 500, AMETHYST: 500 },
    xpRewards: MASTERY_XP,
    isMastery: true,
  },
};

// ============ ACHIEVEMENT TRACKING ACTIONS ============

export type AchievementAction =
  | 'study_hours'
  | 'study_streak'
  | 'quiz_perfect'
  | 'file_upload'
  | 'session_share'
  | 'quick_answer'
  | 'notes_created'
  | 'flashcard_completed'

  | 'early_study'
  | 'night_study'
  | 'hard_quiz_perfect'
  | 'course_created'
  | 'long_session'
  | 'weekly_consistency'

  | 'topic_studied'
  | 'summary_created'
  | 'pack_shared'
  | 'language_used';

const ACTION_TO_ACHIEVEMENT_MAP: Record<AchievementAction, string> = {
  study_hours: 'scholar',
  study_streak: 'streak_master',
  quiz_perfect: 'quiz_whiz',
  file_upload: 'librarian',
  session_share: 'socialite',
  quick_answer: 'speed_demon',
  notes_created: 'note_taker',
  flashcard_completed: 'flashcard_master',

  early_study: 'early_bird',
  night_study: 'night_owl',
  hard_quiz_perfect: 'perfectionist',
  course_created: 'course_creator',
  long_session: 'marathon_runner',
  weekly_consistency: 'consistent_learner',

  topic_studied: 'knowledge_seeker',
  summary_created: 'summary_specialist',
  pack_shared: 'community_helper',
  language_used: 'multilingual',
};

// ============ TIER ORDERING ============

const TIER_ORDER: AchievementTier[] = ['COPPER', 'GOLD', 'RUBY', 'AMETHYST', 'DIAMOND'];

function getNextTier(currentTier: AchievementTier): AchievementTier | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  if (currentIndex === -1 || currentIndex === TIER_ORDER.length - 1) {
    return null; // Already at max tier
  }
  return TIER_ORDER[currentIndex + 1];
}

// ============ MAIN ACHIEVEMENT CHECKING FUNCTION ============

export async function checkAchievements(
  userId: string,
  actionType: AchievementAction,
  value: number = 1
): Promise<{
  tierUnlocked: boolean;
  achievementId?: string;
  newTier?: AchievementTier;
  xpAwarded?: number;
  achievementName?: string;
  leveledUp?: boolean;
  newLevel?: number;
}> {
  const achievementId = ACTION_TO_ACHIEVEMENT_MAP[actionType];
  
  if (!achievementId || !ACHIEVEMENTS[achievementId]) {
    return { tierUnlocked: false };
  }

  const achievement = ACHIEVEMENTS[achievementId];

  try {
    // Use transaction to ensure data integrity between achievement and XP updates
    const result = await prisma.$transaction(async (tx) => {
      // Get or create user achievement record
      let userAchievement = await tx.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId,
          },
        },
      });

      // Track the previous value to detect threshold crossings
      const previousValue = userAchievement?.currentValue ?? 0;

      // Create if doesn't exist
      if (!userAchievement) {
        userAchievement = await tx.userAchievement.create({
          data: {
            userId,
            achievementId,
            currentTier: 'COPPER',
            currentValue: value,
          },
        });
      } else {
        // Update current value
        userAchievement = await tx.userAchievement.update({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
          data: {
            currentValue: userAchievement.currentValue + value,
          },
        });
      }

      // Check if user has reached next tier threshold (support multiple tier jumps)
      const tiersUnlocked: { tier: AchievementTier; xp: number }[] = [];
      
      // Find the highest tier the user qualifies for based on currentValue
      let highestQualifiedTier: AchievementTier | null = null;
      
      for (const tier of TIER_ORDER) {
        const threshold = achievement.thresholds[tier];
        if (userAchievement.currentValue >= threshold) {
          highestQualifiedTier = tier;
        } else {
          break; // Tiers are ordered, so stop once we fail a threshold
        }
      }
      
      // If the user qualifies for a tier higher than their current stored tier,
      // OR if they just crossed the BRONZE threshold for the first time
      if (highestQualifiedTier) {
        const currentTierIndex = TIER_ORDER.indexOf(userAchievement.currentTier);
        const qualifiedTierIndex = TIER_ORDER.indexOf(highestQualifiedTier);
        
        // Check if this is the first time crossing the BRONZE threshold
        const bronzeThreshold = achievement.thresholds.COPPER;
        const justCrossedBronze = 
          previousValue < bronzeThreshold && 
          userAchievement.currentValue >= bronzeThreshold;
        
        // If we found a higher tier than currently saved
        if (qualifiedTierIndex > currentTierIndex) {
          // User has progressed to higher tiers - award all tiers from current+1 to qualified
          for (let i = currentTierIndex + 1; i <= qualifiedTierIndex; i++) {
            const tier = TIER_ORDER[i];
            tiersUnlocked.push({
              tier,
              xp: achievement.xpRewards[tier],
            });
          }
        } else if (justCrossedBronze && userAchievement.currentTier === 'COPPER') {
          // Special case: First time crossing Bronze threshold
          // (currentTier is already BRONZE as default, but they just actually earned it)
          tiersUnlocked.push({
            tier: 'COPPER',
            xp: achievement.xpRewards.COPPER,
          });
        }
      }
      
      // If tiers were unlocked, update the database
      if (tiersUnlocked.length > 0) {
        const highestTierUnlocked = tiersUnlocked[tiersUnlocked.length - 1];
        const totalXpAwarded = tiersUnlocked.reduce((sum, t) => sum + t.xp, 0);
        
        // Update to highest tier achieved
        await tx.userAchievement.update({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
          data: {
            currentTier: highestTierUnlocked.tier,
          },
        });

        // Award total XP from all tiers
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            xp: {
              increment: totalXpAwarded,
            },
            lastXpGain: new Date(),
          },
          select: { xp: true, level: true },
        });

        // Calculate new level based on XP
        const newLevel = calculateLevel(updatedUser.xp);
        let leveledUp = false;
        let newLevelValue = updatedUser.level;
        
        if (newLevel > updatedUser.level) {
          await tx.user.update({
            where: { id: userId },
            data: { level: newLevel },
          });
          leveledUp = true;
          newLevelValue = newLevel;
        }

        return {
          tierUnlocked: true,
          achievementId,
          newTier: highestTierUnlocked.tier,
          xpAwarded: totalXpAwarded,
          achievementName: achievement.name,
          leveledUp,
          newLevel: leveledUp ? newLevelValue : undefined,
        };
      }

      return { tierUnlocked: false };
    });

    return result;
  } catch (error) {
    console.error('Error checking achievements:', error);
    return { tierUnlocked: false };
  }
}

// ============ XP & LEVEL CALCULATION ============

/**
 * Calculate user level based on total XP
 * Formula: Level = floor(sqrt(XP / 18)) + 1
 * Tuned so that ~176,000 XP (All Achievements) = Level 100
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 18)) + 1;
}

/**
 * Calculate XP required for a specific level
 */
export function xpForLevel(level: number): number {
  return Math.pow(level - 1, 2) * 18;
}

/**
 * Get XP progress for current level
 */
export function getLevelProgress(xp: number): {
  currentLevel: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercentage: number;
} {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpRequiredForNextLevel = nextLevelXp - currentLevelXp;
  const progressPercentage = (xpInCurrentLevel / xpRequiredForNextLevel) * 100;

  return {
    currentLevel,
    currentLevelXp,
    nextLevelXp,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}

// ============ HELPER FUNCTIONS ============

/**
 * Get all achievements for a user
 */
export async function getUserAchievements(userId: string) {
  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
  });

  // Create a map of user's current progress
  const progressMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua])
  );

  // Return all achievements with user's progress data
  return Object.values(ACHIEVEMENTS).map((achievement) => {
    const userProgress = progressMap.get(achievement.id);

    if (userProgress) {
      // User has progress on this achievement
      const nextTier = getNextTier(userProgress.currentTier);
      const nextThreshold = nextTier ? achievement.thresholds[nextTier] : null;

      return {
        ...userProgress,
        definition: achievement,
        progress: nextThreshold
          ? {
              current: userProgress.currentValue,
              required: nextThreshold,
              percentage: Math.min(100, (userProgress.currentValue / nextThreshold) * 100),
            }
          : null,
      };
    } else {
      // User hasn't started this achievement yet
      return {
        id: `temp-${achievement.id}`, // Temporary ID for frontend
        achievementId: achievement.id,
        userId,
        currentTier: null,
        currentValue: 0,
        unlockedAt: null,
        updatedAt: new Date(),
        definition: achievement,
        progress: {
          current: 0,
          required: achievement.thresholds.COPPER,
          percentage: 0,
        },
      };
    }
  });
}

/**
 * Get all available achievement definitions
 */
export function getAllAchievementDefinitions() {
  return Object.values(ACHIEVEMENTS);
}

export default {
  checkAchievements,
  getUserAchievements,
  getAllAchievementDefinitions,
  calculateLevel,
  xpForLevel,
  getLevelProgress,
  ACHIEVEMENTS,
};
