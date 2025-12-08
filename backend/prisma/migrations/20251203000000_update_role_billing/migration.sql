-- Update Role enum: Add new values (BASIC, STANDARD)
-- Note: ALTER TYPE ADD VALUE cannot run inside a transaction block
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BASIC' AND enumtypid = 'Role'::regtype) THEN
        ALTER TYPE "Role" ADD VALUE 'BASIC';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'STANDARD' AND enumtypid = 'Role'::regtype) THEN
        ALTER TYPE "Role" ADD VALUE 'STANDARD';
    END IF;
END $$;

-- Add BillingCycle enum
DO $$ BEGIN
    CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update existing users with old role values
UPDATE "users" SET "role" = 'BASIC' WHERE "role" = 'FREE';
UPDATE "users" SET "role" = 'STANDARD' WHERE "role" = 'PRO';

-- Update existing content with old role values  
UPDATE "content" SET "requiredRole" = 'BASIC' WHERE "requiredRole" = 'FREE';
UPDATE "content" SET "requiredRole" = 'STANDARD' WHERE "requiredRole" = 'PRO';

-- Add new columns to subscriptions table
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "planType" "Role" NOT NULL DEFAULT 'BASIC';
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY';
