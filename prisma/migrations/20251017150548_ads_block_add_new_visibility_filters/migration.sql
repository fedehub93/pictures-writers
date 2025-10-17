-- AlterTable
ALTER TABLE "AdBlock" ADD COLUMN     "excludedCategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "excludedPostIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "excludedTagIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
