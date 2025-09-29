-- CreateEnum
CREATE TYPE "public"."EditorType" AS ENUM ('SLATE', 'TIPTAP');

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "editorType" "public"."EditorType" NOT NULL DEFAULT 'TIPTAP',
ADD COLUMN     "tiptapBodyData" JSONB;
