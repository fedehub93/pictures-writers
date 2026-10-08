-- CreateTable
CREATE TABLE "PageRoot" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstPublishedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "liveVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageRoot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVersion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "editorType" "PageEditorType" NOT NULL DEFAULT 'PUCK',
    "puckData" JSONB,
    "rootId" TEXT NOT NULL,
    "seoId" TEXT,
    "userId" TEXT,
    "imageCoverId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageRoot_slug_key" ON "PageRoot"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageRoot_currentVersionId_key" ON "PageRoot"("currentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "PageRoot_liveVersionId_key" ON "PageRoot"("liveVersionId");

-- CreateIndex
CREATE INDEX "PageVersion_rootId_idx" ON "PageVersion"("rootId");

-- CreateIndex
CREATE INDEX "PageVersion_status_scheduledAt_idx" ON "PageVersion"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_rootId_version_key" ON "PageVersion"("rootId", "version");

-- AddForeignKey
ALTER TABLE "PageRoot" ADD CONSTRAINT "PageRoot_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "PageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageRoot" ADD CONSTRAINT "PageRoot_liveVersionId_fkey" FOREIGN KEY ("liveVersionId") REFERENCES "PageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "PageRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES "Seo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_imageCoverId_fkey" FOREIGN KEY ("imageCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
