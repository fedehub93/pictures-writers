-- Drop the partial unique index: Prisma cannot represent partial indexes in
-- the datamodel, and the "one active action per target" invariant is enforced
-- by application logic with a row lock on the target (EmailSingleSend) instead.
DROP INDEX IF EXISTS "ScheduledAction_active_target_uidx";
