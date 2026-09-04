-- Partial unique index: at most one active scheduled action per target.
-- Active statuses are SCHEDULED, RETRY_WAIT, and PROCESSING.
CREATE UNIQUE INDEX "ScheduledAction_active_target_uidx"
  ON "ScheduledAction"("targetType", "targetId")
  WHERE "status" IN ('SCHEDULED', 'RETRY_WAIT', 'PROCESSING');
