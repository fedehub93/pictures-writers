-- AlterTable
ALTER TABLE "EmailSendLog" ADD COLUMN "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "EmailSendLog_idempotencyKey_key" ON "EmailSendLog"("idempotencyKey");
