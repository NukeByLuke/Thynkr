-- Check current values
SELECT DISTINCT "currentTier" FROM user_achievements;

-- Update BRONZE to COPPER
UPDATE user_achievements SET "currentTier" = 'COPPER' WHERE "currentTier" = 'BRONZE';

-- Update SILVER to GOLD  
UPDATE user_achievements SET "currentTier" = 'GOLD' WHERE "currentTier" = 'SILVER';

-- Verify
SELECT DISTINCT "currentTier" FROM user_achievements;
