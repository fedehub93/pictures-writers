-- DropForeignKey
ALTER TABLE "public"."PostAuthor" DROP CONSTRAINT "PostAuthor_postId_fkey";

-- DropForeignKey
ALTER TABLE "public"."PostAuthor" DROP CONSTRAINT "PostAuthor_userId_fkey";

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "gtmCategory" TEXT,
ADD COLUMN     "gtmEventName" TEXT,
ADD COLUMN     "gtmLabel" TEXT,
ADD COLUMN     "submitLabel" TEXT;

-- AddForeignKey
ALTER TABLE "PostAuthor" ADD CONSTRAINT "PostAuthor_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostAuthor" ADD CONSTRAINT "PostAuthor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
