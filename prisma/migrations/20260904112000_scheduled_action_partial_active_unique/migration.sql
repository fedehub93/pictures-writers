-- DropIndex
DROP INDEX "ScheduledAction_active_target_uidx";

-- CreateIndex
CREATE INDEX "ScheduledAction_active_idx" ON "ScheduledAction"("active");

-- Only one active action per (targetType, targetId). Historical rows are
-- allowed to accumulate for the same target so an EmailSingleSend can be
-- scheduled, sent, and scheduled again without losing its send history.
CREATE UNIQUE INDEX "ScheduledAction_active_target_uidx"
  ON "ScheduledAction"("targetType", "targetId")
  WHERE "active" = true;

