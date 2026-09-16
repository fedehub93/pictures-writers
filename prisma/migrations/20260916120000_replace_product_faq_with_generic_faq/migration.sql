-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort" INTEGER NOT NULL,
    "productId" TEXT,
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- Copy existing ProductFAQ rows into Faq (productId set, postId null)
INSERT INTO "Faq" ("id", "question", "answer", "sort", "productId", "createdAt", "updatedAt")
SELECT "id", "question", "answer", "sort", "productId", "createdAt", "updatedAt"
FROM "ProductFAQ";

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faq" ADD CONSTRAINT "Faq_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Faq_productId_idx" ON "Faq"("productId");

-- CreateIndex
CREATE INDEX "Faq_postId_idx" ON "Faq"("postId");

-- DropTable
DROP TABLE "ProductFAQ";
