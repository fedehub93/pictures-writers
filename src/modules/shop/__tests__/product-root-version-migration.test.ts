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
import { ContentStatus, ProductType } from "@/generated/prisma";

const MIGRATION_PATH = path.resolve(
  process.cwd(),
  "prisma/migrations/20261009130000_add_product_root_and_version/migration.sql",
);

const migrationSql = readFileSync(MIGRATION_PATH, "utf8");

/**
 * The Product cut-over drops the legacy `Product` table, so it cannot be
 * replayed against the already-migrated public schema. Instead we reconstruct
 * the legacy shape in a throwaway schema, run the migration there, and assert on
 * the result. `SET search_path` puts the throwaway schema first, so the
 * migration's unqualified `"Product"`/`"ProductRoot"`/... resolve there while
 * the referenced `"Seo"`, `"User"`, `"Media"`, `"Form"`, `"ProductCategory"`
 * and the enums still resolve to the public schema. Dropping the schema cleans
 * up completely, leaving the migrated public schema untouched.
 */
const SCHEMA = "product_migration_test";

/**
 * Minimal legacy DDL: only the columns the migration reads plus the relation
 * tables it repoints. The referenced public tables are shared, not copied.
 * `OrderItem` intentionally omits its `Order` FK because the migration never
 * touches it.
 */
const LEGACY_DDL = `
CREATE SCHEMA "${SCHEMA}";
SET search_path TO "${SCHEMA}", public;

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" JSONB,
  "type" "ProductType" NOT NULL,
  "version" INTEGER NOT NULL,
  "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
  "isLatest" BOOLEAN NOT NULL DEFAULT true,
  "tiptapDescription" JSONB,
  "imageCoverId" TEXT,
  "categoryId" TEXT,
  "acquisitionMode" "ProductAcquisitionMode" NOT NULL DEFAULT 'PAID',
  "price" DOUBLE PRECISION,
  "discountedPrice" DOUBLE PRECISION,
  "isFree" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "formId" TEXT,
  "rootId" TEXT,
  "seoId" TEXT,
  "userId" TEXT,
  "firstPublishedAt" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Product_rootId_fkey" FOREIGN KEY ("rootId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Product_rootId_idx" ON "Product"("rootId");

CREATE TABLE "ProductGallery" (
  "id" TEXT NOT NULL,
  "sort" INTEGER NOT NULL,
  "productId" TEXT NOT NULL,
  "mediaId" TEXT NOT NULL,
  CONSTRAINT "ProductGallery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductGallery_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ProductGallery_productId_mediaId_key" ON "ProductGallery"("productId", "mediaId");

CREATE TABLE "ProductExtra" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductExtra_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductExtra_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Faq" (
  "id" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "sort" INTEGER NOT NULL,
  "productId" TEXT,
  "postId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Faq_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Faq_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Reviews" (
  "id" TEXT NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL,
  "status" BOOLEAN NOT NULL DEFAULT false,
  "productId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Reviews_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "nameSnapshot" TEXT NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Purchase" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productRootId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
`;

let client: Client;

const userIds: string[] = [];
const categoryIds: string[] = [];
const seoIds: string[] = [];

async function createSeo(title: string) {
  const seo = await db.seo.create({
    data: { title, version: 1, description: "" },
  });
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
  const category = await db.productCategory.create({
    data: { title: "Category", slug: `cat-${randomUUID()}` },
  });
  categoryIds.push(category.id);
  return category;
}

interface LegacyProductInput {
  id: string;
  rootId: string | null;
  slug: string;
  title: string;
  type: ProductType;
  version: number;
  status: ContentStatus;
  isLatest: boolean;
  seoId: string | null;
  categoryId?: string | null;
  userId?: string | null;
  firstPublishedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt: Date;
}

async function insertLegacyProduct(product: LegacyProductInput) {
  await client.query(
    `INSERT INTO "Product" (
       "id", "rootId", "slug", "title", "type", "version", "status",
       "isLatest", "seoId", "categoryId", "userId", "firstPublishedAt",
       "publishedAt", "createdAt", "updatedAt"
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
    [
      product.id,
      product.rootId,
      product.slug,
      product.title,
      product.type,
      product.version,
      product.status,
      product.isLatest,
      product.seoId,
      product.categoryId ?? null,
      product.userId ?? null,
      product.firstPublishedAt ?? null,
      product.publishedAt ?? null,
      product.createdAt,
    ],
  );
}

async function seedLegacyData() {
  const marker = randomUUID();
  const sharedSlug = `shared-${marker}`;
  const uniqueSlug = `unique-${marker}`;

  const user = await createUser();
  const category = await createCategory();

  const seoA1 = await createSeo("A live");
  const seoB1 = await createSeo("B v1");
  const seoB2 = await createSeo("B v2");
  const seoC1 = await createSeo("C");

  // Root A: a published product with an in-progress edit. The root row (a1) is
  // `isLatest` (the live revision), the staged a2 is the highest version and
  // thus the current one. Both revisions share one Seo row, as they did in the
  // legacy model. a2 is also `PUBLISHED` in the legacy data, so the migration
  // must demote the superseded one to `CHANGED`.
  const a1 = randomUUID();
  const a2 = randomUUID();
  await insertLegacyProduct({
    id: a1,
    rootId: a1,
    slug: sharedSlug,
    title: "A live",
    type: ProductType.EBOOK,
    version: 1,
    status: ContentStatus.PUBLISHED,
    isLatest: true,
    seoId: seoA1.id,
    categoryId: category.id,
    firstPublishedAt: new Date("2024-01-01T00:00:00.000Z"),
    publishedAt: new Date("2024-01-01T00:00:00.000Z"),
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
  });
  await insertLegacyProduct({
    id: a2,
    rootId: a1,
    slug: sharedSlug,
    title: "A draft",
    type: ProductType.EBOOK,
    version: 2,
    status: ContentStatus.PUBLISHED,
    isLatest: false,
    seoId: seoA1.id,
    categoryId: category.id,
    userId: user.id,
    createdAt: new Date("2024-01-02T00:00:00.000Z"),
  });

  // Root B: a never-published product whose slug collides with A and whose
  // legacy version numbers are duplicated — the migration must renumber them.
  const b1 = randomUUID();
  const b2 = randomUUID();
  await insertLegacyProduct({
    id: b1,
    rootId: b1,
    slug: sharedSlug,
    title: "B v1",
    type: ProductType.SERVICE,
    version: 2,
    status: ContentStatus.DRAFT,
    isLatest: false,
    seoId: seoB1.id,
    createdAt: new Date("2024-01-03T00:00:00.000Z"),
  });
  await insertLegacyProduct({
    id: b2,
    rootId: b1,
    slug: sharedSlug,
    title: "B v2",
    type: ProductType.SERVICE,
    version: 2,
    status: ContentStatus.CHANGED,
    isLatest: false,
    seoId: seoB2.id,
    createdAt: new Date("2024-01-04T00:00:00.000Z"),
  });

  // Root C: a single, never-published row with a null rootId and unique slug.
  const c1 = randomUUID();
  await insertLegacyProduct({
    id: c1,
    rootId: null,
    slug: uniqueSlug,
    title: "C",
    type: ProductType.AFFILIATE,
    version: 1,
    status: ContentStatus.DRAFT,
    isLatest: true,
    seoId: seoC1.id,
    createdAt: new Date("2024-01-05T00:00:00.000Z"),
  });

  // Version-scoped editorial rows hang off revision ids and must stay put.
  await client.query(
    `INSERT INTO "ProductGallery" ("id", "sort", "productId", "mediaId") VALUES ($1,0,$2,$3)`,
    [randomUUID(), a2, randomUUID()],
  );
  await client.query(
    `INSERT INTO "ProductExtra" ("id", "name", "price", "productId") VALUES ($1,'Extra',9.99,$2)`,
    [randomUUID(), b1],
  );
  const faqId = randomUUID();
  await client.query(
    `INSERT INTO "Faq" ("id", "question", "answer", "sort", "productId") VALUES ($1,'Q1','A1',0,$2)`,
    [faqId, a2],
  );

  // Durable references name a *version* row and must be repointed to the root.
  await client.query(
    `INSERT INTO "Reviews" ("id", "rating", "productId") VALUES ($1,5,$2)`,
    [randomUUID(), a2],
  );
  await client.query(
    `INSERT INTO "OrderItem" ("id", "orderId", "productId", "nameSnapshot", "unitPrice", "totalPrice") VALUES ($1,$2,$3,'A',10,10)`,
    [randomUUID(), randomUUID(), b2],
  );
  await client.query(
    `INSERT INTO "Purchase" ("id", "email", "productId", "productRootId") VALUES ($1,'buyer@example.com',$2,$3)`,
    [randomUUID(), a2, a1],
  );

  return {
    sharedSlug,
    uniqueSlug,
    ids: { a1, a2, b1, b2, c1 },
    categoryId: category.id,
    seo: { a1: seoA1.id, a2: seoA1.id, b1: seoB1.id, b2: seoB2.id, c1: seoC1.id },
  };
}

interface RootRow {
  id: string;
  slug: string;
  type: string;
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
  categoryId: string | null;
  userId: string | null;
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
    await db.productCategory.deleteMany({ where: { id: { in: categoryIds } } });
  }
  if (seoIds.length > 0) {
    await db.seo.deleteMany({ where: { id: { in: seoIds } } });
  }

  userIds.length = 0;
  categoryIds.length = 0;
  seoIds.length = 0;
});

async function readRoots() {
  const { rows } = await client.query<RootRow>(
    `SELECT "id", "slug", "type", "firstPublishedAt", "currentVersionId", "liveVersionId" FROM "ProductRoot"`,
  );
  return rows;
}

async function readVersions() {
  const { rows } = await client.query<VersionRow>(
    `SELECT "id", "rootId", "version", "status", "title", "seoId", "categoryId", "userId" FROM "ProductVersion" ORDER BY "version"`,
  );
  return rows;
}

describe("add_product_root_and_version migration", () => {
  it("splits each logical product into one root, reuses ids, repoints relations and durable references, and resolves slug collisions", async () => {
    const seeded = await seedLegacyData();

    await client.query(migrationSql);

    const roots = await readRoots();
    expect(roots).toHaveLength(3);
    expect(new Set(roots.map((root) => root.id))).toEqual(
      new Set([seeded.ids.a1, seeded.ids.b1, seeded.ids.c1]),
    );

    const rootA = roots.find((root) => root.id === seeded.ids.a1)!;
    const rootB = roots.find((root) => root.id === seeded.ids.b1)!;
    const rootC = roots.find((root) => root.id === seeded.ids.c1)!;

    // `type` lives on the root.
    expect(rootA.type).toBe(ProductType.EBOOK);
    expect(rootB.type).toBe(ProductType.SERVICE);
    expect(rootC.type).toBe(ProductType.AFFILIATE);

    // Pointers: current is the highest version, live is the published one.
    expect(rootA.currentVersionId).toBe(seeded.ids.a2);
    expect(rootA.liveVersionId).toBe(seeded.ids.a1);
    expect(rootA.firstPublishedAt?.toISOString()).toBe(
      "2024-01-01T00:00:00.000Z",
    );

    expect(rootB.currentVersionId).toBe(seeded.ids.b2);
    expect(rootB.liveVersionId).toBeNull();
    expect(rootB.firstPublishedAt).toBeNull();

    expect(rootC.currentVersionId).toBe(seeded.ids.c1);
    expect(rootC.liveVersionId).toBeNull();

    // Slug collisions resolved deterministically.
    expect(rootA.slug).toBe(seeded.sharedSlug);
    expect(rootB.slug).toBe(`${seeded.sharedSlug}-1`);
    expect(rootC.slug).toBe(seeded.uniqueSlug);

    // Every legacy row becomes a version, reusing its id and renumbered per root.
    const versions = await readVersions();
    expect(versions).toHaveLength(5);
    expect(new Set(versions.map((version) => version.id))).toEqual(
      new Set(Object.values(seeded.ids)),
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

    // SEO and category link are carried onto the version; the one shared SEO
    // row is used by both revisions and the superseded PUBLISHED row is demoted
    // to CHANGED so the root has at most one PUBLISHED version.
    expect(versionA1.seoId).toBe(seeded.seo.a1);
    expect(versionA2.seoId).toBe(seeded.seo.a1);
    expect(versionA2.status).toBe("CHANGED");
    expect(versionA1.categoryId).toBe(seeded.categoryId);
    expect(versionA2.categoryId).toBe(seeded.categoryId);
    expect(versionA2.userId).not.toBeNull();

    // The legacy `description` column is gone.
    const { rows: columns } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'ProductVersion'`,
    );
    expect(columns.map((column) => column.column_name)).not.toContain(
      "description",
    );

    // Durable references now name the root.
    const { rows: reviews } = await client.query<{ productId: string }>(
      `SELECT "productId" FROM "Reviews"`,
    );
    expect(reviews).toEqual([{ productId: seeded.ids.a1 }]);

    const { rows: orderItems } = await client.query<{ productId: string }>(
      `SELECT "productId" FROM "OrderItem"`,
    );
    expect(orderItems).toEqual([{ productId: seeded.ids.b1 }]);

    const { rows: purchases } = await client.query<{ productId: string }>(
      `SELECT "productId" FROM "Purchase"`,
    );
    expect(purchases).toEqual([{ productId: seeded.ids.a1 }]);

    // `Purchase.productRootId` is dropped.
    const { rows: purchaseColumns } = await client.query<{
      column_name: string;
    }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = current_schema() AND table_name = 'Purchase'`,
    );
    expect(purchaseColumns.map((column) => column.column_name)).not.toContain(
      "productRootId",
    );

    // Editorial relations stay put (ids reused) but the FK targets change.
    const { rows: relations } = await client.query<{
      conname: string;
      reftable: string;
    }>(
      `SELECT c.conname, rc.relname AS reftable
       FROM pg_constraint c
       JOIN pg_class rc ON rc.oid = c.confrelid
       WHERE c.connamespace = current_schema()::regnamespace
         AND c.conname IN (
           'ProductGallery_productId_fkey', 'ProductExtra_productId_fkey',
           'Faq_productId_fkey', 'Reviews_productId_fkey',
           'OrderItem_productId_fkey', 'Purchase_productId_fkey'
         )`,
    );
    expect(
      relations.map((row) => `${row.conname}->${row.reftable}`).sort(),
    ).toEqual(
      [
        "ProductGallery_productId_fkey->ProductVersion",
        "ProductExtra_productId_fkey->ProductVersion",
        "Faq_productId_fkey->ProductVersion",
        "Reviews_productId_fkey->ProductRoot",
        "OrderItem_productId_fkey->ProductRoot",
        "Purchase_productId_fkey->ProductRoot",
      ].sort(),
    );

    // The legacy table is gone.
    const { rows: legacyTables } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = 'Product'`,
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
