-- Add the historical storage driver to each Media row so delivery can
-- resolve the right driver per file instead of relying on one process-wide
-- setting. Rows created before this change stay NULL and resolve as remote.
ALTER TABLE "Media" ADD COLUMN "storageDriver" TEXT;
