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

import {
  ContentStatus,
  ProductAcquisitionMode,
  ProductType,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { EbookType } from "@/modules/shop/products/types";
import {
  PERMISSIONS,
  getPermissionAlternatives,
  getProcedurePermission,
} from "@/shared/lib/permissions";

import { productsRouter } from "../server/procedures";

const createCaller = createCallerFactory(productsRouter);

const rootIds: string[] = [];
const mediaIds: string[] = [];
const userIds: string[] = [];
const categoryIds: string[] = [];
let caller: ReturnType<typeof createCaller>;
let userId: string;

async function createMedia() {
  const media = await db.media.create({
    data: {
      name: `media-${randomUUID()}`,
      url: `https://example.com/${randomUUID()}.png`,
    },
  });
  mediaIds.push(media.id);
  return media;
}

async function createCategory() {
  const category = await db.productCategory.create({
    data: {
      title: `Category ${randomUUID()}`,
      slug: `category-${randomUUID()}`,
    },
  });
  categoryIds.push(category.id);
  return category;
}

async function createProduct(overrides: Record<string, unknown> = {}) {
  const product = await caller.create({
    title: `Product ${randomUUID()}`,
    slug: `product-${randomUUID()}`,
    type: ProductType.SERVICE,
    ...overrides,
  });

  if (product.rootId) {
    rootIds.push(product.rootId);
  }

  return product;
}

beforeEach(async () => {
  rootIds.length = 0;
  mediaIds.length = 0;
  userIds.length = 0;
  categoryIds.length = 0;

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  userId = user.id;
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (rootIds.length > 0) {
    const versions = await db.productVersion.findMany({
      where: { rootId: { in: rootIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(versions.map((version) => version.seoId).filter(Boolean)),
    ] as string[];

    await db.productRoot.deleteMany({ where: { id: { in: rootIds } } });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  if (mediaIds.length > 0) {
    await db.media.deleteMany({ where: { id: { in: mediaIds } } });
  }
  if (categoryIds.length > 0) {
    await db.productCategory.deleteMany({ where: { id: { in: categoryIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  rootIds.length = 0;
  mediaIds.length = 0;
  userIds.length = 0;
  categoryIds.length = 0;
});

describe("productsRouter", () => {
  describe("create", () => {
    it("creates a draft root + version 1 with its own SEO and default metadata", async () => {
      const created = await createProduct({
        title: "Screenplay 101",
        slug: "screenplay-101",
        type: ProductType.EBOOK,
      });

      expect(created.id).toBeTruthy();
      expect(created.title).toBe("Screenplay 101");
      expect(created.slug).toBe("screenplay-101");
      expect(created.type).toBe(ProductType.EBOOK);
      expect(created.version).toBe(1);
      expect(created.status).toBe(ContentStatus.DRAFT);
      expect(created.seoId).toBeTruthy();
      expect(created.seo?.title).toBe("Screenplay 101");
      expect(created.userId).toBe(userId);
      expect(created.metadata).toMatchObject({ type: ProductType.EBOOK });

      const root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId },
      });
      expect(root.slug).toBe("screenplay-101");
      expect(root.type).toBe(ProductType.EBOOK);
      expect(root.currentVersionId).toBe(created.id);
      expect(root.liveVersionId).toBeNull();

      const versions = await db.productVersion.findMany({
        where: { rootId: created.rootId },
      });
      expect(versions).toHaveLength(1);
      expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
    });

    it("rejects an unknown product type", async () => {
      await expect(
        caller.create({
          title: "Nope",
          slug: "nope",
          type: "BOGUS" as never,
        }),
      ).rejects.toThrow();
    });
  });

  describe("update versioning", () => {
    it("updates a draft in place without creating a new version", async () => {
      const created = await createProduct();

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Updated title",
        price: 42,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.version).toBe(1);
      expect(updated.status).toBe(ContentStatus.DRAFT);
      expect(updated.title).toBe("Updated title");
      expect(updated.price).toBe(42);

      const rows = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
      });
      expect(rows).toHaveLength(1);
    });

    it("creates a new CHANGED version when the current version is live", async () => {
      const created = await createProduct();
      const published = await caller.publish({
        id: created.id,
        rootId: created.rootId!,
      });

      const updated = await caller.update({
        id: published.id,
        rootId: published.rootId,
        title: "Next edition",
      });

      expect(updated.id).not.toBe(created.id);
      expect(updated.version).toBe(2);
      expect(updated.status).toBe(ContentStatus.CHANGED);
      expect(updated.title).toBe("Next edition");

      const rows = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
        orderBy: { version: "asc" },
      });
      expect(rows).toHaveLength(2);
      expect(rows[0]!.status).toBe(ContentStatus.PUBLISHED);
      expect(rows[1]!.status).toBe(ContentStatus.CHANGED);

      const root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      expect(root.liveVersionId).toBe(created.id);
      expect(root.currentVersionId).toBe(updated.id);
    });

    it("clones the SEO of the live version when forking", async () => {
      const created = await createProduct();
      await caller.publish({ id: created.id, rootId: created.rootId! });

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Next edition",
      });

      expect(updated.seoId).toBeTruthy();
      expect(updated.seoId).not.toBe(created.seoId);

      const original = await db.productVersion.findUniqueOrThrow({
        where: { id: created.id },
      });
      expect(original.seoId).toBe(created.seoId);

      const clonedSeo = await db.seo.findUniqueOrThrow({
        where: { id: updated.seoId! },
      });
      expect(clonedSeo.title).toBe(created.title);
    });

    it("carries gallery, extras, FAQs and category over to the new version", async () => {
      const created = await createProduct();
      const media = await createMedia();
      const category = await createCategory();

      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        categoryId: category.id,
        gallery: [{ mediaId: media.id, sort: 0 }],
        extras: [{ name: "Bonus", description: "Extra", price: 5 }],
        faqs: [{ question: "Is it good?", answer: "Yes", sort: 0 }],
      });
      await caller.publish({ id: created.id, rootId: created.rootId! });

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Second edition",
      });

      const newVersion = await db.productVersion.findUniqueOrThrow({
        where: { id: updated.id },
        include: { gallery: true, extras: true, faqs: true },
      });

      expect(newVersion.categoryId).toBe(category.id);
      expect(newVersion.gallery).toHaveLength(1);
      expect(newVersion.gallery[0]!.mediaId).toBe(media.id);
      expect(newVersion.extras).toHaveLength(1);
      expect(newVersion.extras[0]!.name).toBe("Bonus");
      expect(newVersion.faqs).toHaveLength(1);
      expect(newVersion.faqs[0]!.question).toBe("Is it good?");
    });

    it("replaces gallery, extras and FAQs in place only when supplied", async () => {
      const created = await createProduct();
      const media = await createMedia();

      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        gallery: [{ mediaId: media.id, sort: 0 }],
        extras: [{ name: "First", price: 1 }],
        faqs: [{ question: "Q1", answer: "A1", sort: 0 }],
      });

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Only title",
      });

      const loaded = await db.productVersion.findUniqueOrThrow({
        where: { id: updated.id },
        include: { gallery: true, extras: true, faqs: true },
      });

      expect(loaded.title).toBe("Only title");
      expect(loaded.gallery).toHaveLength(1);
      expect(loaded.extras).toHaveLength(1);
      expect(loaded.faqs).toHaveLength(1);

      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        gallery: [],
        faqs: [],
      });

      const cleared = await db.productVersion.findUniqueOrThrow({
        where: { id: updated.id },
        include: { gallery: true, extras: true, faqs: true },
      });

      expect(cleared.gallery).toHaveLength(0);
      expect(cleared.faqs).toHaveLength(0);
      expect(cleared.extras).toHaveLength(1);
    });

    it("persists core fields, category and gallery together in a single update", async () => {
      const created = await createProduct();
      const media = await createMedia();
      const category = await createCategory();

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Atomic title",
        slug: "atomic-title",
        categoryId: category.id,
        acquisitionMode: ProductAcquisitionMode.FREE,
        price: 12,
        isFree: false,
        gallery: [{ mediaId: media.id, sort: 1 }],
        faqs: [{ question: "Atomic question?", answer: "Atomic answer", sort: 1 }],
      });

      const loaded = await db.productVersion.findUniqueOrThrow({
        where: { id: updated.id },
        include: { gallery: true, faqs: true },
      });

      expect(loaded.title).toBe("Atomic title");
      expect(loaded.categoryId).toBe(category.id);
      expect(loaded.acquisitionMode).toBe(ProductAcquisitionMode.FREE);
      expect(loaded.price).toBe(12);
      expect(loaded.gallery).toHaveLength(1);
      expect(loaded.gallery[0]!.mediaId).toBe(media.id);
      expect(loaded.faqs).toHaveLength(1);

      const root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      expect(root.slug).toBe("atomic-title");
    });

    it("does not dereference missing inputs when forking a version", async () => {
      const created = await createProduct();
      await caller.publish({ id: created.id, rootId: created.rootId! });

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
      });

      expect(updated.status).toBe(ContentStatus.CHANGED);
      expect(updated.slug).toBe(created.slug);
      expect(updated.metadata).toMatchObject({ type: ProductType.SERVICE });
    });

    it("ignores fields outside the contract", async () => {
      const created = await createProduct();

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        status: ContentStatus.PUBLISHED,
        seoId: randomUUID(),
        userId: randomUUID(),
        version: 99,
      } as never);

      expect(updated.status).toBe(ContentStatus.DRAFT);
      expect(updated.seoId).toBe(created.seoId);
      expect(updated.userId).toBe(created.userId);
      expect(updated.version).toBe(1);
    });

    it("rejects metadata whose type differs from the root type", async () => {
      const created = await createProduct({ type: ProductType.EBOOK });

      await expect(
        caller.update({
          id: created.id,
          rootId: created.rootId!,
          metadata: {
            type: ProductType.SERVICE,
            serviceType: "Editing",
            competitorPrice: 0,
            target: "",
            attachamentUrl: "",
            features: [],
          },
        } as never),
      ).rejects.toThrow();
    });

    it("rejects metadata that does not match the product type shape", async () => {
      const created = await createProduct({ type: ProductType.EBOOK });

      await expect(
        caller.update({
          id: created.id,
          rootId: created.rootId!,
          metadata: { type: ProductType.EBOOK, url: "https://example.com" },
        } as never),
      ).rejects.toThrow();
    });

    it("accepts metadata that matches the product type", async () => {
      const created = await createProduct({ type: ProductType.EBOOK });

      const updated = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        metadata: {
          type: ProductType.EBOOK,
          edition: "First",
          formats: [{ type: EbookType.PDF, url: "", size: 0, pages: 0 }],
          publishedAt: null,
          author: null,
        },
      });

      expect(updated.metadata).toMatchObject({
        type: ProductType.EBOOK,
        edition: "First",
      });
    });

    it("accepts metadata for every product type", async () => {
      const cases: { type: ProductType; metadata: unknown }[] = [
        {
          type: ProductType.AFFILIATE,
          metadata: { type: ProductType.AFFILIATE, url: "https://example.com" },
        },
        {
          type: ProductType.SERVICE,
          metadata: {
            type: ProductType.SERVICE,
            serviceType: "Editing",
            competitorPrice: 10,
            target: "Writers",
            attachamentUrl: "",
            features: [],
          },
        },
        {
          type: ProductType.WEBINAR,
          metadata: {
            type: ProductType.WEBINAR,
            seats: 5,
            platform: "Zoom",
            lessons: [],
            isOpen: true,
          },
        },
      ];

      for (const { type, metadata } of cases) {
        const created = await createProduct({ type });
        const updated = await caller.update({
          id: created.id,
          rootId: created.rootId!,
          metadata: metadata as never,
        });

        expect(updated.metadata).toMatchObject({ type });
      }
    });

    it.each([
      [
        ProductType.EBOOK,
        { type: ProductType.EBOOK, edition: "First" },
      ],
      [ProductType.AFFILIATE, { type: ProductType.AFFILIATE, url: 123 }],
      [
        ProductType.SERVICE,
        { type: ProductType.SERVICE, serviceType: "Editing" },
      ],
      [
        ProductType.WEBINAR,
        {
          type: ProductType.WEBINAR,
          seats: "many",
          platform: "Zoom",
          lessons: [],
          isOpen: true,
        },
      ],
    ])(
      "rejects malformed %s metadata at the procedure boundary",
      async (type, metadata) => {
        const created = await createProduct({ type });

        await expect(
          caller.update({
            id: created.id,
            rootId: created.rootId!,
            metadata,
          } as never),
        ).rejects.toThrow();
      },
    );

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
    it("updates the SEO of a draft in place without forking", async () => {
      const created = await createProduct();

      const seo = await caller.updateSeo({
        id: created.id,
        rootId: created.rootId!,
        title: "SEO title",
        description: "SEO description",
        noIndex: true,
        noFollow: false,
      });

      expect(seo.id).toBe(created.seoId);
      expect(seo.title).toBe("SEO title");
      expect(seo.description).toBe("SEO description");
      expect(seo.noIndex).toBe(true);

      const rows = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
      });
      expect(rows).toHaveLength(1);
    });

    it("forks a new CHANGED version with a cloned SEO when the current version is live", async () => {
      const created = await createProduct();
      await caller.publish({ id: created.id, rootId: created.rootId! });

      const seo = await caller.updateSeo({
        id: created.id,
        rootId: created.rootId!,
        title: "New SEO",
        noIndex: false,
        noFollow: false,
      });

      expect(seo.id).not.toBe(created.seoId);

      const rows = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
        orderBy: { version: "asc" },
      });
      expect(rows).toHaveLength(2);
      expect(rows[0]!.status).toBe(ContentStatus.PUBLISHED);
      expect(rows[0]!.seoId).toBe(created.seoId);
      expect(rows[1]!.status).toBe(ContentStatus.CHANGED);
      expect(rows[1]!.seoId).toBe(seo.id);

      const root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      expect(root.liveVersionId).toBe(created.id);
      expect(root.currentVersionId).toBe(rows[1]!.id);
    });

    it("throws NOT_FOUND for an unknown product", async () => {
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
    it("promotes the target, demotes the previous live version and writes firstPublishedAt once", async () => {
      const created = await createProduct();

      const published = await caller.publish({
        id: created.id,
        rootId: created.rootId!,
      });

      expect(published.status).toBe(ContentStatus.PUBLISHED);
      expect(published.publishedAt).not.toBeNull();

      let root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      const firstPublishedAt = root.firstPublishedAt;
      expect(root.liveVersionId).toBe(created.id);
      expect(firstPublishedAt).not.toBeNull();

      const forked = await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Second edition",
      });

      const republished = await caller.publish({
        id: forked.id,
        rootId: created.rootId!,
      });

      expect(republished.status).toBe(ContentStatus.PUBLISHED);

      const versions = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
      });
      const live = versions.filter(
        (version) => version.status === ContentStatus.PUBLISHED,
      );
      expect(live).toHaveLength(1);
      expect(live[0]!.id).toBe(forked.id);

      root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      expect(root.liveVersionId).toBe(forked.id);
      expect(root.firstPublishedAt?.toISOString()).toBe(
        firstPublishedAt!.toISOString(),
      );
    });

    it("leaves a consistent root when two publishes race", async () => {
      const created = await createProduct();

      await Promise.all([
        caller.publish({ id: created.id, rootId: created.rootId! }),
        caller.publish({ id: created.id, rootId: created.rootId! }),
      ]);

      const versions = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
      });
      const live = versions.filter(
        (version) => version.status === ContentStatus.PUBLISHED,
      );
      expect(live).toHaveLength(1);

      const root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      expect(root.liveVersionId).toBe(created.id);
    });

    it("unpublishes a version back to CHANGED and clears the live pointer", async () => {
      const created = await createProduct();
      await caller.publish({ id: created.id, rootId: created.rootId! });

      const unpublished = await caller.unpublish({ id: created.id });

      expect(unpublished.status).toBe(ContentStatus.CHANGED);

      const root = await db.productRoot.findUniqueOrThrow({
        where: { id: created.rootId! },
      });
      expect(root.liveVersionId).toBeNull();

      const version = await db.productVersion.findUniqueOrThrow({
        where: { id: created.id },
      });
      expect(version.status).toBe(ContentStatus.CHANGED);
    });

    it("throws NOT_FOUND when publishing an unknown product", async () => {
      await expect(
        caller.publish({ id: randomUUID(), rootId: randomUUID() }),
      ).rejects.toThrow();
    });

    it("throws NOT_FOUND when unpublishing an unknown product", async () => {
      await expect(caller.unpublish({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getOne", () => {
    it("returns the current version with its SEO", async () => {
      const created = await createProduct();

      const loaded = await caller.getOne({ id: created.rootId! });

      expect(loaded.id).toBe(created.id);
      expect(loaded.rootId).toBe(created.rootId);
      expect(loaded.seoId).toBe(created.seoId);
      expect(loaded.type).toBe(ProductType.SERVICE);
    });

    it("throws NOT_FOUND for an unknown product", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getLastByRootId", () => {
    it("returns the current version of the root", async () => {
      const created = await createProduct();
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

  describe("getPublishedByRootId", () => {
    it("returns the live version even when a draft is ahead", async () => {
      const created = await createProduct();
      const published = await caller.publish({
        id: created.id,
        rootId: created.rootId!,
      });
      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Draft ahead",
      });

      const loaded = await caller.getPublishedByRootId({
        rootId: created.rootId!,
      });

      expect(loaded?.id).toBe(published.id);
      expect(loaded?.title).toBe(created.title);
    });

    it("returns null for a root with no published version", async () => {
      const created = await createProduct();

      const loaded = await caller.getPublishedByRootId({
        rootId: created.rootId!,
      });

      expect(loaded).toBeNull();
    });
  });

  describe("getMany", () => {
    it("returns one row per root showing the current version", async () => {
      const created = await createProduct({
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
      expect(result.items[0]!.id).toBe(created.id);
    });

    it("shows the most recent version after a fork", async () => {
      const created = await createProduct({
        title: "Multi version marker",
        slug: `multi-${randomUUID()}`,
      });
      await caller.publish({ id: created.id, rootId: created.rootId! });
      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Multi version marker v2",
      });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: "Multi version marker",
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.title).toBe("Multi version marker v2");
      expect(result.items[0]!.status).toBe(ContentStatus.CHANGED);
    });

    it("lists the live version when publishedOnly is set", async () => {
      const created = await createProduct({
        title: "Picker live marker",
        slug: `picker-live-${randomUUID()}`,
      });
      const draft = await createProduct({
        title: "Picker live marker draft",
        slug: `picker-draft-${randomUUID()}`,
      });
      await caller.publish({ id: created.id, rootId: created.rootId! });
      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Picker live marker v2",
      });

      const live = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: "Picker live marker",
        publishedOnly: true,
      });

      expect(live.items.map((item) => item.rootId)).toEqual([created.rootId]);
      expect(live.items[0]!.id).toBe(created.id);
      expect(live.items[0]!.title).toBe("Picker live marker");
      expect(live.items[0]!.status).toBe(ContentStatus.PUBLISHED);
      expect(live.items.map((item) => item.rootId)).not.toContain(draft.rootId);
    });

    it("sorts live versions when publishedOnly is combined with an explicit sort", async () => {
      const marker = `Picker sort ${randomUUID()}`;
      const alpha = await createProduct({ title: `${marker} Alpha` });
      const beta = await createProduct({ title: `${marker} Beta` });
      await caller.publish({ id: alpha.id, rootId: alpha.rootId! });
      await caller.publish({ id: beta.id, rootId: beta.rootId! });
      await caller.update({
        id: alpha.id,
        rootId: alpha.rootId!,
        title: `${marker} Alpha v2`,
      });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        publishedOnly: true,
        sort: "title",
        direction: "asc",
      });

      expect(result.items.map((item) => item.rootId)).toEqual([
        alpha.rootId,
        beta.rootId,
      ]);
      expect(result.items.map((item) => item.title)).toEqual([
        `${marker} Alpha`,
        `${marker} Beta`,
      ]);
    });

    it("orders unpublished work first by default", async () => {
      const marker = `Default order ${randomUUID()}`;

      const published = await createProduct({ title: `${marker} Published` });
      await caller.publish({ id: published.id, rootId: published.rootId! });

      const changed = await createProduct({ title: `${marker} Changed` });
      await caller.publish({ id: changed.id, rootId: changed.rootId! });
      await caller.update({
        id: changed.id,
        rootId: changed.rootId!,
        title: `${marker} Changed v2`,
      });

      const draft = await createProduct({ title: `${marker} Draft` });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.items.map((item) => item.rootId)).toEqual([
        draft.rootId,
        changed.rootId,
        published.rootId,
      ]);
    });

    it("sorts by the requested column and direction across all roots", async () => {
      const marker = `Sort marker ${randomUUID()}`;
      const alpha = await createProduct({ title: `${marker} Alpha` });
      const beta = await createProduct({ title: `${marker} Beta` });

      const ascending = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        sort: "title",
        direction: "asc",
      });
      const descending = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        sort: "title",
        direction: "desc",
      });

      expect(ascending.items.map((item) => item.rootId)).toEqual([
        alpha.rootId,
        beta.rootId,
      ]);
      expect(descending.items.map((item) => item.rootId)).toEqual([
        beta.rootId,
        alpha.rootId,
      ]);
    });

    it("filters by status and type", async () => {
      const published = await createProduct({
        title: "Live service",
        slug: `live-${randomUUID()}`,
        type: ProductType.SERVICE,
      });
      const draft = await createProduct({
        title: "Draft ebook",
        slug: `draft-${randomUUID()}`,
        type: ProductType.EBOOK,
      });
      await caller.publish({ id: published.id, rootId: published.rootId! });

      const live = await caller.getMany({
        page: 1,
        pageSize: 50,
        type: ProductType.SERVICE,
        status: ContentStatus.PUBLISHED,
      });
      const ebooks = await caller.getMany({
        page: 1,
        pageSize: 50,
        type: ProductType.EBOOK,
      });

      expect(live.items.map((item) => item.rootId)).toContain(published.rootId);
      expect(live.items.map((item) => item.rootId)).not.toContain(draft.rootId);
      expect(ebooks.items.map((item) => item.rootId)).toContain(draft.rootId);
      expect(ebooks.items.map((item) => item.rootId)).not.toContain(
        published.rootId,
      );
    });

    it("filters by category", async () => {
      const category = await createCategory();

      const created = await createProduct();
      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        categoryId: category.id,
      });

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        category: category.id,
      });

      expect(result.items.map((item) => item.rootId)).toContain(created.rootId);
    });
  });

  describe("getByRootIds", () => {
    it("returns only the live version for the given roots", async () => {
      const published = await createProduct({ title: "Published" });
      const draft = await createProduct({ title: "Draft" });
      await caller.publish({ id: published.id, rootId: published.rootId! });

      const result = await caller.getByRootIds({
        ids: [published.rootId!, draft.rootId!],
      });

      expect(result.map((product) => product.rootId)).toEqual([
        published.rootId,
      ]);
    });
  });

  describe("remove", () => {
    it("deletes the root, its versions, editorial relations and SEO", async () => {
      const created = await createProduct();
      const media = await createMedia();

      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        gallery: [{ mediaId: media.id, sort: 0 }],
        faqs: [{ question: "Q", answer: "A", sort: 0 }],
      });
      await caller.publish({ id: created.id, rootId: created.rootId! });
      await caller.update({
        id: created.id,
        rootId: created.rootId!,
        title: "Second version",
      });

      await caller.remove({ id: created.id });

      const root = await db.productRoot.findUnique({
        where: { id: created.rootId! },
      });
      const versions = await db.productVersion.findMany({
        where: { rootId: created.rootId! },
      });
      const galleries = await db.productGallery.findMany({
        where: { productId: created.id },
      });
      const seo = await db.seo.findUnique({ where: { id: created.seoId! } });

      expect(root).toBeNull();
      expect(versions).toHaveLength(0);
      expect(galleries).toHaveLength(0);
      expect(seo).toBeNull();

      rootIds.length = 0;
    });

    it("deletes a root addressed by its root id", async () => {
      const created = await createProduct();

      await caller.remove({ id: created.rootId! });

      const root = await db.productRoot.findUnique({
        where: { id: created.rootId! },
      });
      expect(root).toBeNull();

      rootIds.length = 0;
    });

    it("throws NOT_FOUND for an unknown product", async () => {
      await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("permissions", () => {
    it("maps the products procedures to their dedicated permissions", () => {
      expect(getPermissionAlternatives(PERMISSIONS.PRODUCTS_READ)).toEqual([
        PERMISSIONS.PRODUCTS_READ,
      ]);
      expect(getPermissionAlternatives(PERMISSIONS.PRODUCTS_PUBLISH)).toEqual([
        PERMISSIONS.PRODUCTS_PUBLISH,
      ]);
      expect(getPermissionAlternatives(PERMISSIONS.PRODUCTS_UPDATE)).toEqual([
        PERMISSIONS.PRODUCTS_UPDATE,
        "products.manage",
      ]);
    });

    it("maps each procedure path to its dedicated permission", () => {
      expect(getProcedurePermission("products.create")).toBe(
        PERMISSIONS.PRODUCTS_CREATE,
      );
      expect(getProcedurePermission("products.update")).toBe(
        PERMISSIONS.PRODUCTS_UPDATE,
      );
      expect(getProcedurePermission("products.updateSeo")).toBe(
        PERMISSIONS.PRODUCTS_UPDATE,
      );
      expect(getProcedurePermission("products.remove")).toBe(
        PERMISSIONS.PRODUCTS_DELETE,
      );
      expect(getProcedurePermission("products.publish")).toBe(
        PERMISSIONS.PRODUCTS_PUBLISH,
      );
      expect(getProcedurePermission("products.unpublish")).toBe(
        PERMISSIONS.PRODUCTS_PUBLISH,
      );
      expect(getProcedurePermission("products.getMany")).toBe(
        PERMISSIONS.PRODUCTS_READ,
      );
      expect(getProcedurePermission("products.getPublishedByRootId")).toBe(
        PERMISSIONS.PRODUCTS_READ,
      );
      expect(getProcedurePermission("products.getByRootIds")).toBe(
        PERMISSIONS.PRODUCTS_READ,
      );
    });
  });
});
