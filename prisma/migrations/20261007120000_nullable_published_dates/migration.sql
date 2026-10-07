-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "firstPublishedAt" DROP NOT NULL,
ALTER COLUMN "firstPublishedAt" DROP DEFAULT,
ALTER COLUMN "publishedAt" DROP NOT NULL,
ALTER COLUMN "publishedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "firstPublishedAt" DROP NOT NULL,
ALTER COLUMN "firstPublishedAt" DROP DEFAULT,
ALTER COLUMN "publishedAt" DROP NOT NULL,
ALTER COLUMN "publishedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tag" ALTER COLUMN "firstPublishedAt" DROP NOT NULL,
ALTER COLUMN "firstPublishedAt" DROP DEFAULT,
ALTER COLUMN "publishedAt" DROP NOT NULL,
ALTER COLUMN "publishedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "firstPublishedAt" TIMESTAMP(3),
ADD COLUMN     "publishedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductCategory" ALTER COLUMN "firstPublishedAt" DROP NOT NULL,
ALTER COLUMN "firstPublishedAt" DROP DEFAULT,
ALTER COLUMN "publishedAt" DROP NOT NULL,
ALTER COLUMN "publishedAt" DROP DEFAULT;
