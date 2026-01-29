/*
  Warnings:

  - The values [FREE,PRO] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [TUTOR_CHAT] on the enum `StudyActivityType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `game_players` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `game_questions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `game_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `games` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tutor_messages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tutor_session_files` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tutor_sessions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[appleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('COPPER', 'GOLD', 'RUBY', 'AMETHYST', 'DIAMOND');

-- CreateEnum
CREATE TYPE "FileAccessType" AS ENUM ('INTERNAL', 'DOWNLOADABLE');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM', 'ADMIN');
ALTER TABLE "content" ALTER COLUMN "requiredRole" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "planType" DROP DEFAULT;
ALTER TABLE "subscriptions" ALTER COLUMN "planType" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "subscriptions" ALTER COLUMN "planType" TYPE "Role_new" USING ("planType"::text::"Role_new");
ALTER TABLE "content" ALTER COLUMN "requiredRole" TYPE "Role_new" USING ("requiredRole"::text::"Role_new");
ALTER TABLE "payments" ALTER COLUMN "planType" TYPE "Role_new" USING ("planType"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "content" ALTER COLUMN "requiredRole" SET DEFAULT 'BASIC';
ALTER TABLE "payments" ALTER COLUMN "planType" SET DEFAULT 'STANDARD';
ALTER TABLE "subscriptions" ALTER COLUMN "planType" SET DEFAULT 'BASIC';
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'BASIC';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StudyActivityType_new" AS ENUM ('FILE_UPLOAD', 'SUMMARY_VIEW', 'NOTES_VIEW', 'QUIZ_ATTEMPT', 'FLASHCARD_STUDY', 'TTS_GENERATE', 'STUDY_PACK_CREATE');
ALTER TABLE "study_sessions" ALTER COLUMN "activityType" TYPE "StudyActivityType_new" USING ("activityType"::text::"StudyActivityType_new");
ALTER TYPE "StudyActivityType" RENAME TO "StudyActivityType_old";
ALTER TYPE "StudyActivityType_new" RENAME TO "StudyActivityType";
DROP TYPE "StudyActivityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "game_players" DROP CONSTRAINT "game_players_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "game_questions" DROP CONSTRAINT "game_questions_gameId_fkey";

-- DropForeignKey
ALTER TABLE "game_sessions" DROP CONSTRAINT "game_sessions_gameId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_messages" DROP CONSTRAINT "tutor_messages_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_session_files" DROP CONSTRAINT "tutor_session_files_fileId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_session_files" DROP CONSTRAINT "tutor_session_files_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "tutor_sessions" DROP CONSTRAINT "tutor_sessions_userId_fkey";

-- AlterTable
ALTER TABLE "content" ALTER COLUMN "requiredRole" SET DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "course_files" ADD COLUMN     "accessType" "FileAccessType" NOT NULL DEFAULT 'INTERNAL';

-- AlterTable
ALTER TABLE "subscriptions" ALTER COLUMN "planType" SET DEFAULT 'BASIC';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "appleId" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "lastXpGain" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "notificationsenabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notificationspersist" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "ttsSpeed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "ttsVoice" TEXT NOT NULL DEFAULT 'alloy',
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'BASIC';

-- DropTable
DROP TABLE "game_players";

-- DropTable
DROP TABLE "game_questions";

-- DropTable
DROP TABLE "game_sessions";

-- DropTable
DROP TABLE "games";

-- DropTable
DROP TABLE "tutor_messages";

-- DropTable
DROP TABLE "tutor_session_files";

-- DropTable
DROP TABLE "tutor_sessions";

-- DropEnum
DROP TYPE "GameSessionStatus";

-- DropEnum
DROP TYPE "GameTier";

-- DropEnum
DROP TYPE "GameType";

-- CreateTable
CREATE TABLE "study_packs" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "courseId" TEXT,
    "fileIds" TEXT[],
    "fileHash" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pages" JSONB,
    "quiz" JSONB,
    "cards" JSONB,
    "shareToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "study_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_achievements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "currentTier" "AchievementTier" NOT NULL DEFAULT 'COPPER',
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "study_packs_shareToken_key" ON "study_packs"("shareToken");

-- CreateIndex
CREATE INDEX "study_packs_ownerId_idx" ON "study_packs"("ownerId");

-- CreateIndex
CREATE INDEX "study_packs_courseId_idx" ON "study_packs"("courseId");

-- CreateIndex
CREATE INDEX "study_packs_shareToken_idx" ON "study_packs"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "study_packs_ownerId_fileHash_key" ON "study_packs"("ownerId", "fileHash");

-- CreateIndex
CREATE INDEX "user_achievements_userId_idx" ON "user_achievements"("userId");

-- CreateIndex
CREATE INDEX "user_achievements_achievementId_idx" ON "user_achievements"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "user_achievements_userId_achievementId_key" ON "user_achievements"("userId", "achievementId");

-- CreateIndex
CREATE INDEX "course_files_accessType_idx" ON "course_files"("accessType");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_appleId_key" ON "users"("appleId");

-- AddForeignKey
ALTER TABLE "study_packs" ADD CONSTRAINT "study_packs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_packs" ADD CONSTRAINT "study_packs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
