-- CreateTable
CREATE TABLE "tutor_session_files" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tutor_session_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_session_files_sessionId_idx" ON "tutor_session_files"("sessionId");

-- CreateIndex
CREATE INDEX "tutor_session_files_fileId_idx" ON "tutor_session_files"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_session_files_sessionId_fileId_key" ON "tutor_session_files"("sessionId", "fileId");

-- AddForeignKey
ALTER TABLE "tutor_session_files" ADD CONSTRAINT "tutor_session_files_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "tutor_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_session_files" ADD CONSTRAINT "tutor_session_files_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "uploaded_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
