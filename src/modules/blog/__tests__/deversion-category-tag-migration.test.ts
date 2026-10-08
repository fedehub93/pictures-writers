import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db } from "@/shared/lib/db";

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "prisma/migrations/20261008140000_deversion_category_tag/migration.sql",
);

const migrationSql = readFileSync(MIGRATION_PATH, "utf8");

const raw = (sql: string) => db.$executeRawUnsafe(sql);

const categoryIds: string[] = [];
const tagIds: string[] = [];
const seoIds: string[] = [];
const postIds: string[] = [];

type ContentStatus = "DRAFT" | "CHANGED" | "PUBLISHED" | "SCHEDULED";

interface LegacyFields {
  rootId: string | null;
  version: number;
  status: ContentStatus;
  isLatest: boolean;
}

async function setLegacy(
  table: "Category" | "Tag",
  id: string,
  fields: LegacyFields,
) {
  const rootId = fields.rootId === null ? "NULL" : `'${fields.rootId}'`;
  await raw(
    `UPDATE "${table}" SET ` +
      `"rootId" = ${rootId}, ` +
      `"version" = ${fields.version}, ` +
      `"status" = '${fields.status}', ` +
      `"isLatest" = ${fields.isLatest ? "true" : "false"} ` +
      `WHERE "id" = '${id}'`,
  );
}

/**
 * Re-create the columns and indexes the de-version migration expects to find
 * on a legacy database: the self-relation versioning columns on `Category` and
 * `Tag`, and no unique constraint on slug yet.
 */
async function addLegacyColumns() {
  await raw(`DROP INDEX IF EXISTS "Category_slug_key"`);
  await raw(`DROP INDEX IF EXISTS "Tag_slug_key"`);

  for (const table of ["Category", "Tag"]) {
    await raw(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1`,
    );
    await raw(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT'`,
    );
    await raw(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "isLatest" BOOLEAN NOT NULL DEFAULT true`,
    );
    await raw(`ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "rootId" TEXT`);
    await raw(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "firstPublishedAt" TIMESTAMP(3)`,
    );
    await raw(
      `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3)`,
    );
  }
}

/**
 * Undo `addLegacyColumns` in case the migration never ran to completion (it
 * drops the legacy columns itself). Safe to call in every `afterEach`.
 */
async function restoreCollapsedSchema() {
  for (const table of ["Category", "Tag"]) {
    await raw(
      `ALTER TABLE "${table}" ` +
        `DROP COLUMN IF EXISTS "version", ` +
        `DROP COLUMN IF EXISTS "status", ` +
        `DROP COLUMN IF EXISTS "isLatest", ` +
        `DROP COLUMN IF EXISTS "rootId", ` +
        `DROP COLUMN IF EXISTS "firstPublishedAt", ` +
        `DROP COLUMN IF EXISTS "publishedAt"`,
    );
  }
  await raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug")`,
  );
  await raw(
    `CREATE UNIQUE INDEX IF NOT EXISTS "Tag_slug_key" ON "Tag"("slug")`,
  );
}

async function createSeo(title: string) {
  const seo = await db.seo.create({ data: { title, version: 1 } });
  seoIds.push(seo.id);
  return seo;
}

async function createLegacyCategory(
  opts: {
    title: string;
    slug: string;
    createdAt: Date;
    seoId: string;
  } & LegacyFields,
) {
  const category = await db.category.create({
    data: {
      title: opts.title,
      slug: opts.slug,
      seoId: opts.seoId,
      createdAt: opts.createdAt,
      updatedAt: opts.createdAt,
    },
  });
  categoryIds.push(category.id);
  await setLegacy("Category", category.id, opts);
  return category;
}

async function createLegacyTag(
  opts: {
    title: string;
    slug: string;
    createdAt: Date;
    seoId: string;
  } & LegacyFields,
) {
  const tag = await db.tag.create({
    data: {
      title: opts.title,
      slug: opts.slug,
      seoId: opts.seoId,
      createdAt: opts.createdAt,
      updatedAt: opts.createdAt,
    },
  });
  tagIds.push(tag.id);
  await setLegacy("Tag", tag.id, opts);
  return tag;
}

async function createPost() {
  const post = await db.post.create({
    data: {
      title: `Post ${randomUUID()}`,
      slug: `post-${randomUUID()}`,
      version: 1,
    },
  });
  postIds.push(post.id);
  return post;
}

beforeEach(async () => {
  categoryIds.length = 0;
  tagIds.length = 0;
  seoIds.length = 0;
  postIds.length = 0;
  await addLegacyColumns();
});

afterEach(async () => {
  if (postIds.length > 0) {
    await db.post.deleteMany({ where: { id: { in: postIds } } });
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
  await restoreCollapsedSchema();

  categoryIds.length = 0;
  tagIds.length = 0;
  seoIds.length = 0;
  postIds.length = 0;
});

describe("deversion_category_tag migration", () => {
  it("collapses versions into one row per item, repoints links, and resolves slug collisions", async () => {
    const marker = randomUUID();
    const sharedSlug = `shared-${marker}`;
    const uniqueSlug = `unique-${marker}`;
    const tagSharedSlug = `tag-shared-${marker}`;
    const tagUniqueSlug = `tag-unique-${marker}`;

    // --- Category: two roots that both survive with the same slug -----------
    const seoCatA1 = await createSeo("A v1");
    const seoCatA2 = await createSeo("A v2");
    const seoCatB1 = await createSeo("B v1");
    const seoCatB2 = await createSeo("B v2");
    const seoCatC1 = await createSeo("C");

    const catA1 = await createLegacyCategory({
      title: "A v1",
      slug: sharedSlug,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      seoId: seoCatA1.id,
      rootId: `root-a-${marker}`,
      version: 1,
      status: "CHANGED",
      isLatest: false,
    });
    const catA2 = await createLegacyCategory({
      title: "A v2",
      slug: sharedSlug,
      createdAt: new Date("2024-01-02T00:00:00.000Z"),
      seoId: seoCatA2.id,
      rootId: `root-a-${marker}`,
      version: 2,
      status: "PUBLISHED",
      isLatest: true,
    });
    const catB1 = await createLegacyCategory({
      title: "B v1",
      slug: sharedSlug,
      createdAt: new Date("2024-01-03T00:00:00.000Z"),
      seoId: seoCatB1.id,
      rootId: `root-b-${marker}`,
      version: 1,
      status: "DRAFT",
      isLatest: false,
    });
    const catB2 = await createLegacyCategory({
      title: "B v2",
      slug: sharedSlug,
      createdAt: new Date("2024-01-04T00:00:00.000Z"),
      seoId: seoCatB2.id,
      rootId: `root-b-${marker}`,
      version: 2,
      status: "CHANGED",
      isLatest: false,
    });
    const catC1 = await createLegacyCategory({
      title: "C",
      slug: uniqueSlug,
      createdAt: new Date("2024-01-05T00:00:00.000Z"),
      seoId: seoCatC1.id,
      rootId: null,
      version: 1,
      status: "PUBLISHED",
      isLatest: true,
    });

    // --- Tag: two survivors, one of them with a duplicate slug --------------
    const seoTagT1 = await createSeo("T v1");
    const seoTagT2 = await createSeo("T v2");
    const seoTagU1 = await createSeo("U");

    const tagT1 = await createLegacyTag({
      title: "T v1",
      slug: tagSharedSlug,
      createdAt: new Date("2024-02-01T00:00:00.000Z"),
      seoId: seoTagT1.id,
      rootId: `root-t-${marker}`,
      version: 1,
      status: "CHANGED",
      isLatest: false,
    });
    const tagT2 = await createLegacyTag({
      title: "T v2",
      slug: tagSharedSlug,
      createdAt: new Date("2024-02-02T00:00:00.000Z"),
      seoId: seoTagT2.id,
      rootId: `root-t-${marker}`,
      version: 2,
      status: "PUBLISHED",
      isLatest: true,
    });
    const tagU1 = await createLegacyTag({
      title: "U",
      slug: tagUniqueSlug,
      createdAt: new Date("2024-02-03T00:00:00.000Z"),
      seoId: seoTagU1.id,
      rootId: null,
      version: 1,
      status: "PUBLISHED",
      isLatest: true,
    });

    // --- Links pointing at deleted revisions --------------------------------
    const post1 = await createPost();
    const post2 = await createPost();
    await db.postCategory.createMany({
      data: [
        { postId: post1.id, categoryId: catA1.id, sort: 0 },
        { postId: post1.id, categoryId: catA2.id, sort: 1 },
        { postId: post2.id, categoryId: catB1.id, sort: 0 },
      ],
    });
    await db.$executeRawUnsafe(
      `INSERT INTO "_PostToTag" ("A", "B") VALUES ('${post1.id}', '${tagT1.id}'), ('${post1.id}', '${tagT2.id}'), ('${post2.id}', '${tagU1.id}')`,
    );

    // --- Run the collapse migration -----------------------------------------
    await raw(migrationSql);

    // One row per logical item.
    expect(await db.category.findUnique({ where: { id: catA1.id } })).toBeNull();
    expect(await db.category.findUnique({ where: { id: catB1.id } })).toBeNull();
    expect(await db.tag.findUnique({ where: { id: tagT1.id } })).toBeNull();

    const survivingCategories = await db.category.findMany({
      where: { id: { in: [catA2.id, catB2.id, catC1.id] } },
    });
    expect(survivingCategories).toHaveLength(3);

    // Survivors keep their id and their revision's slug, then collisions are
    // resolved deterministically (oldest survivor keeps the bare slug).
    await expect(
      db.category.findUniqueOrThrow({ where: { id: catA2.id } }),
    ).resolves.toMatchObject({ slug: sharedSlug, title: "A v2" });
    await expect(
      db.category.findUniqueOrThrow({ where: { id: catB2.id } }),
    ).resolves.toMatchObject({ slug: `${sharedSlug}-1`, title: "B v2" });
    await expect(
      db.category.findUniqueOrThrow({ where: { id: catC1.id } }),
    ).resolves.toMatchObject({ slug: uniqueSlug, title: "C" });

    await expect(
      db.tag.findUniqueOrThrow({ where: { id: tagT2.id } }),
    ).resolves.toMatchObject({ slug: tagSharedSlug, title: "T v2" });
    await expect(
      db.tag.findUniqueOrThrow({ where: { id: tagU1.id } }),
    ).resolves.toMatchObject({ slug: tagUniqueSlug, title: "U" });

    // Links repointed onto the survivor and de-duplicated.
    const post1Links = await db.postCategory.findMany({
      where: { postId: post1.id },
    });
    expect(post1Links).toHaveLength(1);
    expect(post1Links[0]!.categoryId).toBe(catA2.id);

    const post2Links = await db.postCategory.findMany({
      where: { postId: post2.id },
    });
    expect(post2Links).toHaveLength(1);
    expect(post2Links[0]!.categoryId).toBe(catB2.id);

    const tagLinks = await db.$queryRaw<{ A: string; B: string }[]>`
      SELECT "A", "B" FROM "_PostToTag"
      WHERE "A" IN (${post1.id}, ${post2.id})
    `;
    expect(tagLinks).toHaveLength(2);
    expect(tagLinks).toContainEqual({ A: post1.id, B: tagT2.id });
    expect(tagLinks).toContainEqual({ A: post2.id, B: tagU1.id });

    // SEO rows owned solely by deleted revisions are removed; survivors' are kept.
    expect(await db.seo.findUnique({ where: { id: seoCatA1.id } })).toBeNull();
    expect(await db.seo.findUnique({ where: { id: seoCatB1.id } })).toBeNull();
    expect(await db.seo.findUnique({ where: { id: seoTagT1.id } })).toBeNull();
    expect(
      await db.seo.findUnique({ where: { id: seoCatA2.id } }),
    ).not.toBeNull();
    expect(
      await db.seo.findUnique({ where: { id: seoCatB2.id } }),
    ).not.toBeNull();
    expect(
      await db.seo.findUnique({ where: { id: seoTagT2.id } }),
    ).not.toBeNull();

    // Versioning columns dropped and the unique slug constraint restored.
    const legacyColumns = await db.$queryRaw<{ column_name: string }[]>`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('Category', 'Tag')
        AND column_name IN (
          'rootId', 'version', 'isLatest', 'status',
          'firstPublishedAt', 'publishedAt'
        )
    `;
    expect(legacyColumns).toHaveLength(0);

    const indexes = await db.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname IN ('Category_slug_key', 'Tag_slug_key')
    `;
    expect(indexes.map((row) => row.indexname).sort()).toEqual([
      "Category_slug_key",
      "Tag_slug_key",
    ]);
  });

  it("is idempotent: re-running against a collapsed schema is a no-op", async () => {
    const marker = randomUUID();
    const slug = `stable-${marker}`;
    const seo = await createSeo("Stable");
    const category = await createLegacyCategory({
      title: "Stable",
      slug,
      createdAt: new Date("2024-03-01T00:00:00.000Z"),
      seoId: seo.id,
      rootId: null,
      version: 1,
      status: "PUBLISHED",
      isLatest: true,
    });

    await raw(migrationSql);
    await raw(migrationSql);

    await expect(
      db.category.findUniqueOrThrow({ where: { id: category.id } }),
    ).resolves.toMatchObject({ slug, title: "Stable" });
    expect(await db.seo.findUnique({ where: { id: seo.id } })).not.toBeNull();
  });
});
