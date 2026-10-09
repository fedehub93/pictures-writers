import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "prisma/migrations/20261008141035_add_post_root_and_version/migration.sql",
);

const migrationSql = readFileSync(MIGRATION_PATH, "utf8");

/**
 * The Post cut-over drops the legacy `Post` table, so it cannot be replayed
 * against the already-migrated public schema. Instead we reconstruct the
 * legacy shape in a throwaway schema, run the migration there, and assert on
 * the result. `SET search_path` puts the throwaway schema first, so the
 * migration's unqualified `"Post"`/`"PostRoot"`/... resolve there while the
 * referenced `"Seo"`, `"User"`, `"Category"`, `"Tag"`, and the `ContentStatus`
 * enum still resolve to the public schema. Dropping the schema cleans up
 * completely, leaving the migrated public schema untouched.
 */
const SCHEMA = "post_migration_test";

/**
 * Minimal legacy DDL: only the columns the migration reads plus the relation
 * tables it repoints. The referenced public tables are shared, not copied.
 */
const LEGACY_DDL = `
CREATE SCHEMA "${SCHEMA}";
SET search_path TO "${SCHEMA}", public;

CREATE TABLE "Post" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "version" INTEGER NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  "bodyData" JSONB,
  "tiptapBodyData" JSONB,
  "rootId" TEXT,
  "imageCoverId" TEXT,
  "seoId" TEXT,
  "userId" TEXT,
  "scheduledAt" TIMESTAMP(3),
  "preSchedulingStatus" "ContentStatus",
  "firstPublishedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Post_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Post_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Post_rootId_idx" ON "Post"("rootId");
CREATE INDEX "Post_status_scheduledAt_idx" ON "Post"("status", "scheduledAt");

CREATE TABLE "_PostToTag" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY ("A", "B"),
  CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "_PostToTag_B_index" ON "_PostToTag"("B");

CREATE TABLE "PostCategory" (
  "postId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "sort" INTEGER NOT NULL,
  CONSTRAINT "PostCategory_pkey" PRIMARY KEY ("postId", "categoryId"),
  CONSTRAINT "PostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "PostAuthor" (
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "sort" INTEGER NOT NULL,
  CONSTRAINT "PostAuthor_pkey" PRIMARY KEY ("postId", "userId"),
  CONSTRAINT "PostAuthor_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Faq" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sort" INTEGER NOT NULL,
  "postId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Faq_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

let client: Client;

const userIds: string[] = [];
const categoryIds: string[] = [];
const tagIds: string[] = [];
const seoIds: string[] = [];

async function createSeo(title: string) {
  const seo = await db.seo.create({ data: { title, version: 1, description: "" } });
  seoIds.push(seo.id);
  return seo;
}

async function createUser() {
  const user = await db.user.create({
    data: { email: `author-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  return user;
}

async function createCategory() {
  const category = await db.category.create({
    data: { title: "Category", slug: `cat-${randomUUID()}` },
  });
  categoryIds.push(category.id);
  return category;
}

async function createTag() {
  const tag = await db.tag.create({
    data: { title: "Tag", slug: `tag-${randomUUID()}` },
  });
  tagIds.push(tag.id);
  return tag;
}

interface LegacyPostInput {
  id: string;
  rootId: string | null;
  slug: string;
  title: string;
  version: number;
  status: ContentStatus;
  isLatest: boolean;
  seoId: string | null;
  userId?: string | null;
  firstPublishedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
}

async function insertLegacyPost(post: LegacyPostInput) {
  await client.query(
    `INSERT INTO "Post" (
       "id", "rootId", "slug", "title", "version", "status", "isLatest",
       "seoId", "userId", "firstPublishedAt", "publishedAt", "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12)`,
    [
      post.id,
      post.rootId,
      post.slug,
      post.title,
      post.version,
      post.status,
      post.isLatest,
      post.seoId,
      post.userId ?? null,
      post.firstPublishedAt ?? null,
      post.publishedAt ?? null,
      post.createdAt,
    ],
  );
}

async function seedLegacyData() {
  const marker = randomUUID();
  const sharedSlug = `shared-${marker}`;
  const uniqueSlug = `unique-${marker}`;

  const user = await createUser();
  const category = await createCategory();
  const tag = await createTag();

  const seoA1 = await createSeo("A live");
  const seoA2 = await createSeo("A draft");
  const seoB1 = await createSeo("B v1");
  const seoB2 = await createSeo("B v2");
  const seoC1 = await createSeo("C");

  // Root A: a published post with an in-progress edit. The root row (a1) is
  // `isLatest`, the staged a2 is the highest version and thus the current one.
  const a1 = randomUUID();
  const a2 = randomUUID();
  await insertLegacyPost({
    id: a1,
    rootId: a1,
    slug: sharedSlug,
    title: "A live",
    version: 1,
    status: ContentStatus.PUBLISHED,
    isLatest: true,
    seoId: seoA1.id,
    userId: user.id,
    firstPublishedAt: new Date("2024-01-01T00:00:00.000Z"),
    publishedAt: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  });
  await insertLegacyPost({
    id: a2,
    rootId: a1,
    slug: sharedSlug,
    title: "A draft",
    version: 2,
    status: ContentStatus.CHANGED,
    isLatest: false,
    seoId: seoA2.id,
    createdAt: new Date("2024-01-02T00:00:00.000Z"),
  });

  // Root B: a never-published post whose slug collides with A and whose legacy
  // version numbers are duplicated — the migration must renumber them densely.
  const b1 = randomUUID();
  const b2 = randomUUID();
  await insertLegacyPost({
    id: b1,
    rootId: b1,
    slug: sharedSlug,
    title: "B v1",
    version: 2,
    status: ContentStatus.DRAFT,
    isLatest: false,
    seoId: seoB1.id,
    createdAt: new Date("2024-01-03T00:00:00.000Z"),
  });
  await insertLegacyPost({
    id: b2,
    rootId: b1,
    slug: sharedSlug,
    title: "B v2",
    version: 2,
    status: ContentStatus.CHANGED,
    isLatest: false,
    seoId: seoB2.id,
    createdAt: new Date("2024-01-04T00:00:00.000Z"),
  });

  // Root C: a single, never-published row with a null rootId and unique slug.
  const c1 = randomUUID();
  await insertLegacyPost({
    id: c1,
    rootId: null,
    slug: uniqueSlug,
    title: "C",
    version: 1,
    status: ContentStatus.DRAFT,
    isLatest: true,
    seoId: seoC1.id,
    createdAt: new Date("2024-01-05T00:00:00.000Z"),
  });

  await client.query(
    `INSERT INTO "PostCategory" ("postId", "categoryId", "sort") VALUES ($1,$2,0), ($3,$2,1)`,
    [a2, category.id, c1],
  );
  await client.query(
    `INSERT INTO "PostAuthor" ("postId", "userId", "sort") VALUES ($1,$2,0)`,
    [a2, user.id],
  );
  const faqId = randomUUID();
  await client.query(
    `INSERT INTO "Faq" ("id", "question", "answer", "sort", "postId") VALUES ($1,'Q1','A1',0,$2)`,
    [faqId, a2],
  );
  await client.query(`INSERT INTO "_PostToTag" ("A", "B") VALUES ($1,$2)`, [
    a1,
    tag.id,
  ]);

  return {
    sharedSlug,
    uniqueSlug,
    ids: { a1, a2, b1, b2, c1 },
    tagId: tag.id,
    seo: {
      a1: seoA1.id,
      a2: seoA2.id,
      b1: seoB1.id,
      b2: seoB2.id,
    },
  };
}

interface RootRow {
  id: string;
  slug: string;
  firstPublishedAt: Date | null;
  currentVersionId: string | null;
  liveVersionId: string | null;
}

interface VersionRow {
  id: string;
  rootId: string;
  version: number;
  status: string;
  title: string;
  seoId: string | null;
}

beforeAll(async () => {
  client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

beforeEach(async () => {
  await client.query(LEGACY_DDL);
});

afterEach(async () => {
  await client.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`);

  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  if (categoryIds.length > 0) {
    await db.category.deleteMany({ where: { id: { in: categoryIds } } });
  }
  if (tagIds.length > 0) {
    await db.tag.deleteMany({ where: { id: { in: tagIds } } });
  }
  if (seoIds.length > 0) {
    await db.seo.deleteMany({ where: { id: { in: seoIds } } });
  }

  userIds.length = 0;
  categoryIds.length = 0;
  tagIds.length = 0;
  seoIds.length = 0;
});

async function readRoots() {
  const { rows } = await client.query<RootRow>(
    `SELECT "id", "slug", "firstPublishedAt", "currentVersionId", "liveVersionId" FROM "PostRoot"`,
  );
  return rows;
}

async function readVersions() {
  const { rows } = await client.query<VersionRow>(
    `SELECT "id", "rootId", "version", "status", "title", "seoId" FROM "PostVersion" ORDER BY "version"`,
  );
  return rows;
}

describe("add_post_root_and_version migration", () => {
  it("splits each logical post into one root, reuses ids, repoints relations and SEO, and resolves slug collisions", async () => {
    const seeded = await seedLegacyData();

    await client.query(migrationSql);

    const roots = await readRoots();
    expect(roots).toHaveLength(3);

    const rootA = roots.find((root) => root.id === seeded.ids.a1);
    const rootB = roots.find((root) => root.id === seeded.ids.b1);
    const rootC = roots.find((root) => root.id === seeded.ids.c1);
    expect(rootA).toBeDefined();
    expect(rootB).toBeDefined();
    expect(rootC).toBeDefined();

    // One root per logical post, ids reused from the legacy group id.
    expect(new Set(roots.map((root) => root.id))).toEqual(
      new Set([seeded.ids.a1, seeded.ids.b1, seeded.ids.c1]),
    );

    // Pointers: current is the highest version, live is the published one.
    expect(rootA!.currentVersionId).toBe(seeded.ids.a2);
    expect(rootA!.liveVersionId).toBe(seeded.ids.a1);
    expect(rootA!.firstPublishedAt?.toISOString()).toBe(
      "2024-01-01T00:00:00.000Z",
    );

    expect(rootB!.currentVersionId).toBe(seeded.ids.b2);
    expect(rootB!.liveVersionId).toBeNull();
    expect(rootB!.firstPublishedAt).toBeNull();

    expect(rootC!.currentVersionId).toBe(seeded.ids.c1);
    expect(rootC!.liveVersionId).toBeNull();

    // Slug collisions resolved deterministically: the earlier root keeps the
    // slug, the later duplicate gets a numeric suffix.
    expect(rootA!.slug).toBe(seeded.sharedSlug);
    expect(rootB!.slug).toBe(`${seeded.sharedSlug}-1`);
    expect(rootC!.slug).toBe(seeded.uniqueSlug);

    // Every legacy row becomes a version, reusing its id and renumbered per root.
    const versions = await readVersions();
    expect(versions).toHaveLength(5);
    expect(new Set(versions.map((version) => version.id))).toEqual(
      new Set([
        seeded.ids.a1,
        seeded.ids.a2,
        seeded.ids.b1,
        seeded.ids.b2,
        seeded.ids.c1,
      ]),
    );

    const versionA1 = versions.find((version) => version.id === seeded.ids.a1)!;
    const versionA2 = versions.find((version) => version.id === seeded.ids.a2)!;
    const versionB1 = versions.find((version) => version.id === seeded.ids.b1)!;
    const versionB2 = versions.find((version) => version.id === seeded.ids.b2)!;

    expect(versionA1).toMatchObject({
      rootId: seeded.ids.a1,
      version: 1,
      status: "PUBLISHED",
    });
    expect(versionA2).toMatchObject({
      rootId: seeded.ids.a1,
      version: 2,
      status: "CHANGED",
    });
    expect(versionB1).toMatchObject({
      rootId: seeded.ids.b1,
      version: 1,
      status: "DRAFT",
    });
    expect(versionB2).toMatchObject({
      rootId: seeded.ids.b1,
      version: 2,
      status: "CHANGED",
    });

    // SEO is carried over onto each version.
    expect(versionA1.seoId).toBe(seeded.seo.a1);
    expect(versionA2.seoId).toBe(seeded.seo.a2);
    expect(versionB1.seoId).toBe(seeded.seo.b1);
    expect(versionB2.seoId).toBe(seeded.seo.b2);

    // Editorial relations stay put (ids reused) but now hang off PostVersion.
    const { rows: categories } = await client.query<{ postId: string }>(
      `SELECT "postId" FROM "PostCategory" ORDER BY "postId"`,
    );
    expect(categories.map((row) => row.postId).sort()).toEqual(
      [seeded.ids.a2, seeded.ids.c1].sort(),
    );

    const { rows: authors } = await client.query<{ postId: string }>(
      `SELECT "postId" FROM "PostAuthor"`,
    );
    expect(authors).toEqual([{ postId: seeded.ids.a2 }]);

    const { rows: faqs } = await client.query<{ postId: string }>(
      `SELECT "postId" FROM "Faq"`,
    );
    expect(faqs).toEqual([{ postId: seeded.ids.a2 }]);

    const { rows: postTags } = await client.query<{ A: string; B: string }>(
      `SELECT "A", "B" FROM "_PostVersionToTag"`,
    );
    expect(postTags).toEqual([{ A: seeded.ids.a1, B: seeded.tagId }]);

    // The relation FKs now point at PostVersion, not the dropped legacy table.
    const { rows: relations } = await client.query<{
      conname: string;
      reftable: string;
    }>(
      `SELECT c.conname, rc.relname AS reftable
       FROM pg_constraint c
       JOIN pg_class rc ON rc.oid = c.confrelid
       WHERE c.connamespace = current_schema()::regnamespace
         AND c.conname IN (
           'PostCategory_postId_fkey', 'PostAuthor_postId_fkey',
           'Faq_postId_fkey', '_PostVersionToTag_A_fkey'
         )`,
    );
    expect(
      relations.map((row) => `${row.conname}->${row.reftable}`).sort(),
    ).toEqual(
      [
        "PostCategory_postId_fkey->PostVersion",
        "PostAuthor_postId_fkey->PostVersion",
        "Faq_postId_fkey->PostVersion",
        "_PostVersionToTag_A_fkey->PostVersion",
      ].sort(),
    );

    // The legacy tables are gone.
    const { rows: legacyTables } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name IN ('Post', '_PostToTag')`,
    );
    expect(legacyTables).toHaveLength(0);
  });

  it("is idempotent: re-running against the migrated schema is a no-op", async () => {
    const seeded = await seedLegacyData();

    await client.query(migrationSql);
    await client.query(migrationSql);

    const roots = await readRoots();
    const versions = await readVersions();
    expect(roots).toHaveLength(3);
    expect(versions).toHaveLength(5);
    expect(roots.some((root) => root.id === seeded.ids.a1)).toBe(true);
  });
});
