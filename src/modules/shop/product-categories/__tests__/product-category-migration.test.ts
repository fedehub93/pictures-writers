import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { Client } from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "prisma/migrations/20261009120000_deversion_product_category/migration.sql",
);

const migrationSql = readFileSync(MIGRATION_PATH, "utf8");

/**
 * The ProductCategory collapse drops the legacy versioning columns, so it
 * cannot be replayed against the already-collapsed public schema. Instead we
 * reconstruct the legacy shape in a throwaway schema, run the migration there,
 * and assert on the result. `SET search_path` puts the throwaway schema first,
 * so the migration's unqualified `"ProductCategory"`/`"Product"` resolve there
 * while the referenced `"Seo"`, `"Settings"`, `"PageVersion"`,
 * `"PostVersion"`, `"Category"`, `"Tag"`, and the `ContentStatus` enum still
 * resolve to the public schema. Dropping the schema cleans up completely.
 */
const SCHEMA = "product_category_migration_test";

const LEGACY_DDL = `
CREATE SCHEMA "${SCHEMA}";
SET search_path TO "${SCHEMA}", public;

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "categoryId" TEXT,
  "seoId" TEXT,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductCategory" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "version" INTEGER NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  "rootId" TEXT,
  "seoId" TEXT,
  "firstPublishedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductCategory_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ProductCategory_rootId_idx" ON "ProductCategory"("rootId");
`;

let client: Client;

const seoIds: string[] = [];

async function createSeo(title: string) {
  const seo = await db.seo.create({
    data: { title, version: 1, description: "" },
  });
  seoIds.push(seo.id);
  return seo;
}

interface LegacyCategoryInput {
  id: string;
  rootId: string | null;
  slug: string;
  title: string;
  version: number;
  status: ContentStatus;
  isLatest: boolean;
  seoId: string | null;
  createdAt: Date;
}

async function insertLegacyCategory(category: LegacyCategoryInput) {
  await client.query(
    `INSERT INTO "ProductCategory" (
       "id", "rootId", "slug", "title", "version", "status", "isLatest",
       "seoId", "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$9)`,
    [
      category.id,
      category.rootId,
      category.slug,
      category.title,
      category.version,
      category.status,
      category.isLatest,
      category.seoId,
      category.createdAt,
    ],
  );
}

async function insertProduct(id: string, categoryId: string | null) {
  await client.query(
    `INSERT INTO "Product" ("id", "categoryId") VALUES ($1,$2)`,
    [id, categoryId],
  );
}

async function seedLegacyData() {
  const marker = randomUUID();
  const sharedSlug = `shared-${marker}`;
  const uniqueSlug = `unique-${marker}`;

  const seoA1 = await createSeo("A live");
  const seoA2 = await createSeo("A draft");
  const seoB1 = await createSeo("B v1");
  const seoB2 = await createSeo("B v2");
  const seoC1 = await createSeo("C");

  // Root A: a published, `isLatest` row plus a newer staged revision. The
  // survivor is the `isLatest` one, and the product links must move onto it.
  const a1 = randomUUID();
  const a2 = randomUUID();
  await insertLegacyCategory({
    id: a1,
    rootId: a1,
    slug: sharedSlug,
    title: "A live",
    version: 1,
    status: ContentStatus.PUBLISHED,
    isLatest: true,
    seoId: seoA1.id,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  });
  await insertLegacyCategory({
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

  // Root B: no `isLatest` and no published row, whose slug collides with A.
  const b1 = randomUUID();
  const b2 = randomUUID();
  await insertLegacyCategory({
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
  await insertLegacyCategory({
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

  // Root C: a single, never-versioned row with a null rootId and unique slug.
  const c1 = randomUUID();
  await insertLegacyCategory({
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

  // Products linked to each revision.
  const productOnA1 = randomUUID();
  const productOnA2 = randomUUID();
  const productOnB1 = randomUUID();
  const productOnB2 = randomUUID();
  const productOnC1 = randomUUID();
  await insertProduct(productOnA1, a1);
  await insertProduct(productOnA2, a2);
  await insertProduct(productOnB1, b1);
  await insertProduct(productOnB2, b2);
  await insertProduct(productOnC1, c1);

  return {
    sharedSlug,
    uniqueSlug,
    ids: { a1, a2, b1, b2, c1 },
    products: { productOnA1, productOnA2, productOnB1, productOnB2, productOnC1 },
    seo: { a1: seoA1.id, a2: seoA2.id, b1: seoB1.id, b2: seoB2.id, c1: seoC1.id },
  };
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

  if (seoIds.length > 0) {
    await db.seo.deleteMany({ where: { id: { in: seoIds } } });
  }

  seoIds.length = 0;
});

async function readCategories() {
  const { rows } = await client.query<{ id: string; slug: string }>(
    `SELECT "id", "slug" FROM "ProductCategory" ORDER BY "slug"`,
  );
  return rows;
}

async function readProducts() {
  const { rows } = await client.query<{ id: string; categoryId: string | null }>(
    `SELECT "id", "categoryId" FROM "Product"`,
  );
  return rows;
}

describe("deversion_product_category migration", () => {
  it("collapses each logical category into one row, repoints products, and resolves slug collisions", async () => {
    const seeded = await seedLegacyData();

    await client.query(migrationSql);

    const categories = await readCategories();
    expect(categories).toHaveLength(3);
    expect(new Set(categories.map((category) => category.id))).toEqual(
      new Set([seeded.ids.a1, seeded.ids.b2, seeded.ids.c1]),
    );

    // Slug collisions resolved deterministically: the earlier survivor keeps
    // the slug, the later duplicate gets a numeric suffix.
    const byId = new Map(categories.map((category) => [category.id, category]));
    expect(byId.get(seeded.ids.a1)!.slug).toBe(seeded.sharedSlug);
    expect(byId.get(seeded.ids.b2)!.slug).toBe(`${seeded.sharedSlug}-1`);
    expect(byId.get(seeded.ids.c1)!.slug).toBe(seeded.uniqueSlug);

    // Products that pointed at a deleted revision now point at its survivor.
    const products = await readProducts();
    const categoryByProduct = new Map(
      products.map((product) => [product.id, product.categoryId]),
    );
    expect(categoryByProduct.get(seeded.products.productOnA1)).toBe(seeded.ids.a1);
    expect(categoryByProduct.get(seeded.products.productOnA2)).toBe(seeded.ids.a1);
    expect(categoryByProduct.get(seeded.products.productOnB1)).toBe(seeded.ids.b2);
    expect(categoryByProduct.get(seeded.products.productOnB2)).toBe(seeded.ids.b2);
    expect(categoryByProduct.get(seeded.products.productOnC1)).toBe(seeded.ids.c1);

    // Orphaned SEO from the deleted revisions is removed; surviving rows keep theirs.
    const survivingSeo = await client.query<{ seoId: string | null }>(
      `SELECT "seoId" FROM "ProductCategory"`,
    );
    const keptSeo = new Set(
      survivingSeo.rows.map((row) => row.seoId).filter(Boolean),
    );
    expect(keptSeo).toEqual(
      new Set([seeded.seo.a1, seeded.seo.b2, seeded.seo.c1]),
    );
    const { rows: seoRows } = await client.query<{ id: string }>(
      `SELECT "id" FROM "Seo" WHERE "id" = ANY($1)`,
      [[seeded.seo.a2, seeded.seo.b1]],
    );
    expect(seoRows).toHaveLength(0);

    // The versioning columns are gone and the unique slug index exists.
    const { rows: columns } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'ProductCategory'`,
    );
    const columnNames = columns.map((column) => column.column_name);
    expect(columnNames).not.toContain("rootId");
    expect(columnNames).not.toContain("version");
    expect(columnNames).not.toContain("status");
    expect(columnNames).not.toContain("isLatest");
    expect(columnNames).not.toContain("firstPublishedAt");
    expect(columnNames).not.toContain("publishedAt");

    const { rows: indexes } = await client.query<{ indexname: string }>(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = current_schema() AND tablename = 'ProductCategory'`,
    );
    expect(indexes.map((index) => index.indexname)).toContain(
      "ProductCategory_slug_key",
    );
  });

  it("is idempotent: re-running against the collapsed schema is a no-op", async () => {
    const seeded = await seedLegacyData();

    await client.query(migrationSql);
    await client.query(migrationSql);

    const categories = await readCategories();
    expect(categories).toHaveLength(3);
    expect(categories.some((category) => category.id === seeded.ids.a1)).toBe(
      true,
    );

    const products = await readProducts();
    expect(products).toHaveLength(5);
  });
});
