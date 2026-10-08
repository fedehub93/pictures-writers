-- De-version Category and Tag.
--
-- Category and Tag drop out of the Root + Version model and become single-row
-- entities with a stable, unique slug. Because the current model already has
-- versioned rows on disk this is a *collapse*, not a split: every `rootId`
-- group is merged into one canonical row (the `isLatest = true` / `PUBLISHED`
-- revision, else the highest `version`), reusing the survivor's id, and the
-- post links that pointed at the deleted revisions are repointed onto it.
--
-- The whole body is guarded on the legacy `rootId` column, so re-running it
-- against an already-collapsed schema is a no-op (idempotent). It is one-way:
-- there is no down migration, rollback means restoring the pre-deploy backup.
--
-- Order of operations for each entity:
--   1. Pick the survivor per `rootId` group.
--   2. Repoint `PostCategory` / `_PostToTag` links onto the survivor.
--   3. Record the SEO rows owned by deleted revisions, then delete the rows.
--   4. Resolve slug collisions deterministically.
--   5. Drop the versioning columns and add the unique slug constraint.
--   6. Remove SEO rows that no surviving row (of any entity) references.

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
      AND table_name = 'Category'
      AND column_name = 'rootId'
  ) THEN
    RETURN;
  END IF;

  -- =========================================================================
  -- Category
  -- =========================================================================

  DROP TABLE IF EXISTS "_CategorySurvivor";
  DROP TABLE IF EXISTS "_CategoryRemap";

  -- 1. Canonical row per logical category.
  CREATE TEMP TABLE "_CategorySurvivor" AS
  SELECT DISTINCT ON (COALESCE("rootId", "id"))
    COALESCE("rootId", "id") AS "grp",
    "id" AS "survivorId"
  FROM "Category"
  ORDER BY
    COALESCE("rootId", "id"),
    "isLatest" DESC,
    ("status" = 'PUBLISHED') DESC,
    "version" DESC,
    "createdAt" DESC,
    "id" DESC;

  CREATE TEMP TABLE "_CategoryRemap" AS
  SELECT c."id" AS "oldId", s."survivorId" AS "newId"
  FROM "Category" c
  JOIN "_CategorySurvivor" s ON COALESCE(c."rootId", c."id") = s."grp"
  WHERE c."id" <> s."survivorId";

  -- 2. Repoint `PostCategory` onto the survivor. Rebuilding the table collapses
  --    links that would otherwise collide on the (postId, categoryId) primary
  --    key when two revisions of the same category were attached to one post.
  DROP TABLE IF EXISTS "_PostCategoryNew";

  CREATE TEMP TABLE "_PostCategoryNew" AS
  SELECT DISTINCT ON (pc."postId", COALESCE(r."newId", pc."categoryId"))
    pc."postId" AS "postId",
    COALESCE(r."newId", pc."categoryId") AS "categoryId",
    pc."sort" AS "sort"
  FROM "PostCategory" pc
  LEFT JOIN "_CategoryRemap" r ON r."oldId" = pc."categoryId"
  ORDER BY pc."postId", COALESCE(r."newId", pc."categoryId"), pc."sort" ASC;

  DELETE FROM "PostCategory";
  INSERT INTO "PostCategory" ("postId", "categoryId", "sort")
  SELECT "postId", "categoryId", "sort" FROM "_PostCategoryNew";

  DROP TABLE IF EXISTS "_DeletedSeo";
  CREATE TEMP TABLE "_DeletedSeo" ("seoId" TEXT);

  -- 3a. Remember the SEO owned by the revisions about to be deleted.
  INSERT INTO "_DeletedSeo" ("seoId")
  SELECT DISTINCT c."seoId"
  FROM "Category" c
  JOIN "_CategoryRemap" r ON r."oldId" = c."id"
  WHERE c."seoId" IS NOT NULL;

  -- 3b. Drop the self-relation, then the non-surviving rows. `userId` is kept
  --     (it is a plain creator reference, not part of the versioning model).
  ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_rootId_fkey";

  DELETE FROM "Category" c
  USING "_CategoryRemap" r
  WHERE c."id" = r."oldId";

  -- =========================================================================
  -- Tag
  -- =========================================================================

  DROP TABLE IF EXISTS "_TagSurvivor";
  DROP TABLE IF EXISTS "_TagRemap";

  CREATE TEMP TABLE "_TagSurvivor" AS
  SELECT DISTINCT ON (COALESCE("rootId", "id"))
    COALESCE("rootId", "id") AS "grp",
    "id" AS "survivorId"
  FROM "Tag"
  ORDER BY
    COALESCE("rootId", "id"),
    "isLatest" DESC,
    ("status" = 'PUBLISHED') DESC,
    "version" DESC,
    "createdAt" DESC,
    "id" DESC;

  CREATE TEMP TABLE "_TagRemap" AS
  SELECT t."id" AS "oldId", s."survivorId" AS "newId"
  FROM "Tag" t
  JOIN "_TagSurvivor" s ON COALESCE(t."rootId", t."id") = s."grp"
  WHERE t."id" <> s."survivorId";

  -- Repoint the implicit Post <-> Tag join. `A` is the post, `B` is the tag.
  DROP TABLE IF EXISTS "_PostToTagNew";

  CREATE TEMP TABLE "_PostToTagNew" AS
  SELECT DISTINCT
    p."A" AS "A",
    COALESCE(r."newId", p."B") AS "B"
  FROM "_PostToTag" p
  LEFT JOIN "_TagRemap" r ON r."oldId" = p."B";

  DELETE FROM "_PostToTag";
  INSERT INTO "_PostToTag" ("A", "B") SELECT "A", "B" FROM "_PostToTagNew";

  INSERT INTO "_DeletedSeo" ("seoId")
  SELECT DISTINCT t."seoId"
  FROM "Tag" t
  JOIN "_TagRemap" r ON r."oldId" = t."id"
  WHERE t."seoId" IS NOT NULL;

  ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_rootId_fkey";

  DELETE FROM "Tag" t
  USING "_TagRemap" r
  WHERE t."id" = r."oldId";

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
    FROM "Category" c
    JOIN (SELECT "slug", COUNT(*) AS cnt FROM "Category" GROUP BY "slug") g
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
      UPDATE "Category" SET "slug" = candidate WHERE "id" = rec."id";
    END IF;
  END LOOP;

  DROP TABLE "_UsedSlug";
  CREATE TEMP TABLE "_UsedSlug" ("slug" TEXT PRIMARY KEY);

  FOR rec IN
    SELECT t."id", t."slug"
    FROM "Tag" t
    JOIN (SELECT "slug", COUNT(*) AS cnt FROM "Tag" GROUP BY "slug") g
      ON g."slug" = t."slug"
    ORDER BY g.cnt ASC, t."createdAt" ASC, t."id" ASC
  LOOP
    candidate := rec."slug";
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM "_UsedSlug" u WHERE u."slug" = candidate) LOOP
      candidate := rec."slug" || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;
    INSERT INTO "_UsedSlug" ("slug") VALUES (candidate);
    IF candidate <> rec."slug" THEN
      UPDATE "Tag" SET "slug" = candidate WHERE "id" = rec."id";
    END IF;
  END LOOP;

  DROP TABLE "_UsedSlug";

  -- =========================================================================
  -- 5. Drop versioning columns / indexes and enforce unique slugs.
  -- =========================================================================

  ALTER TABLE "Category"
    DROP COLUMN IF EXISTS "version",
    DROP COLUMN IF EXISTS "status",
    DROP COLUMN IF EXISTS "isLatest",
    DROP COLUMN IF EXISTS "rootId",
    DROP COLUMN IF EXISTS "firstPublishedAt",
    DROP COLUMN IF EXISTS "publishedAt";

  ALTER TABLE "Tag"
    DROP COLUMN IF EXISTS "version",
    DROP COLUMN IF EXISTS "status",
    DROP COLUMN IF EXISTS "isLatest",
    DROP COLUMN IF EXISTS "rootId",
    DROP COLUMN IF EXISTS "firstPublishedAt",
    DROP COLUMN IF EXISTS "publishedAt";

  CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");
  CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug");

  -- =========================================================================
  -- 6. Remove SEO rows that no surviving row references any more.
  -- =========================================================================

  DELETE FROM "Seo" s
  WHERE s."id" IN (SELECT "seoId" FROM "_DeletedSeo")
    AND NOT EXISTS (SELECT 1 FROM "Settings" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "PageVersion" x WHERE x."seoId" = s."id")
    AND NOT EXISTS (SELECT 1 FROM "Post" x WHERE x."seoId" = s."id")
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
  DROP TABLE IF EXISTS "_CategorySurvivor";
  DROP TABLE IF EXISTS "_CategoryRemap";
  DROP TABLE IF EXISTS "_TagSurvivor";
  DROP TABLE IF EXISTS "_TagRemap";
  DROP TABLE IF EXISTS "_PostCategoryNew";
  DROP TABLE IF EXISTS "_PostToTagNew";
END $$;
