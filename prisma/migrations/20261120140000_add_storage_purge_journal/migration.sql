-- The purge journal: one row per object a Re-home abandoned on the driver it
-- left. Pre-seam keys are not namespaced, so the purge deletes exactly what a
-- move recorded instead of scanning a prefix. `createdAt` starts the grace
-- window; the composite unique makes a resumed run idempotent.
CREATE TABLE "StoragePurgeEntry" (
    "id" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoragePurgeEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StoragePurgeEntry_driver_key_key" ON "StoragePurgeEntry"("driver", "key");
CREATE INDEX "StoragePurgeEntry_driver_createdAt_idx" ON "StoragePurgeEntry"("driver", "createdAt");
