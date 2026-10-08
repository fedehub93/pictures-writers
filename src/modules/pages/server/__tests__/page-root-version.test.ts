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
    const pages = await db.page.findMany({
      where: { rootId: { in: rootIds } },
      select: { seoId: true },
    });
    const seoIds = [
      ...new Set(pages.map((page) => page.seoId).filter(Boolean)),
    ] as string[];

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

describe("pagesRouter create dual-write", () => {
  it("inserts a legacy Page plus a PageRoot and a version 1 draft", async () => {
    const created = await caller.create({
      title: "Home",
      slug: `home-${randomUUID()}`,
    });
    rootIds.push(created.id);

    const legacy = await db.page.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(legacy.rootId).toBe(created.id);

    const root = await db.pageRoot.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(root.slug).toBe(created.slug);
    expect(root.liveVersionId).toBeNull();
    expect(root.currentVersionId).toBeTruthy();

    const versions = await db.pageVersion.findMany({
      where: { rootId: root.id },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(root.currentVersionId);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
    expect(versions[0]!.title).toBe("Home");
    expect(versions[0]!.seoId).toBe(legacy.seoId);
  });
});

describe("backfillPageRootVersion", () => {
  async function createLegacyGroup() {
    const slug = `legacy-${randomUUID()}`;
    const firstPublishedAt = new Date("2024-01-01T00:00:00.000Z");

    const created = await db.page.create({
      data: {
        title: "Legacy published",
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
        title: "Legacy changed",
        slug,
        version: 2,
        status: ContentStatus.CHANGED,
        isLatest: false,
        firstPublishedAt,
        rootId: published.id,
      },
    });

    return { published, changed };
  }

  it("reconstructs one root and every version, pointing at the live and current versions", async () => {
    const { published, changed } = await createLegacyGroup();

    const result = await backfillPageRootVersion();

    expect(result.rootsProcessed).toBe(1);
    expect(result.versionsProcessed).toBe(2);

    const root = await db.pageRoot.findUniqueOrThrow({
      where: { id: published.rootId! },
    });
    expect(root.currentVersionId).toBe(changed.id);
    expect(root.liveVersionId).toBe(published.id);
    expect(root.firstPublishedAt?.toISOString()).toBe(
      published.firstPublishedAt.toISOString(),
    );

    const versions = await db.pageVersion.findMany({
      where: { rootId: root.id },
      orderBy: { version: "asc" },
    });
    expect(versions.map((version) => version.id)).toEqual([
      published.id,
      changed.id,
    ]);
    expect(versions[0]!.status).toBe(ContentStatus.PUBLISHED);
    expect(versions[1]!.status).toBe(ContentStatus.CHANGED);
  });

  it("leaves a never-published root without a live version or first publication date", async () => {
    const draft = await db.page.create({
      data: {
        title: "Draft only",
        slug: `draft-${randomUUID()}`,
        version: 1,
        status: ContentStatus.DRAFT,
        isLatest: true,
      },
    });
    await db.page.update({
      where: { id: draft.id },
      data: { rootId: draft.id },
    });
    rootIds.push(draft.id);

    await backfillPageRootVersion();

    const root = await db.pageRoot.findUniqueOrThrow({
      where: { id: draft.id },
    });
    expect(root.liveVersionId).toBeNull();
    expect(root.firstPublishedAt).toBeNull();
    expect(root.currentVersionId).toBe(draft.id);
  });

  it("is non-destructive: a second run does not rewrite work done on the new model", async () => {
    const { published, changed } = await createLegacyGroup();

    await backfillPageRootVersion();
    await db.pageRoot.update({
      where: { id: published.rootId! },
      data: { slug: "edited-slug" },
    });
    await db.pageVersion.update({
      where: { id: changed.id },
      data: { title: "Edited after backfill" },
    });

    const second = await backfillPageRootVersion();
    expect(second.versionsProcessed).toBe(2);

    const roots = await db.pageRoot.findMany({
      where: { id: published.rootId! },
    });
    expect(roots).toHaveLength(1);
    expect(roots[0]!.slug).toBe("edited-slug");

    const version = await db.pageVersion.findUniqueOrThrow({
      where: { id: changed.id },
    });
    expect(version.title).toBe("Edited after backfill");

    const versions = await db.pageVersion.findMany({
      where: { rootId: published.rootId! },
    });
    expect(versions).toHaveLength(2);
  });
});
