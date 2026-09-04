-- CreateEnum
CREATE TYPE "ScheduledActionType" AS ENUM ('PUBLISH_POST', 'SEND_EMAIL');

-- CreateEnum
CREATE TYPE "ScheduledActionStatus" AS ENUM ('SCHEDULED', 'PROCESSING', 'RETRY_WAIT', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateTable
CREATE TABLE "ScheduledAction" (
    "id" TEXT NOT NULL,
    "type" "ScheduledActionType" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "plannedAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "ScheduledActionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "retryAt" TIMESTAMP(3),
    "leaseId" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    "providerId" TEXT,
    "lastError" TEXT,
    "executedAt" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledAction_idempotencyKey_key" ON "ScheduledAction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ScheduledAction_status_plannedAt_retryAt_idx" ON "ScheduledAction"("status", "plannedAt", "retryAt");

-- CreateIndex
CREATE INDEX "ScheduledAction_targetType_targetId_status_idx" ON "ScheduledAction"("targetType", "targetId", "status");

-- CreateIndex
CREATE INDEX "ScheduledAction_leaseExpiresAt_status_idx" ON "ScheduledAction"("leaseExpiresAt", "status");
