import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
// exercised against the test database without a session.
vi.mock("@/trpc/init", async () => {
  const { initTRPC } = await import("@trpc/server");
  const superjson = (await import("superjson")).default;
  const t = initTRPC.create({ transformer: superjson });

  return {
    createTRPCRouter: t.router,
    createCallerFactory: t.createCallerFactory,
    baseProcedure: t.procedure,
    protectedProcedure: t.procedure,
    permissionProcedure: () => t.procedure,
  };
});

import { createCallerFactory } from "@/trpc/init";

import { db } from "@/shared/lib/db";

import { productCategoriesRouter } from "../server/procedures";
import { getPublishedProductCategoryBySlug } from "../server/queries";

const createCaller = createCallerFactory(productCategoriesRouter);
const caller = createCaller({ userId: "test-user" });

const categoryIds: string[] = [];

async function createCategory(overrides: Record<string, unknown> = {}) {
  const category = await caller.create({
    title: `Category ${randomUUID()}`,
    slug: `category-${randomUUID()}`,
    ...overrides,
  });

  categoryIds.push(category.id);

  return category;
}

beforeEach(() => {
  categoryIds.length = 0;
});

afterEach(async () => {
  if (categoryIds.length > 0) {
    const categories = await db.productCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(categories.map((category) => category.seoId).filter(Boolean)),
    ] as string[];

    await db.productCategory.deleteMany({
      where: { id: { in: categoryIds } },
    });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  categoryIds.length = 0;
});

describe("productCategoriesRouter", () => {
  describe("create", () => {
    it("creates exactly one row with a linked SEO", async () => {
      const before = await db.productCategory.count();
      const created = await createCategory({
        title: "Ebooks",
        slug: `ebooks-${randomUUID()}`,
      });

      expect(await db.productCategory.count()).toBe(before + 1);
      const rows = await db.productCategory.findMany({ where: { id: created.id } });
      expect(rows).toHaveLength(1);
      expect(created.title).toBe("Ebooks");
      expect(created.seoId).toBeTruthy();
      expect(created.seo?.title).toBe("Ebooks");
    });

    it("does not expose versioning fields", async () => {
      const created = await createCategory();

      expect("rootId" in created).toBe(false);
      expect("version" in created).toBe(false);
      expect("isLatest" in created).toBe(false);
      expect("status" in created).toBe(false);
    });
  });

  describe("update", () => {
    it("mutates the single row in place", async () => {
      const created = await createCategory({ title: "Old title" });
      const before = await db.productCategory.count();

      const updated = await caller.update({
        id: created.id,
        title: "New title",
        slug: `new-slug-${randomUUID()}`,
        description: "Updated description",
      });

      expect(await db.productCategory.count()).toBe(before);
      expect(updated.id).toBe(created.id);
      expect(updated.title).toBe("New title");
      expect(updated.description).toBe("Updated description");

      const rows = await db.productCategory.findMany({
        where: { title: "New title" },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0]!.id).toBe(created.id);
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(
        caller.update({ id: randomUUID(), title: "Nope" }),
      ).rejects.toThrow();
    });
  });

  describe("updateSeo", () => {
    it("updates the linked SEO row in place", async () => {
      const created = await createCategory();
      const before = await caller.getOne({ id: created.id });
      const countBefore = await db.productCategory.count();

      const seo = await caller.updateSeo({
        id: created.id,
        title: "SEO title",
        description: "SEO description",
        noIndex: true,
        noFollow: false,
      });

      expect(seo.id).toBe(before.seoId);
      expect(seo.title).toBe("SEO title");
      expect(seo.description).toBe("SEO description");
      expect(seo.noIndex).toBe(true);
      expect(await db.productCategory.count()).toBe(countBefore);
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(
        caller.updateSeo({
          id: randomUUID(),
          noIndex: false,
          noFollow: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("remove", () => {
    it("removes the row and its SEO", async () => {
      const created = await createCategory();
      const loaded = await caller.getOne({ id: created.id });

      await caller.remove({ id: created.id });

      expect(
        await db.productCategory.findUnique({ where: { id: created.id } }),
      ).toBeNull();
      expect(
        await db.seo.findUnique({ where: { id: loaded.seoId! } }),
      ).toBeNull();
      categoryIds.length = 0;
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getOne", () => {
    it("returns the row with its SEO", async () => {
      const created = await createCategory();

      const loaded = await caller.getOne({ id: created.id });

      expect(loaded.id).toBe(created.id);
      expect(loaded.seoId).toBeTruthy();
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns a paginated envelope of one row per item", async () => {
      const marker = `Paginated ${randomUUID()}`;
      await createCategory({ title: `${marker} A` });
      await createCategory({ title: `${marker} B` });
      await createCategory({ title: `${marker} C` });

      const first = await caller.getMany({
        page: 1,
        pageSize: 2,
        search: marker,
      });
      expect(first.total).toBe(3);
      expect(first.totalPages).toBe(2);
      expect(first.items).toHaveLength(2);

      const second = await caller.getMany({
        page: 2,
        pageSize: 2,
        search: marker,
      });
      expect(second.items).toHaveLength(1);
    });

    it("searches by title", async () => {
      const marker = `Searchable ${randomUUID()}`;
      const match = await createCategory({ title: `${marker} match` });
      await createCategory({ title: `Unrelated ${randomUUID()}` });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.total).toBe(1);
      expect(result.items[0]!.id).toBe(match.id);
    });
  });
});

describe("getPublishedProductCategoryBySlug", () => {
  it("resolves the row by its stable slug", async () => {
    const slug = `public-${randomUUID()}`;
    const created = await createCategory({ slug });

    const loaded = await getPublishedProductCategoryBySlug({ slug });

    expect(loaded?.id).toBe(created.id);
    expect(loaded?.slug).toBe(slug);
  });

  it("returns null for an unknown slug", async () => {
    expect(
      await getPublishedProductCategoryBySlug({ slug: `missing-${randomUUID()}` }),
    ).toBeNull();
  });
});
