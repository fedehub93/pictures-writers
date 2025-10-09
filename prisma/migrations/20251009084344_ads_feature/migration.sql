-- CreateEnum
CREATE TYPE "AdLayoutType" AS ENUM ('SINGLE', 'GRID', 'CAROUSEL');

-- CreateEnum
CREATE TYPE "AdItemSourceType" AS ENUM ('STATIC', 'POST', 'PRODUCT');

-- CreateEnum
CREATE TYPE "AdPositionPlacement" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "AdPositionReference" AS ENUM ('HEADING', 'PARAGRAPH', 'IMAGE');

-- CreateTable
CREATE TABLE "AdCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdBlock" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "layoutType" "AdLayoutType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "campaignId" TEXT NOT NULL,
    "placement" "AdPositionPlacement" NOT NULL DEFAULT 'BEFORE',
    "reference" "AdPositionReference" NOT NULL DEFAULT 'HEADING',
    "referenceCount" INTEGER NOT NULL DEFAULT 0,
    "minWords" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdItem" (
    "id" TEXT NOT NULL,
    "sourceType" "AdItemSourceType" NOT NULL,
    "adBlockId" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "url" TEXT,
    "postRootId" TEXT,
    "productRootId" TEXT,
    "sort" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdBlock" ADD CONSTRAINT "AdBlock_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "AdCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdItem" ADD CONSTRAINT "AdItem_adBlockId_fkey" FOREIGN KEY ("adBlockId") REFERENCES "AdBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;
