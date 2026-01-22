-- Fix AchievementTier enum: Final fix with proper default handling

-- First, remove the default constraint
ALTER TABLE user_achievements ALTER COLUMN "currentTier" DROP DEFAULT;

-- Convert to text
ALTER TABLE user_achievements ALTER COLUMN "currentTier" TYPE text;

-- Update values if needed (already done, but let's make sure)
UPDATE user_achievements SET "currentTier" = 'COPPER' WHERE "currentTier" = 'BRONZE';
UPDATE user_achievements SET "currentTier" = 'GOLD' WHERE "currentTier" = 'SILVER';

-- Drop the old enum type with cascade
DROP TYPE IF EXISTS "AchievementTier" CASCADE;

-- Create new enum type
CREATE TYPE "AchievementTier" AS ENUM ('COPPER', 'GOLD', 'RUBY', 'AMETHYST', 'DIAMOND');

-- Convert column back to enum
ALTER TABLE user_achievements ALTER COLUMN "currentTier" TYPE "AchievementTier" USING "currentTier"::"AchievementTier";

-- Re-add the default
ALTER TABLE user_achievements ALTER COLUMN "currentTier" SET DEFAULT 'COPPER'::"AchievementTier";

-- Verify
SELECT DISTINCT "currentTier" FROM user_achievements;
