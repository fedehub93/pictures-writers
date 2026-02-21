/*
  Warnings:

  - You are about to drop the column `externalUserId` on the `User` table. All the data in the column will be lost.
  - The `emailVerified` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "User_externalUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "externalUserId",
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false;
