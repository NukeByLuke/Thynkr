/*
  Warnings:

  - You are about to drop the `tutor_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tutor_session_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tutor_sessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "tutor_messages" DROP CONSTRAINT "tutor_messages_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_session_files" DROP CONSTRAINT "tutor_session_files_fileId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_session_files" DROP CONSTRAINT "tutor_session_files_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_sessions" DROP CONSTRAINT "tutor_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "file_notes" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "file_summaries" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "flashcard_sets" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferredLanguage" TEXT NOT NULL DEFAULT 'en';

-- DropTable
DROP TABLE "tutor_messages";

-- DropTable
DROP TABLE "tutor_session_files";

-- DropTable
DROP TABLE "tutor_sessions";
