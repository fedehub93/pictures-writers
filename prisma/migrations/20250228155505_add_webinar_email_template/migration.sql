-- AlterTable
ALTER TABLE "EmailSetting" ADD COLUMN     "webinarTemplateId" TEXT;

-- AddForeignKey
ALTER TABLE "EmailSetting" ADD CONSTRAINT "EmailSetting_webinarTemplateId_fkey" FOREIGN KEY ("webinarTemplateId") REFERENCES "EmailTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
