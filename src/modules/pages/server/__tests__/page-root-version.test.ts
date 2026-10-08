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

import { INITIAL_PUCK_DATA } from "../../constants";
import { pagesRouter } from "../procedures";
import { getPublishedPageBySlug } from "../queries";

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

/**
 * Reconstruct the shape the cut-over migration backfills from a legacy page:
 * a live (published) version 1 plus a CHANGED version 2 that is the root's
 * current version. Mirrors `20261008130000_drop_legacy_page`.
 */
async function seedBackfilledPage(marker: string = randomUUID()) {
  const slug = `backfilled-${marker}`;
  const publishedAt = new Date("2024-01-01T00:00:00.000Z");

  const root = await db.pageRoot.create({
    data: { slug, firstPublishedAt: publishedAt },
  });
  rootIds.push(root.id);

  const liveSeo = await db.seo.create({
    data: { title: `${marker} live`, version: 1, description: "" },
  });
  const live = await db.pageVersion.create({
    data: {
      rootId: root.id,
      version: 1,
      status: ContentStatus.PUBLISHED,
      title: `${marker} live`,
      puckData: INITIAL_PUCK_DATA,
      publishedAt,
      seoId: liveSeo.id,
    },
  });

  const currentSeo = await db.seo.create({
    data: { title: `${marker} draft`, version: 1, description: "" },
  });
  const current = await db.pageVersion.create({
    data: {
      rootId: root.id,
      version: 2,
      status: ContentStatus.CHANGED,
      title: `${marker} draft`,
      puckData: INITIAL_PUCK_DATA,
      seoId: currentSeo.id,
    },
  });

  await db.pageRoot.update({
    where: { id: root.id },
    data: { currentVersionId: current.id, liveVersionId: live.id },
  });

  return { root, live, current, slug };
}

describe("pagesRouter create", () => {
  it("creates a root plus a version 1 draft with its own SEO", async () => {
    const created = await caller.create({
      title: "Home",
      slug: `home-${randomUUID()}`,
    });
    rootIds.push(created.rootId);

    const root = await db.pageRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.slug).toBe(created.slug);
    expect(root.liveVersionId).toBeNull();
    expect(root.currentVersionId).toBe(created.id);

    const versions = await db.pageVersion.findMany({
      where: { rootId: root.id },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
    expect(versions[0]!.title).toBe("Home");
    expect(versions[0]!.seoId).toBeTruthy();
  });
});

describe("pagesRouter getVersions (version history)", () => {
  it("returns the single draft after creation", async () => {
    const created = await caller.create({
      title: "History",
      slug: `history-${randomUUID()}`,
    });
    rootIds.push(created.rootId);

    const versions = await caller.getVersions({ rootId: created.rootId });

    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
  });

  it("keeps every revision, newest first, after publishing and editing", async () => {
    const created = await caller.create({
      title: "History",
      slug: `history-${randomUUID()}`,
    });
    rootIds.push(created.rootId);

    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Second revision",
    });

    const versions = await caller.getVersions({ rootId: created.rootId });

    expect(versions.map((version) => version.version)).toEqual([2, 1]);
    expect(versions[0]!.id).toBe(forked.id);
    expect(versions[0]!.status).toBe(ContentStatus.CHANGED);
    expect(versions[1]!.id).toBe(created.id);
    expect(versions[1]!.status).toBe(ContentStatus.PUBLISHED);
  });

  it("returns an empty list for an empty root", async () => {
    const versions = await caller.getVersions({ rootId: randomUUID() });
    expect(versions).toHaveLength(0);
  });
});

describe("pagesRouter migrated (backfilled) data", () => {
  it("lists the current version and serves the live one publicly", async () => {
    const marker = `Backfilled ${randomUUID()}`;
    const { root, live, current } = await seedBackfilledPage(marker);

    const result = await caller.getMany({
      page: 1,
      pageSize: 50,
      search: marker,
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(current.id);
    expect(result.items[0]!.rootId).toBe(root.id);
    expect(result.items[0]!.status).toBe(ContentStatus.CHANGED);

    const loaded = await caller.getOne({ id: current.id });
    expect(loaded.id).toBe(current.id);
    expect(loaded.slug).toBe(root.slug);

    const publicPage = await getPublishedPageBySlug(root.slug);
    expect(publicPage?.id).toBe(live.id);
    expect(publicPage?.slug).toBe(root.slug);
  });

  it("promotes the migrated current version to live without touching history", async () => {
    const { root, live, current } = await seedBackfilledPage();

    await caller.publish({ id: current.id, rootId: root.id });

    const updatedRoot = await db.pageRoot.findUniqueOrThrow({
      where: { id: root.id },
    });
    expect(updatedRoot.liveVersionId).toBe(current.id);
    expect(updatedRoot.firstPublishedAt).not.toBeNull();

    const previous = await db.pageVersion.findUniqueOrThrow({
      where: { id: live.id },
    });
    expect(previous.status).toBe(ContentStatus.CHANGED);

    const versions = await caller.getVersions({ rootId: root.id });
    expect(versions).toHaveLength(2);
  });
});
