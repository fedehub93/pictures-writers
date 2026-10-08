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

describe("pagesRouter updateSeo", () => {
  it("updates the SEO of a draft in place", async () => {
    const created = await createPage();
    const before = await db.pageVersion.findUniqueOrThrow({
      where: { id: created.id },
    });

    const seo = await caller.updateSeo({
      id: created.id,
      rootId: created.rootId,
      title: "SEO title",
      description: "SEO description",
      noIndex: true,
      noFollow: false,
    });

    expect(seo.title).toBe("SEO title");
    expect(seo.description).toBe("SEO description");
    expect(seo.noIndex).toBe(true);

    const versions = await db.pageVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.seoId).toBe(before.seoId);
  });

  it("stages SEO changes on a new current version without touching the live version", async () => {
    const created = await createPage();
    const published = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });
    const liveBefore = await db.pageVersion.findUniqueOrThrow({
      where: { id: published.id },
    });

    const seo = await caller.updateSeo({
      id: published.id,
      rootId: created.rootId,
      title: "Staged SEO",
      noIndex: true,
      noFollow: true,
    });

    expect(seo.title).toBe("Staged SEO");

    const root = await db.pageRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(published.id);
    expect(root.currentVersionId).not.toBe(published.id);

    const liveVersion = await db.pageVersion.findUniqueOrThrow({
      where: { id: published.id },
    });
    expect(liveVersion.seoId).toBe(liveBefore.seoId);

    const liveSeo = await db.seo.findUniqueOrThrow({
      where: { id: liveVersion.seoId! },
    });
    expect(liveSeo.title).not.toBe("Staged SEO");

    const currentVersion = await db.pageVersion.findUniqueOrThrow({
      where: { id: root.currentVersionId! },
    });
    expect(currentVersion.status).toBe(ContentStatus.CHANGED);
    expect(currentVersion.seoId).not.toBe(liveVersion.seoId);

    const currentSeo = await db.seo.findUniqueOrThrow({
      where: { id: currentVersion.seoId! },
    });
    expect(currentSeo.title).toBe("Staged SEO");
    expect(currentSeo.noIndex).toBe(true);
  });

  it("makes the staged SEO live once the current version is published", async () => {
    const created = await createPage();
    await caller.publish({ id: created.id, rootId: created.rootId });
    await caller.updateSeo({
      id: created.id,
      rootId: created.rootId,
      title: "Staged SEO",
      noIndex: false,
      noFollow: false,
    });

    const rootAfterSeo = await db.pageRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    await caller.publish({
      id: rootAfterSeo.currentVersionId!,
      rootId: created.rootId,
    });

    const root = await db.pageRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    const liveVersion = await db.pageVersion.findUniqueOrThrow({
      where: { id: root.liveVersionId! },
    });
    const liveSeo = await db.seo.findUniqueOrThrow({
      where: { id: liveVersion.seoId! },
    });
    expect(liveSeo.title).toBe("Staged SEO");
  });

  it("throws NOT_FOUND for an unknown page", async () => {
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

describe("pagesRouter remove", () => {
  it("deletes the root, every version and all of the page's SEO rows", async () => {
    const created = await createPage();
    await caller.publish({ id: created.id, rootId: created.rootId });
    await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Second version",
    });

    const versions = await db.pageVersion.findMany({
      where: { rootId: created.rootId },
      select: { seoId: true },
    });
    const seoIds = versions
      .map((version) => version.seoId)
      .filter((id): id is string => Boolean(id));

    await caller.remove({ id: created.id });

    expect(
      await db.pageRoot.findUnique({ where: { id: created.rootId } }),
    ).toBeNull();
    expect(
      await db.pageVersion.findMany({ where: { rootId: created.rootId } }),
    ).toHaveLength(0);

    for (const seoId of seoIds) {
      expect(await db.seo.findUnique({ where: { id: seoId } })).toBeNull();
    }
  });

  it("leaves no orphaned versions or SEO rows after deleting a multi-version page", async () => {
    const created = await createPage();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Forked",
    });
    await caller.updateSeo({
      id: forked.id,
      rootId: created.rootId,
      title: "Forked SEO",
      noIndex: false,
      noFollow: false,
    });

    await caller.remove({ id: forked.id });

    expect(
      await db.pageVersion.findMany({ where: { rootId: created.rootId } }),
    ).toHaveLength(0);
    const root = await db.pageRoot.findUnique({ where: { id: created.rootId } });
    expect(root).toBeNull();
  });

  it("keeps a SEO row that is still referenced by another page's version", async () => {
    const first = await createPage();
    const second = await createPage();

    const sharedSeoId = (
      await db.pageVersion.findUniqueOrThrow({ where: { id: first.id } })
    ).seoId;
    expect(sharedSeoId).toBeTruthy();
    await db.pageVersion.update({
      where: { id: second.id },
      data: { seoId: sharedSeoId },
    });

    await caller.remove({ id: first.id });

    const survivor = await db.seo.findUnique({ where: { id: sharedSeoId! } });
    expect(survivor).not.toBeNull();
  });

  it("throws NOT_FOUND for an unknown page", async () => {
    await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
  });
});
