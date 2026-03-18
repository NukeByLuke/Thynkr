-- Add account-synced correct-answer sound preference
ALTER TABLE "users"
ADD COLUMN "quizCorrectSound" TEXT NOT NULL DEFAULT 'spark';
