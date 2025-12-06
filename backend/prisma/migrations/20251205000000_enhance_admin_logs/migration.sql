-- Add new fields to admin_logs table
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "userRole" TEXT;
ALTER TABLE "admin_logs" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUCCESS';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS "admin_logs_action_idx" ON "admin_logs"("action");
CREATE INDEX IF NOT EXISTS "admin_logs_status_idx" ON "admin_logs"("status");
