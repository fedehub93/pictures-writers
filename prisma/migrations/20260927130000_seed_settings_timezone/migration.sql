-- AlterTable
ALTER TABLE "Settings" ALTER COLUMN "timezone" SET DEFAULT 'Europe/Rome';

-- Backfill: sites created before the field existed schedule in Europe/Rome.
UPDATE "Settings" SET "timezone" = 'Europe/Rome' WHERE "timezone" IS NULL;
