-- Cut-over from the legacy single-table Page model to PageRoot + PageVersion.
--
-- 1. Backfill one root per legacy rootId group.
-- 2. Backfill one version per legacy row.
-- 3. Point each root at its current and (if any) live version.
-- 4. Drop the legacy Page table.
--
-- This is the final, destructive step of the Root + Version pilot: after it runs
-- the legacy table no longer exists and the deployment can no longer be rolled
-- back to the old model.

-- 1. One root per legacy rootId group. The slug comes from the highest version,
--    the first publication date from the earliest published revision. Roots
--    already created by the dual-write are left untouched.
WITH "Grouped" AS (
  SELECT
    COALESCE("rootId", "id") AS "rootId",
    MIN("createdAt") AS "createdAt"
  FROM "Page"
  GROUP BY COALESCE("rootId", "id")
),
"Current" AS (
  SELECT DISTINCT ON (COALESCE("rootId", "id"))
    COALESCE("rootId", "id") AS "rootId",
    "slug"
  FROM "Page"
  ORDER BY COALESCE("rootId", "id"), "version" DESC
),
"FirstPublished" AS (
  SELECT
    COALESCE("rootId", "id") AS "rootId",
    MIN("firstPublishedAt") AS "firstPublishedAt"
  FROM "Page"
  WHERE "status" = 'PUBLISHED'
  GROUP BY COALESCE("rootId", "id")
)
INSERT INTO "PageRoot" ("id", "slug", "firstPublishedAt", "createdAt", "updatedAt")
SELECT
  g."rootId",
  c."slug",
  f."firstPublishedAt",
  g."createdAt",
  NOW()
FROM "Grouped" g
JOIN "Current" c ON c."rootId" = g."rootId"
LEFT JOIN "FirstPublished" f ON f."rootId" = g."rootId"
ON CONFLICT ("id") DO NOTHING;

-- 2. One version per legacy row. Reuse the legacy id so identities converge with
--    the dual-write rows; skip rows that already exist.
INSERT INTO "PageVersion" (
  "id",
  "title",
  "version",
  "status",
  "editorType",
  "puckData",
  "rootId",
  "seoId",
  "userId",
  "publishedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  p."id",
  p."title",
  p."version",
  p."status",
  p."editorType",
  p."puckData",
  COALESCE(p."rootId", p."id"),
  p."seoId",
  p."userId",
  CASE WHEN p."status" = 'PUBLISHED' THEN p."publishedAt" ELSE NULL END,
  p."createdAt",
  p."updatedAt"
FROM "Page" p
ON CONFLICT ("id") DO NOTHING;

-- 3. Fill the root pointers only where they are still empty, so work done
--    through the new model during the dual-write window is never overwritten.
WITH "Current" AS (
  SELECT DISTINCT ON (COALESCE("rootId", "id"))
    COALESCE("rootId", "id") AS "rootId",
    "id" AS "versionId"
  FROM "Page"
  ORDER BY COALESCE("rootId", "id"), "version" DESC
)
UPDATE "PageRoot" r
SET "currentVersionId" = c."versionId"
FROM "Current" c
WHERE r."id" = c."rootId" AND r."currentVersionId" IS NULL;

WITH "Live" AS (
  SELECT DISTINCT ON (COALESCE("rootId", "id"))
    COALESCE("rootId", "id") AS "rootId",
    "id" AS "versionId"
  FROM "Page"
  WHERE "status" = 'PUBLISHED'
  ORDER BY COALESCE("rootId", "id"), "isLatest" DESC, "version" DESC
)
UPDATE "PageRoot" r
SET "liveVersionId" = l."versionId"
FROM "Live" l
WHERE r."id" = l."rootId" AND r."liveVersionId" IS NULL;

-- 4. Drop the legacy table. Its self-relation and its FKs to Seo/User go with it.
DROP TABLE "Page";
