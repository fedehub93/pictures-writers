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

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { PERMISSIONS, getPermissionAlternatives } from "@/shared/lib/permissions";

import { productCategoriesRouter } from "../server/procedures";

const createCaller = createCallerFactory(productCategoriesRouter);
const caller = createCaller({ userId: "test-user" });

const rootIds: string[] = [];

async function createCategory(overrides: Record<string, unknown> = {}) {
  const category = await caller.create({
    title: `Category ${randomUUID()}`,
    slug: `category-${randomUUID()}`,
    ...overrides,
  });

  if (category.rootId) {
    rootIds.push(category.rootId);
  }

  return category;
}

beforeEach(() => {
  rootIds.length = 0;
});

afterEach(async () => {
  if (rootIds.length > 0) {
    const categories = await db.productCategory.findMany({
      where: { rootId: { in: rootIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(categories.map((category) => category.seoId).filter(Boolean)),
    ] as string[];

    await db.productCategory.deleteMany({ where: { rootId: { in: rootIds } } });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  rootIds.length = 0;
});

describe("productCategoriesRouter", () => {
  describe("create", () => {
    it("creates a draft root category with a rootId and SEO", async () => {
      const created = await createCategory({
        title: "Ebooks",
        slug: "ebooks",
      });

      expect(created.id).toBeTruthy();
      expect(created.title).toBe("Ebooks");
      expect(created.slug).toBe("ebooks");
      expect(created.version).toBe(1);
      expect(created.status).toBe(ContentStatus.DRAFT);
      expect(created.isLatest).toBe(true);
      expect(created.rootId).toBe(created.id);
      expect(created.seoId).toBeTruthy();
      expect(created.seo?.title).toBe("Ebooks");
    });
  });

  describe("update versioning", () => {
    it("updates a draft in place without creating a new version", async () => {
      const created = await createCategory();

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Updated title",
        description: "Updated description",
      });

      expect(updated.id).toBe(created.id);
      expect(updated.version).toBe(1);
      expect(updated.status).toBe(ContentStatus.DRAFT);
      expect(updated.isLatest).toBe(true);
      expect(updated.title).toBe("Updated title");
      expect(updated.description).toBe("Updated description");

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
      });
      expect(rows).toHaveLength(1);
    });

    it("creates a new CHANGED version when the latest version is published", async () => {
      const created = await createCategory();
      const published = await caller.publish({
        id: created.id,
        rootId: created.rootId!,
      });

      const updated = await caller.update({
        id: published.id,
        rootId: published.rootId!,
        title: "Next edition",
      });

      expect(updated.id).not.toBe(created.id);
      expect(updated.version).toBe(2);
      expect(updated.status).toBe(ContentStatus.CHANGED);
      expect(updated.isLatest).toBe(false);
      expect(updated.title).toBe("Next edition");

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
        orderBy: { version: "asc" },
      });
      expect(rows).toHaveLength(2);
      expect(rows[0]!.status).toBe(ContentStatus.PUBLISHED);
      expect(rows[0]!.isLatest).toBe(true);
      expect(rows[1]!.status).toBe(ContentStatus.CHANGED);
      expect(rows[1]!.isLatest).toBe(false);
    });

    it("does not dereference missing inputs when carrying over a version", async () => {
      const created = await createCategory();
      await caller.publish({ id: created.id, rootId: created.rootId! });

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
      });

      expect(updated.status).toBe(ContentStatus.CHANGED);
      expect(updated.slug).toBe(created.slug);
      expect(updated.seoId).toBe(created.seoId);
    });

    it("ignores fields outside the contract", async () => {
      const created = await createCategory();

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        status: ContentStatus.PUBLISHED,
        isLatest: false,
        seoId: randomUUID(),
      } as never);

      expect(updated.status).toBe(ContentStatus.DRAFT);
      expect(updated.isLatest).toBe(true);
      expect(updated.seoId).toBe(created.seoId);
    });

    it("throws NOT_FOUND when the root does not exist", async () => {
      await expect(
        caller.update({
          id: randomUUID(),
          rootId: randomUUID(),
          title: "Nope",
        }),
      ).rejects.toThrow();
    });
  });

  describe("updateSeo", () => {
    it("updates the SEO of a draft in place", async () => {
      const created = await createCategory();

      const seo = await caller.updateSeo({
        id: created.id,
        rootId: created.rootId!,
        title: "SEO title",
        description: "SEO description",
        noIndex: true,
        noFollow: false,
      });

      expect(seo.title).toBe("SEO title");
      expect(seo.description).toBe("SEO description");
      expect(seo.noIndex).toBe(true);

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
      });
      expect(rows).toHaveLength(1);
    });

    it("creates a new CHANGED version when the latest version is published", async () => {
      const created = await createCategory();
      await caller.publish({ id: created.id, rootId: created.rootId! });

      await caller.updateSeo({
        id: created.id,
        rootId: created.rootId!,
        title: "New SEO",
        noIndex: false,
        noFollow: false,
      });

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
        orderBy: { version: "asc" },
      });
      expect(rows).toHaveLength(2);
      expect(rows[1]!.status).toBe(ContentStatus.CHANGED);
      expect(rows[1]!.isLatest).toBe(false);
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(
        caller.updateSeo({
          id: randomUUID(),
          rootId: randomUUID(),
          noIndex: false,
          noFollow: false,
        }),
      ).rejects.toThrow();
    });
  });

  describe("publish and unpublish", () => {
    it("publishes a version and aligns isLatest across the root", async () => {
      const created = await createCategory();

      const published = await caller.publish({
        id: created.id,
        rootId: created.rootId!,
      });

      expect(published.status).toBe(ContentStatus.PUBLISHED);
      expect(published.isLatest).toBe(true);

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
      });
      expect(rows.every((row) => row.isLatest === (row.id === created.id))).toBe(
        true,
      );
    });

    it("unpublishes a version back to CHANGED and keeps a single latest version", async () => {
      const created = await createCategory();
      await caller.publish({ id: created.id, rootId: created.rootId! });
      const changed = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Draft ahead",
      });

      const unpublished = await caller.unpublish({ id: changed.id });

      expect(unpublished.status).toBe(ContentStatus.CHANGED);

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
      });
      const latest = rows.filter((row) => row.isLatest);
      expect(latest).toHaveLength(1);
      expect(latest[0]!.id).toBe(changed.id);
    });

    it("throws NOT_FOUND when publishing an unknown category", async () => {
      await expect(
        caller.publish({ id: randomUUID(), rootId: randomUUID() }),
      ).rejects.toThrow();
    });

    it("throws NOT_FOUND when unpublishing an unknown category", async () => {
      await expect(caller.unpublish({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getOne", () => {
    it("returns the category with its SEO", async () => {
      const created = await createCategory();

      const loaded = await caller.getOne({ id: created.id });

      expect(loaded.id).toBe(created.id);
      expect(loaded.seoId).toBe(created.seoId);
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getLastByRootId", () => {
    it("returns the most recent version of the root", async () => {
      const created = await createCategory();
      await caller.publish({ id: created.id, rootId: created.rootId! });
      const changed = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Draft ahead",
      });

      const loaded = await caller.getLastByRootId({
        rootId: created.rootId!,
      });

      expect(loaded.id).toBe(changed.id);
      expect(loaded.title).toBe("Draft ahead");
      expect(loaded.seo).toBeTruthy();
    });

    it("throws NOT_FOUND for an unknown root", async () => {
      await expect(
        caller.getLastByRootId({ rootId: randomUUID() }),
      ).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns a paginated envelope of one row per root", async () => {
      const created = await createCategory({
        title: "Paginated marker",
        slug: `paginated-${randomUUID()}`,
      });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: "Paginated marker",
      });

      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.items[0]!.rootId).toBe(created.rootId);
    });

    it("filters by status", async () => {
      const published = await createCategory({
        title: "Live category",
        slug: `live-${randomUUID()}`,
      });
      const draft = await createCategory({
        title: "Draft category",
        slug: `draft-${randomUUID()}`,
      });
      await caller.publish({ id: published.id, rootId: published.rootId! });

      const live = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: "category",
        status: ContentStatus.PUBLISHED,
      });
      const drafts = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: "category",
        status: ContentStatus.DRAFT,
      });

      expect(live.items.map((item) => item.rootId)).toContain(published.rootId);
      expect(live.items.map((item) => item.rootId)).not.toContain(draft.rootId);
      expect(drafts.items.map((item) => item.rootId)).toContain(draft.rootId);
    });
  });

  describe("remove", () => {
    it("deletes every version of the root and its SEO", async () => {
      const created = await createCategory();
      await caller.publish({ id: created.id, rootId: created.rootId! });
      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Second version",
      });

      await caller.remove({ id: created.id });

      const rows = await db.productCategory.findMany({
        where: { rootId: created.rootId! },
      });
      const seo = await db.seo.findUnique({ where: { id: created.seoId! } });
      expect(rows).toHaveLength(0);
      expect(seo).toBeNull();
      rootIds.length = 0;
    });

    it("throws NOT_FOUND for an unknown category", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("permissions", () => {
    it("maps publish and read to their dedicated permission", () => {
      expect(
        getPermissionAlternatives(PERMISSIONS.PRODUCT_CATEGORIES_READ),
      ).toEqual([PERMISSIONS.PRODUCT_CATEGORIES_READ]);
      expect(
        getPermissionAlternatives(PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH),
      ).toEqual([PERMISSIONS.PRODUCT_CATEGORIES_PUBLISH]);
      expect(
        getPermissionAlternatives(PERMISSIONS.PRODUCT_CATEGORIES_UPDATE),
      ).toEqual([
        PERMISSIONS.PRODUCT_CATEGORIES_UPDATE,
        "product-categories.manage",
      ]);
    });
  });
});
