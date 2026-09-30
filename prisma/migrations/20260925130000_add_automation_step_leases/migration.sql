ALTER TABLE "AutomationRunStep"
ADD COLUMN "leaseId" TEXT,
ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);

CREATE INDEX "AutomationRunStep_status_leaseExpiresAt_resumeAt_idx"
ON "AutomationRunStep"("status", "leaseExpiresAt", "resumeAt");
