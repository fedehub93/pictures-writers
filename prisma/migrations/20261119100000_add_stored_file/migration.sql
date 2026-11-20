-- One record of where a file's bytes are, independent of the role the
-- product gives it. Existing Media get theirs from the backfill command, so
-- `mediaId` stays nullable and no Media row is rewritten by this migration.
CREATE TYPE "StoredFileKind" AS ENUM ('MEDIA', 'ATTACHMENT', 'AVATAR');
CREATE TYPE "StoredFileOrigin" AS ENUM ('INTERNAL', 'PUBLIC');

CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "remoteUrl" TEXT,
    "contentType" TEXT,
    "size" INTEGER,
    "checksum" TEXT,
    "kind" "StoredFileKind" NOT NULL DEFAULT 'MEDIA',
    "origin" "StoredFileOrigin" NOT NULL DEFAULT 'INTERNAL',
    "mediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoredFile_key_key" ON "StoredFile"("key");
CREATE UNIQUE INDEX "StoredFile_mediaId_key" ON "StoredFile"("mediaId");
CREATE INDEX "StoredFile_driver_idx" ON "StoredFile"("driver");
CREATE INDEX "StoredFile_kind_idx" ON "StoredFile"("kind");
CREATE INDEX "StoredFile_checksum_idx" ON "StoredFile"("checksum");

ALTER TABLE "StoredFile" ADD CONSTRAINT "StoredFile_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
