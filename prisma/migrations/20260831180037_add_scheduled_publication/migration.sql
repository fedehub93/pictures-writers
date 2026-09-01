-- AlterEnum
ALTER TYPE "ContentStatus" ADD VALUE 'SCHEDULED';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "preSchedulingStatus" "ContentStatus",
ADD COLUMN     "scheduledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Post_status_scheduledAt_idx" ON "Post"("status", "scheduledAt");

-- RenameIndex
ALTER INDEX "Account_issuer_accountId_key" RENAME TO "account_issuer_accountId_uidx";
