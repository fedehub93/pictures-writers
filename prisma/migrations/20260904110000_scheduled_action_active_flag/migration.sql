-- Drop the previous unique constraint that did not include `active`.
-- Without this, a target could only ever have one scheduled action, which
-- prevents reusing an EmailSingleSend after one send has been completed.
DROP INDEX IF EXISTS "ScheduledAction_active_target_uidx";

-- AlterTable
ALTER TABLE "ScheduledAction" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledAction_active_target_uidx" ON "ScheduledAction"("targetType", "targetId", "active");

