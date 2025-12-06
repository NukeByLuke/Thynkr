-- CreateTable
CREATE TABLE "course_file_ai" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "extractedText" TEXT,
    "summary" JSONB,
    "notes" JSONB,
    "quiz" JSONB,
    "cards" JSONB,
    "summaryGeneratedAt" TIMESTAMP(3),
    "notesGeneratedAt" TIMESTAMP(3),
    "quizGeneratedAt" TIMESTAMP(3),
    "cardsGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_file_ai_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_file_ai_fileId_key" ON "course_file_ai"("fileId");

-- CreateIndex
CREATE INDEX "course_file_ai_fileId_idx" ON "course_file_ai"("fileId");

-- AddForeignKey
ALTER TABLE "course_file_ai" ADD CONSTRAINT "course_file_ai_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "course_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
