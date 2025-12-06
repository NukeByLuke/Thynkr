-- CreateTable
CREATE TABLE "study_cache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "fileIds" TEXT[],
    "fileHash" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "study_cache_userId_idx" ON "study_cache"("userId");

-- CreateIndex
CREATE INDEX "study_cache_courseId_idx" ON "study_cache"("courseId");

-- CreateIndex
CREATE INDEX "study_cache_fileHash_idx" ON "study_cache"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "study_cache_userId_courseId_fileHash_type_key" ON "study_cache"("userId", "courseId", "fileHash", "type");
