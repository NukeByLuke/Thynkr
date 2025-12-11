-- Update Role enum: Add new values (BASIC, STANDARD)
-- These are safe to run - they add new enum values
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'BASIC';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'STANDARD';

-- Add BillingCycle enum
DO $$ BEGIN
    CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- NOTE: Cannot update to new enum values in same transaction
-- New users will use BASIC by default, existing FREE/PRO users keep their values
-- A separate data migration can be run later if needed

-- Add new columns to subscriptions table (use FREE as safe default since it exists)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "planType" "Role" NOT NULL DEFAULT 'FREE';
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';
