-- De-version ProductCategory.
--
-- ProductCategory drops out of the Root + Version model and becomes a
-- single-row entity with a stable, unique slug (ADR 0012 / ADR 0014). Because
-- the current model already has versioned rows on disk this is a *collapse*,
-- not a split: every `rootId` group is merged into one canonical row (the
-- `isLatest = true` / `PUBLISHED` revision, else the highest `version`),
-- reusing the survivor's id, and the product links that pointed at the deleted
-- revisions are repointed onto it.
--
-- The whole body is guarded on the legacy `rootId` column, so re-running it
-- against an already-collapsed schema is a no-op (idempotent). It is one-way:
-- there is no down migration, rollback means restoring the pre-deploy backup.
--
-- Order of operations:
--   1. Pick the survivor per `rootId` group.
--   2. Repoint `Product.categoryId` onto the survivor.
--   3. Record the SEO rows owned by deleted revisions, then delete the rows.
--   4. Resolve slug collisions deterministically.
--   5. Drop the versioning columns and add the unique slug constraint.
--   6. Remove SEO rows that no surviving row (of any entity) references.
--   7. Retire the `product-categories.publish` permission.

DO $$
DECLARE
  rec RECORD;
  candidate TEXT;
  suffix INT;
BEGIN
  -- Already collapsed (or never versioned): nothing to do.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'ProductCategory'
      AND column_name = 'rootId'
  ) THEN
    RETURN;
  END IF;

  DROP TABLE IF EXISTS "_ProductCategorySurvivor";
  DROP TABLE IF EXISTS "_ProductCategoryRemap";

  -- 1. Canonical row per logical category.
  CREATE TEMP TABLE "_ProductCategorySurvivor" AS
  SELECT DISTINCT ON (COALESCE("rootId", "id"))
    COALESCE("rootId", "id") AS "grp",
    "id" AS "survivorId"
  FROM "ProductCategory"
  ORDER BY
    COALESCE("rootId", "id"),
    "isLatest" DESC,
    ("status" = 'PUBLISHED') DESC,
    "version" DESC,
    "createdAt" DESC,
    "id" DESC;

  CREATE TEMP TABLE "_ProductCategoryRemap" AS
  SELECT c."id" AS "oldId", s."survivorId" AS "newId"
  FROM "ProductCategory" c
  JOIN "_ProductCategorySurvivor" s ON COALESCE(c."rootId", c."id") = s."grp"
  WHERE c."id" <> s."survivorId";

  -- 2. Repoint `Product.categoryId` onto the survivor.
  UPDATE "Product" p
  SET "categoryId" = r."newId"
  FROM "_ProductCategoryRemap" r
  WHERE p."categoryId" = r."oldId";

  DROP TABLE IF EXISTS "_DeletedSeo";
  CREATE TEMP TABLE "_DeletedSeo" ("seoId" TEXT);

  -- 3a. Remember the SEO owned by the revisions about to be deleted.
  INSERT INTO "_DeletedSeo" ("seoId")
  SELECT DISTINCT c."seoId"
  FROM "ProductCategory" c
  JOIN "_ProductCategoryRemap" r ON r."oldId" = c."id"
  WHERE c."seoId" IS NOT NULL;

  -- 3b. Drop the self-relation, then the non-surviving rows.
  ALTER TABLE "ProductCategory" DROP CONSTRAINT IF EXISTS "ProductCategory_rootId_fkey";

  DELETE FROM "ProductCategory" c
  USING "_ProductCategoryRemap" r
  WHERE c."id" = r."oldId";

  -- =========================================================================
  -- 4. Resolve slug collisions deterministically.
  --    Survivors keep their slug when possible; later duplicates get a `-N`
  --    suffix. Unique slugs are claimed first so a suffix never steals an
  --    existing slug.
  -- =========================================================================

  DROP TABLE IF EXISTS "_UsedSlug";
  CREATE TEMP TABLE "_UsedSlug" ("slug" TEXT PRIMARY KEY);

  FOR rec IN
    SELECT c."id", c."slug"
    FROM "ProductCategory" c
    JOIN (SELECT "slug", COUNT(*) AS cnt FROM "ProductCategory" GROUP BY "slug") g
      ON g."slug" = c."slug"
    ORDER BY g.cnt ASC, c."createdAt" ASC, c."id" ASC
  LOOP
    candidate := rec."slug";
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM "_UsedSlug" u WHERE u."slug" = candidate) LOOP
      candidate := rec."slug" || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    INSERT INTO "_UsedSlug" ("slug") VALUES (candidate);
    IF candidate <> rec."slug" THEN
      UPDATE "ProductCategory" SET "slug" = candidate WHERE "id" = rec."id";
    END IF;
  END LOOP;

  DROP TABLE "_UsedSlug";

  -- =========================================================================
  -- 5. Drop versioning columns and enforce unique slugs.
  -- =========================================================================

  ALTER TABLE "ProductCategory"
    DROP COLUMN IF EXISTS "version",
    DROP COLUMN IF EXISTS "status",
    DROP COLUMN IF EXISTS "isLatest",
    DROP COLUMN IF EXISTS "rootId",
    DROP COLUMN IF EXISTS "firstPublishedAt",
    DROP COLUMN IF EXISTS "publishedAt";

  CREATE UNIQUE INDEX IF NOT EXISTS "ProductCategory_slug_key" ON "ProductCategory"("slug");

  -- =========================================================================
  -- 6. Remove SEO rows that no surviving row references any more.
  -- =========================================================================

  DELETE FROM "Seo" s
  WHERE s."id" IN (SELECT "seoId" FROM "_DeletedSeo")
    AND NOT EXISTS (SELECT 1 FROM "Settings" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "PageVersion" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "PostVersion" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "Category" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "Tag" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "Product" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "ProductCategory" x WHERE x."seoId" = s."id")
    -- Taxonomy SEO is self-rooted (`rootId = id`), so only treat another Seo
    -- row as a dependent when it is a genuine child, not the row itself.
    AND NOT EXISTS (
      SELECT 1 FROM "Seo" x WHERE x."rootId" = s."id" AND x."id" <> s."id"
    );

  DROP TABLE IF EXISTS "_DeletedSeo";
  DROP TABLE IF EXISTS "_ProductCategorySurvivor";
  DROP TABLE IF EXISTS "_ProductCategoryRemap";
END $$;

-- 7. Retire the `product-categories.publish` permission key (ADR 0014).
DELETE FROM "RolePermission"
WHERE "permissionId" IN (
  SELECT "id" FROM "Permission" WHERE "key" = 'product-categories.publish'
);

DELETE FROM "Permission" WHERE "key" = 'product-categories.publish';
