-- AlterTable
ALTER TABLE "Reviews" ADD COLUMN     "role" TEXT;

-- DropEnum
DROP TYPE "ReviewStatus";
