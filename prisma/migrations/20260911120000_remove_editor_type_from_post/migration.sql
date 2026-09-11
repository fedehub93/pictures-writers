-- DropForeignKey
ALTER TABLE "public"."Post" DROP COLUMN "editorType";

-- DropEnum
DROP TYPE "public"."EditorType";