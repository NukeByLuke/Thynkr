-- Add visibility and shareToken to courses
-- Add CourseFile model for user-uploaded course files

-- Add new enum for course visibility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CourseVisibility') THEN
    CREATE TYPE "CourseVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
  END IF;
END
$$;

-- Add visibility column to courses (default to PRIVATE for existing courses)
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "visibility" "CourseVisibility" NOT NULL DEFAULT 'PRIVATE';

-- Add shareToken for private course sharing
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

-- Create unique index on shareToken
CREATE UNIQUE INDEX IF NOT EXISTS "courses_shareToken_key" ON "courses"("shareToken");

-- Create index on visibility
CREATE INDEX IF NOT EXISTS "courses_visibility_idx" ON "courses"("visibility");

-- Create CourseFile table
CREATE TABLE IF NOT EXISTS "course_files" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_files_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'course_files_courseId_fkey'
  ) THEN
    ALTER TABLE "course_files" ADD CONSTRAINT "course_files_courseId_fkey" 
      FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- Create index on courseId
CREATE INDEX IF NOT EXISTS "course_files_courseId_idx" ON "course_files"("courseId");

-- Generate share tokens for existing courses that don't have one (using md5 + random)
UPDATE "courses" SET "shareToken" = md5(random()::text || clock_timestamp()::text) WHERE "shareToken" IS NULL;

