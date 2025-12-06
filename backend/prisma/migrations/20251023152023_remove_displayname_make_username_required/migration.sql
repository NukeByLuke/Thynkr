/*
  Warnings:

  - You are about to drop the column `displayName` on the `users` table. All the data in the column will be lost.
  - Made the column `username` on table `users` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update all NULL usernames with a default value based on email
UPDATE "users" 
SET "username" = CONCAT('user_', SUBSTRING(email, 1, POSITION('@' IN email) - 1), '_', id)
WHERE "username" IS NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "displayName",
ALTER COLUMN "username" SET NOT NULL;
