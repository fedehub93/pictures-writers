-- CreateEnum
CREATE TYPE "SiteRegionKey" AS ENUM ('HEADER', 'FOOTER');

-- CreateTable
CREATE TABLE "SiteRegion" (
    "id" TEXT NOT NULL,
    "key" "SiteRegionKey" NOT NULL,
    "firstPublishedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "liveVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteRegionVersion" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "puckData" JSONB,
    "rootId" TEXT NOT NULL,
    "userId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteRegionVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteRegion_key_key" ON "SiteRegion"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRegion_currentVersionId_key" ON "SiteRegion"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRegion_liveVersionId_key" ON "SiteRegion"("liveVersionId");

-- CreateIndex
CREATE INDEX "SiteRegionVersion_rootId_idx" ON "SiteRegionVersion"("rootId");

-- CreateIndex
CREATE INDEX "SiteRegionVersion_status_scheduledAt_idx" ON "SiteRegionVersion"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "SiteRegionVersion_rootId_version_key" ON "SiteRegionVersion"("rootId", "version");

-- AddForeignKey
ALTER TABLE "SiteRegion" ADD CONSTRAINT "SiteRegion_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "SiteRegionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRegion" ADD CONSTRAINT "SiteRegion_liveVersionId_fkey" FOREIGN KEY ("liveVersionId") REFERENCES "SiteRegionVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRegionVersion" ADD CONSTRAINT "SiteRegionVersion_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "SiteRegion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteRegionVersion" ADD CONSTRAINT "SiteRegionVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
