-- Drop old CourseLesson table and rebuild Course system
-- This migration resets the course system for user-created courses

-- Drop course_lessons table if exists
DROP TABLE IF EXISTS "course_lessons" CASCADE;

-- Drop old course_files table
DROP TABLE IF EXISTS "course_files" CASCADE;

-- Drop courses table to rebuild
DROP TABLE IF EXISTS "courses" CASCADE;

-- Create CourseCategory enum
DO $$ BEGIN
    CREATE TYPE "CourseCategory" AS ENUM ('MATHEMATICS', 'SCIENCE', 'TECHNOLOGY', 'ENGINEERING', 'LANGUAGES', 'HUMANITIES', 'BUSINESS', 'ARTS', 'HEALTH', 'LAW', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure CourseVisibility enum exists
DO $$ BEGIN
    CREATE TYPE "CourseVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create new courses table
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "bannerImage" TEXT,
    "coverImage" TEXT,
    "category" "CourseCategory" NOT NULL DEFAULT 'OTHER',
    "visibility" "CourseVisibility" NOT NULL DEFAULT 'PRIVATE',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- Create new course_files table
CREATE TABLE "course_files" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_files_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX "courses_slug_key" ON "courses"("slug");
CREATE UNIQUE INDEX "courses_shareToken_key" ON "courses"("shareToken");

-- Add indexes
CREATE INDEX "courses_slug_idx" ON "courses"("slug");
CREATE INDEX "courses_visibility_idx" ON "courses"("visibility");
CREATE INDEX "courses_published_idx" ON "courses"("published");
CREATE INDEX "courses_createdBy_idx" ON "courses"("createdBy");
CREATE INDEX "courses_shareToken_idx" ON "courses"("shareToken");
CREATE INDEX "courses_category_idx" ON "courses"("category");
CREATE INDEX "course_files_courseId_idx" ON "course_files"("courseId");

-- Add foreign keys
ALTER TABLE "courses" ADD CONSTRAINT "courses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_files" ADD CONSTRAINT "course_files_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
