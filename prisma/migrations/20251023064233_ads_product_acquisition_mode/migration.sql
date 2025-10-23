-- CreateEnum
CREATE TYPE "ProductAcquisitionMode" AS ENUM ('FREE', 'PAID', 'FORM', 'AFFILIATE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "acquisitionMode" "ProductAcquisitionMode" NOT NULL DEFAULT 'PAID';
