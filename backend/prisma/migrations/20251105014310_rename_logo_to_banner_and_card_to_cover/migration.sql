/*
  Warnings:

  - You are about to drop the column `logoImage` on the `courses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "courses" DROP COLUMN "logoImage",
ADD COLUMN     "bannerImage" TEXT;
