-- Adjust unique constraints to support language-specific summaries and notes

-- Drop previous unique constraints on file summaries and notes
DROP INDEX IF EXISTS "file_summaries_fileId_key";
DROP INDEX IF EXISTS "file_notes_fileId_key";

-- Create new composite unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "file_summaries_fileId_language_key" ON "file_summaries"("fileId", "language");
CREATE UNIQUE INDEX IF NOT EXISTS "file_notes_fileId_language_key" ON "file_notes"("fileId", "language");
