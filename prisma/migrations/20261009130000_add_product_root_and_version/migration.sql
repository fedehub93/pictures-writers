-- Cut-over from the legacy single-table Product model to ProductRoot +
-- ProductVersion (ADR 0014).
--
-- One-shot, destructive split. There is no dual-write window: this migration
-- creates the new tables, moves every legacy row into a ProductVersion (reusing
-- the row id) under a ProductRoot (reusing the legacy `rootId`), repoints the
-- editorial relations and the durable references, resolves slug collisions, and
-- drops the legacy Product table.
--
-- Reusing the ids is what keeps every inbound reference meaningful:
--   * `ProductRoot.id` reuses `COALESCE(Product.rootId, Product.id)`, so
--     AdItem.productRootId, Widget.metadata.products[].rootId and the Tiptap
--     product node's `productRootId` keep naming the same logical product.
--   * `ProductVersion.id` reuses `Product.id`, so `ProductGallery`,
--     `ProductExtra` and `Faq` rows keep pointing at the same revision (only
--     the FK target changes).
--
-- Unlike Post, Product carries durable references that named a *version* row
-- (`Reviews.productId`, `OrderItem.productId`, `Purchase.productId`). Those are
-- repointed to the root id so editing a published product no longer orphans its
-- reviews, and the redundant `Purchase.productRootId` column is dropped. Product
-- used to share a single `Seo` across revisions; because each revision already
-- carries a `seoId` the shared row is simply carried onto every version.
--
-- The body is guarded on the legacy `Product` table's `rootId` column, so
-- re-running it against an already-migrated schema is a no-op (idempotent). It
-- is one-way: there is no down migration; rollback means restoring a pre-deploy
-- backup.
--
-- Legacy semantics relied on below:
--   * `rootId` groups a product; the root row's id equals its `rootId`.
--   * `isLatest = true` marked the live (published) row, not the current one.
--     Editing a published product forks a `CHANGED` row with `isLatest = false`,
--     so the current row is the highest `version` and the live row is the
--     `PUBLISHED` one — the two pointers can differ.
--   * `version` was meant to increase per root, but production contains
--     duplicate version numbers, so versions are renumbered densely per root to
--     satisfy @@unique([rootId, version]).
--   * `firstPublishedAt` was duplicated on every revision; the root keeps the
--     earliest recorded publication date.

DO $$
DECLARE
  rec RECORD;
  candidate TEXT;
  suffix INT;
BEGIN
  -- Already migrated: the legacy table (or its self-relation column) is gone.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'Product'
      AND column_name = 'rootId'
  ) THEN
    RETURN;
  END IF;

  -- =========================================================================
  -- 1. New tables. The unique slug index is created after collisions are
  --    resolved; the other indexes are safe to create now.
  -- =========================================================================

  CREATE TABLE "ProductRoot" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "firstPublishedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "liveVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductRoot_pkey" PRIMARY KEY ("id")
  );

  CREATE TABLE "ProductVersion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tiptapDescription" JSONB,
    "version" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "acquisitionMode" "ProductAcquisitionMode" NOT NULL DEFAULT 'PAID',
    "price" DOUBLE PRECISION,
    "discountedPrice" DOUBLE PRECISION,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "rootId" TEXT NOT NULL,
    "imageCoverId" TEXT,
    "categoryId" TEXT,
    "formId" TEXT,
    "seoId" TEXT,
    "userId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductVersion_pkey" PRIMARY KEY ("id")
  );

  CREATE UNIQUE INDEX "ProductRoot_currentVersionId_key" ON "ProductRoot"("currentVersionId");
  CREATE UNIQUE INDEX "ProductRoot_liveVersionId_key" ON "ProductRoot"("liveVersionId");
  CREATE INDEX "ProductVersion_rootId_idx" ON "ProductVersion"("rootId");
  CREATE UNIQUE INDEX "ProductVersion_rootId_version_key" ON "ProductVersion"("rootId", "version");

  -- =========================================================================
  -- 2. Pick, per root group, the current revision (highest version) and the
  --    live revision (the PUBLISHED one, if any). They differ for a published
  --    product with an in-progress edit.
  -- =========================================================================

  CREATE TEMP TABLE "_ProductCurrent" AS
  SELECT DISTINCT ON (b."grp")
    b."grp",
    b."id" AS "currentId",
    b."slug" AS "currentSlug",
    b."type" AS "type"
  FROM (
    SELECT
      COALESCE("rootId", "id") AS "grp",
      "id",
      "slug",
      "type",
      "version",
      "createdAt"
    FROM "Product"
  ) b
  ORDER BY b."grp", b."version" DESC, b."createdAt" DESC, b."id" DESC;

  CREATE TEMP TABLE "_ProductLive" AS
  SELECT DISTINCT ON (b."grp")
    b."grp",
    b."id" AS "liveId",
    b."slug" AS "liveSlug"
  FROM (
    SELECT
      COALESCE("rootId", "id") AS "grp",
      "id",
      "slug",
      "isLatest",
      "version",
      "createdAt"
    FROM "Product"
    WHERE "status" = 'PUBLISHED'
  ) b
  ORDER BY b."grp", b."isLatest" DESC, b."version" DESC, b."createdAt" DESC, b."id" DESC;

  -- =========================================================================
  -- 3. One root per group. The slug comes from the live revision when the
  --    product is published (so public URLs survive), else from the current
  --    one; the first publication date is the earliest recorded on a published
  --    revision, and `type` is stable so it comes from the current revision.
  -- =========================================================================

  INSERT INTO "ProductRoot" ("id", "slug", "type", "firstPublishedAt", "createdAt", "updatedAt")
  SELECT
    g."grp",
    COALESCE(l."liveSlug", c."currentSlug"),
    c."type",
    g."firstPublishedAt",
    g."createdAt",
    NOW()
  FROM (
    SELECT
      COALESCE("rootId", "id") AS "grp",
      MIN("createdAt") AS "createdAt",
      MIN("firstPublishedAt") FILTER (WHERE "status" = 'PUBLISHED') AS "firstPublishedAt"
    FROM "Product"
    GROUP BY COALESCE("rootId", "id")
  ) g
  JOIN "_ProductCurrent" c ON c."grp" = g."grp"
  LEFT JOIN "_ProductLive" l ON l."grp" = g."grp";

  -- =========================================================================
  -- 4. One version per legacy row, reusing the legacy id. Duplicate versions
  --    are renumbered densely per root (original order preserved). Any
  --    published revision other than the chosen live one is demoted to CHANGED
  --    so a root has at most one PUBLISHED version. The shared SEO row is
  --    carried across unchanged.
  -- =========================================================================

  INSERT INTO "ProductVersion" (
    "id",
    "title",
    "tiptapDescription",
    "version",
    "status",
    "acquisitionMode",
    "price",
    "discountedPrice",
    "isFree",
    "metadata",
    "rootId",
    "imageCoverId",
    "categoryId",
    "formId",
    "seoId",
    "userId",
    "publishedAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    v."id",
    v."title",
    v."tiptapDescription",
    v."newVersion",
    CASE
      WHEN v."id" = l."liveId" THEN 'PUBLISHED'::"ContentStatus"
      WHEN v."status" = 'PUBLISHED' THEN 'CHANGED'::"ContentStatus"
      ELSE v."status"
    END,
    v."acquisitionMode",
    v."price",
    v."discountedPrice",
    v."isFree",
    v."metadata",
    v."grp",
    v."imageCoverId",
    v."categoryId",
    v."formId",
    v."seoId",
    v."userId",
    v."publishedAt",
    v."createdAt",
    v."updatedAt"
  FROM (
    SELECT
      p."id",
      p."title",
      p."tiptapDescription",
      p."status",
      p."acquisitionMode",
      p."price",
      p."discountedPrice",
      p."isFree",
      p."metadata",
      p."imageCoverId",
      p."categoryId",
      p."formId",
      p."seoId",
      p."userId",
      p."publishedAt",
      p."createdAt",
      p."updatedAt",
      COALESCE(p."rootId", p."id") AS "grp",
      row_number() OVER (
        PARTITION BY COALESCE(p."rootId", p."id")
        ORDER BY p."version", p."createdAt", p."id"
      ) AS "newVersion"
    FROM "Product" p
  ) v
  LEFT JOIN "_ProductLive" l ON l."grp" = v."grp";

  -- =========================================================================
  -- 5. Fill the root pointers.
  -- =========================================================================

  UPDATE "ProductRoot" r
  SET "currentVersionId" = c."currentId"
  FROM "_ProductCurrent" c
  WHERE r."id" = c."grp";

  UPDATE "ProductRoot" r
  SET "liveVersionId" = l."liveId"
  FROM "_ProductLive" l
  WHERE r."id" = l."grp";

  -- =========================================================================
  -- 6. Resolve slug collisions deterministically. Unique slugs are claimed
  --    first so a suffix never steals an existing slug; later duplicates get a
  --    `-N` suffix. Only then can the unique index be created.
  -- =========================================================================

  CREATE TEMP TABLE "_UsedSlug" ("slug" TEXT PRIMARY KEY);

  FOR rec IN
    SELECT r."id", r."slug"
    FROM "ProductRoot" r
    JOIN (SELECT "slug", COUNT(*) AS cnt FROM "ProductRoot" GROUP BY "slug") g
      ON g."slug" = r."slug"
    ORDER BY g.cnt ASC, r."createdAt" ASC, r."id" ASC
  LOOP
    candidate := rec."slug";
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM "_UsedSlug" u WHERE u."slug" = candidate) LOOP
      candidate := rec."slug" || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    INSERT INTO "_UsedSlug" ("slug") VALUES (candidate);
    IF candidate <> rec."slug" THEN
      UPDATE "ProductRoot" SET "slug" = candidate WHERE "id" = rec."id";
    END IF;
  END LOOP;

  DROP TABLE "_UsedSlug";

  CREATE UNIQUE INDEX "ProductRoot_slug_key" ON "ProductRoot"("slug");

  -- =========================================================================
  -- 7. Repoint the durable references from the version id to the root id.
  --    `ProductRoot.id` reuses `COALESCE(rootId, id)`, so a join maps every
  --    legacy version row onto its root. This is safe while the legacy table
  --    still exists (the root id is one of its rows); the FK is swapped next.
  -- =========================================================================

  UPDATE "Reviews" r
  SET "productId" = COALESCE(p."rootId", p."id")
  FROM "Product" p
  WHERE r."productId" = p."id";

  UPDATE "OrderItem" o
  SET "productId" = COALESCE(p."rootId", p."id")
  FROM "Product" p
  WHERE o."productId" = p."id";

  UPDATE "Purchase" pu
  SET "productId" = COALESCE(p."rootId", p."id")
  FROM "Product" p
  WHERE pu."productId" = p."id";

  -- =========================================================================
  -- 8. Repoint the editorial relations. Ids are reused, so only the referenced
  --    table changes; no link rows need to move. Faq/ProductGallery/ProductExtra
  --    stay version-scoped; Reviews/OrderItem/Purchase now reference the root.
  -- =========================================================================

  ALTER TABLE "ProductGallery" DROP CONSTRAINT "ProductGallery_productId_fkey";
  ALTER TABLE "ProductGallery" ADD CONSTRAINT "ProductGallery_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "ProductExtra" DROP CONSTRAINT "ProductExtra_productId_fkey";
  ALTER TABLE "ProductExtra" ADD CONSTRAINT "ProductExtra_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "Faq" DROP CONSTRAINT "Faq_productId_fkey";
  ALTER TABLE "Faq" ADD CONSTRAINT "Faq_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ProductVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "Reviews" DROP CONSTRAINT "Reviews_productId_fkey";
  ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ProductRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
  ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ProductRoot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_productId_fkey";
  ALTER TABLE "Purchase" DROP COLUMN "productRootId";
  ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "ProductRoot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

  -- =========================================================================
  -- 9. Drop the legacy table. Its self-relation and outbound FKs go with it.
  -- =========================================================================

  DROP TABLE "Product";

  -- =========================================================================
  -- 10. Foreign keys for the new tables.
  -- =========================================================================

  ALTER TABLE "ProductRoot" ADD CONSTRAINT "ProductRoot_currentVersionId_fkey"
    FOREIGN KEY ("currentVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "ProductRoot" ADD CONSTRAINT "ProductRoot_liveVersionId_fkey"
    FOREIGN KEY ("liveVersionId") REFERENCES "ProductVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_rootId_fkey"
    FOREIGN KEY ("rootId") REFERENCES "ProductRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_imageCoverId_fkey"
    FOREIGN KEY ("imageCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_formId_fkey"
    FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_seoId_fkey"
    FOREIGN KEY ("seoId") REFERENCES "Seo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "ProductVersion" ADD CONSTRAINT "ProductVersion_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  DROP TABLE "_ProductCurrent";
  DROP TABLE "_ProductLive";
END $$;
