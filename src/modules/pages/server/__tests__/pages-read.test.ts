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

import { getPublishedPageBySlug } from "../queries";
import { pagesRouter } from "../procedures";

const createCaller = createCallerFactory(pagesRouter);

const rootIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;

beforeEach(async () => {
  rootIds.length = 0;
  userIds.length = 0;

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userIds.push(user.id);
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (rootIds.length > 0) {
    const versions = await db.pageVersion.findMany({
      where: { rootId: { in: rootIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(
        versions
          .map((version) => version.seoId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    await db.pageRoot.deleteMany({ where: { id: { in: rootIds } } });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  rootIds.length = 0;
  userIds.length = 0;
});

async function createPage(marker: string = randomUUID()) {
  const created = await caller.create({
    title: `Page ${marker}`,
    slug: `page-${marker}`,
  });
  rootIds.push(created.rootId);
  return created;
}

async function createMultiVersionPage(marker: string = randomUUID()) {
  const created = await createPage(marker);
  const live = await caller.publish({ id: created.id, rootId: created.rootId });
  const current = await caller.update({
    id: created.id,
    rootId: created.rootId,
    title: `${marker} revised`,
  });
  return { rootId: created.rootId, live, current, slug: created.slug };
}

describe("pagesRouter reads via Root + Version", () => {
  describe("getOne", () => {
    it("returns the current version with its inherited slug and SEO", async () => {
      const created = await createPage();

      const loaded = await caller.getOne({ id: created.id });

      expect(loaded.id).toBe(created.id);
      expect(loaded.rootId).toBe(created.rootId);
      expect(loaded.title).toBe(created.title);
      expect(loaded.slug).toBe(created.slug);
      expect(loaded.seo).toBeTruthy();
    });

    it("throws NOT_FOUND for an unknown page", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getLastByRootId", () => {
    it("returns the current version of the root", async () => {
      const created = await createPage();

      const loaded = await caller.getLastByRootId({ rootId: created.rootId });

      expect(loaded.id).toBe(created.id);
      expect(loaded.rootId).toBe(created.rootId);
      expect(loaded.slug).toBe(created.slug);
      expect(loaded.status).toBe(ContentStatus.DRAFT);
      expect(loaded.puckData).toBeTruthy();
      expect(loaded.seo).toBeTruthy();
    });

    it("returns the forked version when the current differs from the live one", async () => {
      const { rootId, current } = await createMultiVersionPage();

      const loaded = await caller.getLastByRootId({ rootId });

      expect(loaded.id).toBe(current.id);
    });

    it("throws NOT_FOUND for an unknown root", async () => {
      await expect(
        caller.getLastByRootId({ rootId: randomUUID() }),
      ).rejects.toThrow();
    });
  });

  describe("getMany", () => {
    it("returns one row per logical page", async () => {
      const marker = `Marker ${randomUUID()}`;
      const first = await createPage(`${marker} One`);
      const second = await createPage(`${marker} Two`);

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(new Set(result.items.map((item) => item.rootId))).toEqual(
        new Set([first.rootId, second.rootId]),
      );
    });

    it("shows the current version of a multi-version root", async () => {
      const marker = `Multi ${randomUUID()}`;
      const { rootId, current, slug } = await createMultiVersionPage(marker);

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.id).toBe(current.id);
      expect(result.items[0]!.rootId).toBe(rootId);
      expect(result.items[0]!.title).toBe(`${marker} revised`);
      expect(result.items[0]!.slug).toBe(slug);
      expect(result.items[0]!.status).toBe(ContentStatus.CHANGED);
    });

    it("orders unpublished pages before published ones", async () => {
      const marker = `Order ${randomUUID()}`;
      const live = await createPage(`${marker} live`);
      await caller.publish({ id: live.id, rootId: live.rootId });
      const draft = await createPage(`${marker} draft`);

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.items.map((item) => item.rootId)).toEqual([
        draft.rootId,
        live.rootId,
      ]);
    });

    it("filters by the status of the current version", async () => {
      const marker = `Status ${randomUUID()}`;
      const created = await createPage(marker);

      const drafts = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        status: ContentStatus.DRAFT,
      });
      const published = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
        status: ContentStatus.PUBLISHED,
      });

      expect(drafts.total).toBe(1);
      expect(drafts.items[0]!.rootId).toBe(created.rootId);
      expect(published.total).toBe(0);
    });
  });

  describe("getPublishedPageBySlug", () => {
    it("resolves slug to the live version of the root", async () => {
      const marker = `Public ${randomUUID()}`;
      const { live, slug } = await createMultiVersionPage(marker);

      const page = await getPublishedPageBySlug(slug);

      expect(page).not.toBeNull();
      expect(page!.id).toBe(live.id);
      expect(page!.rootId).toBe(live.rootId);
      expect(page!.title).toBe(`Page ${marker}`);
      expect(page!.slug).toBe(slug);
    });

    it("returns null for a root that was never published", async () => {
      const created = await createPage();

      const page = await getPublishedPageBySlug(created.slug);

      expect(page).toBeNull();
    });

    it("returns null for an unknown slug", async () => {
      const page = await getPublishedPageBySlug(`missing-${randomUUID()}`);
      expect(page).toBeNull();
    });
  });
});
