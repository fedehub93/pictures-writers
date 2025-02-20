-- AlterTable
ALTER TABLE "_EmailAudienceToEmailContact" ADD CONSTRAINT "_EmailAudienceToEmailContact_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_EmailAudienceToEmailContact_AB_unique";

-- AlterTable
ALTER TABLE "_EmailAudienceToEmailSingleSend" ADD CONSTRAINT "_EmailAudienceToEmailSingleSend_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_EmailAudienceToEmailSingleSend_AB_unique";

-- AlterTable
ALTER TABLE "_PostToTag" ADD CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_PostToTag_AB_unique";
