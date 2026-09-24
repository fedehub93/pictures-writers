-- DropIndex
DROP INDEX "AutomationRun_automationId_idempotencyKey_key";

-- CreateIndex
CREATE INDEX "AutomationRun_automationId_idempotencyKey_idx" ON "AutomationRun"("automationId", "idempotencyKey");
