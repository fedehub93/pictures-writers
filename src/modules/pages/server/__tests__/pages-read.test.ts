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

import { backfillPageRootVersion } from "../backfill";
import { getPublishedPageBySlug } from "../queries";
import { pagesRouter } from "../procedures";

const createCaller = createCallerFactory(pagesRouter);

const rootIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;

async function seedLegacyGroup(marker: string) {
  const slug = `legacy-${randomUUID()}`;
  const firstPublishedAt = new Date("2024-01-01T00:00:00.000Z");

  const created = await db.page.create({
    data: {
      title: `${marker} live`,
      slug,
      version: 1,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      firstPublishedAt,
      publishedAt: firstPublishedAt,
    },
  });
  const published = await db.page.update({
    where: { id: created.id },
    data: { rootId: created.id },
  });
  rootIds.push(published.id);

  const changed = await db.page.create({
    data: {
      title: `${marker} draft`,
      slug,
      version: 2,
      status: ContentStatus.CHANGED,
      isLatest: false,
      firstPublishedAt,
      rootId: published.id,
    },
  });

  return { published, changed, slug };
}

async function dropLegacyPages(rootId: string | string[]) {
  await db.page.deleteMany({
    where: { rootId: { in: Array.isArray(rootId) ? rootId : [rootId] } },
  });
}

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
    const legacy = await db.page.findMany({
      where: { rootId: { in: rootIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(
        [...versions, ...legacy]
          .map((row) => row.seoId)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    await db.pageRoot.deleteMany({ where: { id: { in: rootIds } } });
    await db.page.deleteMany({ where: { rootId: { in: rootIds } } });
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

describe("pagesRouter reads via Root + Version", () => {
  describe("getOne", () => {
    it("returns the current version with its inherited slug and SEO", async () => {
      const created = await caller.create({
        title: "About",
        slug: `about-${randomUUID()}`,
      });
      rootIds.push(created.id);
      await dropLegacyPages(created.id);

      const loaded = await caller.getOne({ id: created.id });

      expect(loaded.id).toBe(created.id);
      expect(loaded.rootId).toBe(created.id);
      expect(loaded.title).toBe("About");
      expect(loaded.slug).toBe(created.slug);
      expect(loaded.seo).toBeTruthy();
    });

    it("throws NOT_FOUND for an unknown page", async () => {
      await expect(caller.getOne({ id: randomUUID() })).rejects.toThrow();
    });
  });

  describe("getLastByRootId", () => {
    it("returns the current version of the root", async () => {
      const created = await caller.create({
        title: "Contact",
        slug: `contact-${randomUUID()}`,
      });
      rootIds.push(created.id);
      await dropLegacyPages(created.id);

      const loaded = await caller.getLastByRootId({ rootId: created.id });

      expect(loaded.id).toBe(created.id);
      expect(loaded.rootId).toBe(created.id);
      expect(loaded.slug).toBe(created.slug);
      expect(loaded.title).toBe("Contact");
      expect(loaded.status).toBe(ContentStatus.DRAFT);
      expect(loaded.puckData).toBeTruthy();
      expect(loaded.seo).toBeTruthy();
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
      const first = await caller.create({
        title: `${marker} One`,
        slug: `one-${randomUUID()}`,
      });
      const second = await caller.create({
        title: `${marker} Two`,
        slug: `two-${randomUUID()}`,
      });
      rootIds.push(first.id, second.id);
      await dropLegacyPages([first.id, second.id]);

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.total).toBe(2);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(2);
      expect(new Set(result.items.map((item) => item.rootId))).toEqual(
        new Set([first.id, second.id]),
      );
    });

    it("shows the current version of a multi-version root", async () => {
      const marker = `Multi ${randomUUID()}`;
      const { published, changed, slug } = await seedLegacyGroup(marker);
      await backfillPageRootVersion();
      await dropLegacyPages(published.rootId!);

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.id).toBe(changed.id);
      expect(result.items[0]!.rootId).toBe(published.id);
      expect(result.items[0]!.title).toBe(`${marker} draft`);
      expect(result.items[0]!.slug).toBe(slug);
      expect(result.items[0]!.status).toBe(ContentStatus.CHANGED);
    });

    it("orders unpublished pages before published ones", async () => {
      const marker = `Order ${randomUUID()}`;
      const slug = `live-${randomUUID()}`;
      const live = await db.page.create({
        data: {
          title: `${marker} live`,
          slug,
          version: 1,
          status: ContentStatus.PUBLISHED,
          isLatest: true,
        },
      });
      await db.page.update({
        where: { id: live.id },
        data: { rootId: live.id },
      });
      rootIds.push(live.id);
      await backfillPageRootVersion();
      await dropLegacyPages(live.id);

      const draft = await caller.create({
        title: `${marker} draft`,
        slug: `draft-${randomUUID()}`,
      });
      rootIds.push(draft.id);
      await dropLegacyPages(draft.id);

      const result = await caller.getMany({
        page: 1,
        pageSize: 50,
        search: marker,
      });

      expect(result.items.map((item) => item.rootId)).toEqual([
        draft.id,
        live.id,
      ]);
    });

    it("filters by the status of the current version", async () => {
      const marker = `Status ${randomUUID()}`;
      const created = await caller.create({
        title: `${marker} Draft`,
        slug: `status-${randomUUID()}`,
      });
      rootIds.push(created.id);
      await dropLegacyPages(created.id);

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
      expect(drafts.items[0]!.rootId).toBe(created.id);
      expect(published.total).toBe(0);
    });
  });

  describe("getPublishedPageBySlug", () => {
    it("resolves slug to the live version of the root", async () => {
      const marker = `Public ${randomUUID()}`;
      const { published, slug } = await seedLegacyGroup(marker);
      await backfillPageRootVersion();
      await dropLegacyPages(published.rootId!);

      const page = await getPublishedPageBySlug(slug);

      expect(page).not.toBeNull();
      expect(page!.id).toBe(published.id);
      expect(page!.rootId).toBe(published.id);
      expect(page!.title).toBe(`${marker} live`);
      expect(page!.slug).toBe(slug);
    });

    it("returns null for a root that was never published", async () => {
      const created = await caller.create({
        title: "Never live",
        slug: `never-${randomUUID()}`,
      });
      rootIds.push(created.id);
      await dropLegacyPages(created.id);

      const page = await getPublishedPageBySlug(created.slug);

      expect(page).toBeNull();
    });

    it("returns null for an unknown slug", async () => {
      const page = await getPublishedPageBySlug(`missing-${randomUUID()}`);
      expect(page).toBeNull();
    });
  });
});
