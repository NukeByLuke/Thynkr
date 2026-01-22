-- Fix AchievementTier enum: rename BRONZE -> COPPER and SILVER -> GOLD
-- This migration updates existing data to use the new tier names

-- Step 1: Add new enum values
ALTER TYPE "AchievementTier" ADD VALUE IF NOT EXISTS 'COPPER';
ALTER TYPE "AchievementTier" ADD VALUE IF NOT EXISTS 'AMETHYST';

-- Step 2: Update existing data (BRONZE -> COPPER, SILVER stays as GOLD is already there)
-- Note: We can't directly rename enum values in PostgreSQL, so we need to:
-- 1. Create a new enum type
-- 2. Update the column to use text temporarily
-- 3. Update values
-- 4. Create new enum and update column

-- Actually, let's just update the data using text conversion
ALTER TABLE user_achievements ALTER COLUMN "currentTier" TYPE text;

-- Update the values
UPDATE user_achievements SET "currentTier" = 'COPPER' WHERE "currentTier" = 'BRONZE';
UPDATE user_achievements SET "currentTier" = 'GOLD' WHERE "currentTier" = 'SILVER';

-- Drop old enum and create new one
DROP TYPE IF EXISTS "AchievementTier_new";
CREATE TYPE "AchievementTier_new" AS ENUM ('COPPER', 'GOLD', 'RUBY', 'AMETHYST', 'DIAMOND');

-- Convert back to enum
ALTER TABLE user_achievements ALTER COLUMN "currentTier" TYPE "AchievementTier_new" USING "currentTier"::"AchievementTier_new";

-- Drop old enum and rename new one
DROP TYPE "AchievementTier";
ALTER TYPE "AchievementTier_new" RENAME TO "AchievementTier";
