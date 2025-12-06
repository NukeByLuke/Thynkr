-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "logoImage" TEXT;

-- CreateIndex
CREATE INDEX "course_lessons_courseId_idx" ON "course_lessons"("courseId");

-- CreateIndex
CREATE INDEX "course_lessons_fileId_idx" ON "course_lessons"("fileId");
