-- Add new enum values for AI activity tracking
ALTER TYPE "StudyActivityType" ADD VALUE IF NOT EXISTS 'TTS_GENERATE';
ALTER TYPE "StudyActivityType" ADD VALUE IF NOT EXISTS 'STUDY_PACK_CREATE';
