-- Cut-over from the legacy single-table Post model to PostRoot + PostVersion.
--
-- One-shot, destructive split. Unlike the Page pilot there is no dual-write
-- window: this migration creates the new tables, moves every legacy row into a
-- PostVersion (reusing the row id) under a PostRoot (reusing the legacy rootId),
-- repoints the editorial relations, resolves slug collisions, and drops the
-- legacy Post table. Reusing the ids means every inbound reference
-- (AdItem.postRootId, AdBlock.excludedPostIds, ScheduledAction.targetId,
-- Widget.metadata.posts[].rootId) keeps naming the same logical post.
--
-- The body is guarded on the legacy `Post` table's `rootId` column, so running
-- it again against an already-migrated schema is a no-op (idempotent). It is
-- one-way: there is no down migration; rollback means restoring a pre-deploy
-- backup.
--
-- Legacy semantics relied on below:
--   * `rootId` groups a post; the first row's id equals `rootId`.
--   * `isLatest = true` marked the live (published) row, *not* the current one:
--     editing a published post forks a `CHANGED` row with `isLatest = false`.
--     The current row is therefore the highest `version` (newest edit), and the
--     live row is the `PUBLISHED` one, so the two pointers can differ.
--   * `version` was meant to increase per root, but production contains
--     duplicate version numbers, so versions are renumbered densely per root to
--     satisfy @@unique([rootId, version]).
--   * `firstPublishedAt` was duplicated on every revision; the root keeps the
--     earliest published value.
--   * every revision shared its `seoId`, so the Seo row is simply carried over.

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
      AND table_name = 'Post'
      AND column_name = 'rootId'
  ) THEN
    RETURN;
  END IF;

  -- =========================================================================
  -- 1. New tables. The unique slug index is created after collisions are
  --    resolved; the other indexes are safe to create now.
  -- =========================================================================

  CREATE TABLE "PostRoot" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "firstPublishedAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "liveVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostRoot_pkey" PRIMARY KEY ("id")
  );

  CREATE TABLE "PostVersion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "bodyData" JSONB,
    "tiptapBodyData" JSONB,
    "rootId" TEXT NOT NULL,
    "imageCoverId" TEXT,
    "seoId" TEXT,
    "userId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "preSchedulingStatus" "ContentStatus",
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PostVersion_pkey" PRIMARY KEY ("id")
  );

  CREATE TABLE "_PostVersionToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_PostVersionToTag_AB_pkey" PRIMARY KEY ("A", "B")
  );

  CREATE UNIQUE INDEX "PostRoot_currentVersionId_key" ON "PostRoot"("currentVersionId");
  CREATE UNIQUE INDEX "PostRoot_liveVersionId_key" ON "PostRoot"("liveVersionId");
  CREATE INDEX "PostVersion_rootId_idx" ON "PostVersion"("rootId");
  CREATE INDEX "PostVersion_status_scheduledAt_idx" ON "PostVersion"("status", "scheduledAt");
  CREATE UNIQUE INDEX "PostVersion_rootId_version_key" ON "PostVersion"("rootId", "version");
  CREATE INDEX "_PostVersionToTag_B_index" ON "_PostVersionToTag"("B");

  -- =========================================================================
  -- 2. Pick, per root group, the current revision (highest version) and the
  --    live revision (the PUBLISHED one, if any). They differ for a published
  --    post with an in-progress edit.
  -- =========================================================================

  CREATE TEMP TABLE "_PostCurrent" AS
  SELECT DISTINCT ON (b."grp")
    b."grp",
    b."id" AS "currentId",
    b."slug" AS "currentSlug"
  FROM (
    SELECT
      COALESCE("rootId", "id") AS "grp",
      "id",
      "slug",
      "version",
      "createdAt"
    FROM "Post"
  ) b
  ORDER BY b."grp", b."version" DESC, b."createdAt" DESC, b."id" DESC;

  CREATE TEMP TABLE "_PostLive" AS
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
    FROM "Post"
    WHERE "status" = 'PUBLISHED'
  ) b
  ORDER BY b."grp", b."isLatest" DESC, b."version" DESC, b."createdAt" DESC, b."id" DESC;

  -- =========================================================================
  -- 3. One root per group. The slug comes from the live revision when the post
  --    is published (so public URLs survive), else from the current one; the
  --    first publication date is the earliest recorded on a published revision.
  -- =========================================================================

  INSERT INTO "PostRoot" ("id", "slug", "firstPublishedAt", "createdAt", "updatedAt")
  SELECT
    g."grp",
    COALESCE(l."liveSlug", c."currentSlug"),
    g."firstPublishedAt",
    g."createdAt",
    NOW()
  FROM (
    SELECT
      COALESCE("rootId", "id") AS "grp",
      MIN("createdAt") AS "createdAt",
      MIN("firstPublishedAt") FILTER (WHERE "status" = 'PUBLISHED') AS "firstPublishedAt"
    FROM "Post"
    GROUP BY COALESCE("rootId", "id")
  ) g
  JOIN "_PostCurrent" c ON c."grp" = g."grp"
  LEFT JOIN "_PostLive" l ON l."grp" = g."grp";

  -- =========================================================================
  -- 4. One version per legacy row, reusing the legacy id. Duplicate versions
  --    are renumbered densely per root (original order preserved). Any
  --    published revision other than the chosen live one is demoted to CHANGED
  --    so a root has at most one PUBLISHED version.
  -- =========================================================================

  INSERT INTO "PostVersion" (
    "id",
    "title",
    "description",
    "version",
    "status",
    "bodyData",
    "tiptapBodyData",
    "rootId",
    "imageCoverId",
    "seoId",
    "userId",
    "scheduledAt",
    "preSchedulingStatus",
    "publishedAt",
    "createdAt",
    "updatedAt"
  )
  SELECT
    v."id",
    v."title",
    v."description",
    v."newVersion",
    CASE
      WHEN v."id" = l."liveId" THEN 'PUBLISHED'::"ContentStatus"
      WHEN v."status" = 'PUBLISHED' THEN 'CHANGED'::"ContentStatus"
      ELSE v."status"
    END,
    v."bodyData",
    v."tiptapBodyData",
    v."grp",
    v."imageCoverId",
    v."seoId",
    v."userId",
    v."scheduledAt",
    v."preSchedulingStatus",
    v."publishedAt",
    v."createdAt",
    v."updatedAt"
  FROM (
    SELECT
      p."id",
      p."title",
      p."description",
      p."status",
      p."bodyData",
      p."tiptapBodyData",
      p."imageCoverId",
      p."seoId",
      p."userId",
      p."scheduledAt",
      p."preSchedulingStatus",
      p."publishedAt",
      p."createdAt",
      p."updatedAt",
      COALESCE(p."rootId", p."id") AS "grp",
      row_number() OVER (
        PARTITION BY COALESCE(p."rootId", p."id")
        ORDER BY p."version", p."createdAt", p."id"
      ) AS "newVersion"
    FROM "Post" p
  ) v
  LEFT JOIN "_PostLive" l ON l."grp" = v."grp";

  -- =========================================================================
  -- 5. Fill the root pointers.
  -- =========================================================================

  UPDATE "PostRoot" r
  SET "currentVersionId" = c."currentId"
  FROM "_PostCurrent" c
  WHERE r."id" = c."grp";

  UPDATE "PostRoot" r
  SET "liveVersionId" = l."liveId"
  FROM "_PostLive" l
  WHERE r."id" = l."grp";

  -- =========================================================================
  -- 6. Resolve slug collisions deterministically. Unique slugs are claimed
  --    first so a suffix never steals an existing slug; later duplicates get a
  --    `-N` suffix. Only then can the unique index be created.
  -- =========================================================================

  CREATE TEMP TABLE "_UsedSlug" ("slug" TEXT PRIMARY KEY);

  FOR rec IN
    SELECT r."id", r."slug"
    FROM "PostRoot" r
    JOIN (SELECT "slug", COUNT(*) AS cnt FROM "PostRoot" GROUP BY "slug") g
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
      UPDATE "PostRoot" SET "slug" = candidate WHERE "id" = rec."id";
    END IF;
  END LOOP;

  DROP TABLE "_UsedSlug";

  CREATE UNIQUE INDEX "PostRoot_slug_key" ON "PostRoot"("slug");

  -- =========================================================================
  -- 7. Repoint the editorial relations. Ids are reused, so only the referenced
  --    table changes; no link rows need to move. The implicit Post <-> Tag join
  --    is renamed to its new model-derived name (`_PostVersionToTag`).
  -- =========================================================================

  INSERT INTO "_PostVersionToTag" ("A", "B")
  SELECT "A", "B" FROM "_PostToTag";

  ALTER TABLE "PostCategory" DROP CONSTRAINT "PostCategory_postId_fkey";
  ALTER TABLE "PostCategory" ADD CONSTRAINT "PostCategory_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "PostVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "PostAuthor" DROP CONSTRAINT "PostAuthor_postId_fkey";
  ALTER TABLE "PostAuthor" ADD CONSTRAINT "PostAuthor_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "PostVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "Faq" DROP CONSTRAINT "Faq_postId_fkey";
  ALTER TABLE "Faq" ADD CONSTRAINT "Faq_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "PostVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  -- =========================================================================
  -- 8. Drop the legacy tables. Their self-relation and FKs go with them.
  -- =========================================================================

  DROP TABLE "_PostToTag";
  DROP TABLE "Post";

  -- =========================================================================
  -- 9. Foreign keys for the new tables.
  -- =========================================================================

  ALTER TABLE "PostRoot" ADD CONSTRAINT "PostRoot_currentVersionId_fkey"
    FOREIGN KEY ("currentVersionId") REFERENCES "PostVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "PostRoot" ADD CONSTRAINT "PostRoot_liveVersionId_fkey"
    FOREIGN KEY ("liveVersionId") REFERENCES "PostVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "PostVersion" ADD CONSTRAINT "PostVersion_rootId_fkey"
    FOREIGN KEY ("rootId") REFERENCES "PostRoot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "PostVersion" ADD CONSTRAINT "PostVersion_imageCoverId_fkey"
    FOREIGN KEY ("imageCoverId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "PostVersion" ADD CONSTRAINT "PostVersion_seoId_fkey"
    FOREIGN KEY ("seoId") REFERENCES "Seo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "PostVersion" ADD CONSTRAINT "PostVersion_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

  ALTER TABLE "_PostVersionToTag" ADD CONSTRAINT "_PostVersionToTag_A_fkey"
    FOREIGN KEY ("A") REFERENCES "PostVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  ALTER TABLE "_PostVersionToTag" ADD CONSTRAINT "_PostVersionToTag_B_fkey"
    FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

  DROP TABLE "_PostCurrent";
  DROP TABLE "_PostLive";
END $$;
