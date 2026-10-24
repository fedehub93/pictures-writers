-- Enrich Media: file identity (MIME, checksum, revision), per-type metadata,
-- the rendition manifest and the archive state.
ALTER TABLE "Media"
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "checksum" TEXT,
ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "metadata" JSONB,
ADD COLUMN "renditions" JSONB,
ADD COLUMN "archivedAt" TIMESTAMP(3);

CREATE INDEX "Media_checksum_idx" ON "Media"("checksum");
CREATE INDEX "Media_archivedAt_idx" ON "Media"("archivedAt");
