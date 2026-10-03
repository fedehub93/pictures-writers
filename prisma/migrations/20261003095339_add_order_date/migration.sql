-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing orders with their creation date so historical orders keep
-- their real date instead of the migration timestamp.
UPDATE "Order" SET "orderDate" = "createdAt";
