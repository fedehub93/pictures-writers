-- Media folders: a display-name hierarchy over the library. `parentId` makes it
-- nest and `Media.folderId` files one Media in one folder. Both foreign keys
-- restrict deletion, so a folder that still holds a Media or a subfolder cannot
-- be removed by the database even if a caller skips the service's check.
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Media" ADD COLUMN "folderId" TEXT;

CREATE INDEX "MediaFolder_parentId_idx" ON "MediaFolder"("parentId");
CREATE INDEX "Media_folderId_idx" ON "Media"("folderId");

ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "MediaFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Media" ADD CONSTRAINT "Media_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
