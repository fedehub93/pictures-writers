import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
// exercised against the test database without a session, exactly like the
// pages-delete-seo suite.
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

import { ContentStatus, ScheduledActionStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { postsRouter } from "../procedures";

const createCaller = createCallerFactory(postsRouter);

const rootIds: string[] = [];
const userIds: string[] = [];
const categoryIds: string[] = [];
const tagIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let userId: string;

beforeEach(async () => {
  rootIds.length = 0;
  userIds.length = 0;
  categoryIds.length = 0;
  tagIds.length = 0;

  const user = await db.user.create({
    data: { email: `user-${randomUUID()}@example.com` },
  });
  userId = user.id;
  userIds.push(user.id);
  caller = createCaller({ userId: user.id, auth: { id: user.id } });
});

afterEach(async () => {
  if (rootIds.length > 0) {
    const versions = await db.postVersion.findMany({
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

    await db.postRoot.deleteMany({ where: { id: { in: rootIds } } });
    if (seoIds.length > 0) {
      await db.seo.deleteMany({ where: { id: { in: seoIds } } });
    }
  }
  if (rootIds.length > 0) {
    await db.scheduledAction.deleteMany({
      where: { targetId: { in: rootIds } },
    });
  }
  if (categoryIds.length > 0) {
    await db.category.deleteMany({ where: { id: { in: categoryIds } } });
  }
  if (tagIds.length > 0) {
    await db.tag.deleteMany({ where: { id: { in: tagIds } } });
  }
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  rootIds.length = 0;
  userIds.length = 0;
  categoryIds.length = 0;
  tagIds.length = 0;
});

async function createPost(marker: string = randomUUID()) {
  const created = await caller.create({
    title: `Post ${marker}`,
    slug: `post-${marker}`,
  });
  rootIds.push(created.rootId);
  return created;
}

async function createCategory() {
  const category = await db.category.create({
    data: {
      title: `Category ${randomUUID()}`,
      slug: `category-${randomUUID()}`,
    },
  });
  categoryIds.push(category.id);
  return category;
}

async function createTag() {
  const tag = await db.tag.create({
    data: {
      title: `Tag ${randomUUID()}`,
      slug: `tag-${randomUUID()}`,
    },
  });
  tagIds.push(tag.id);
  return tag;
}

describe("postsRouter updateSeo", () => {
  it("updates the SEO of a draft in place", async () => {
    const created = await createPost();
    const before = await db.postVersion.findUniqueOrThrow({
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

    const versions = await db.postVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.seoId).toBe(before.seoId);
  });

  it("stages SEO changes on a new current version without touching the live version", async () => {
    const created = await createPost();
    const published = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });
    const liveBefore = await db.postVersion.findUniqueOrThrow({
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

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(published.id);
    expect(root.currentVersionId).not.toBe(published.id);

    const liveVersion = await db.postVersion.findUniqueOrThrow({
      where: { id: published.id },
    });
    expect(liveVersion.seoId).toBe(liveBefore.seoId);

    const liveSeo = await db.seo.findUniqueOrThrow({
      where: { id: liveVersion.seoId! },
    });
    expect(liveSeo.title).not.toBe("Staged SEO");

    const currentVersion = await db.postVersion.findUniqueOrThrow({
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
    const created = await createPost();
    await caller.publish({ id: created.id, rootId: created.rootId });
    await caller.updateSeo({
      id: created.id,
      rootId: created.rootId,
      title: "Staged SEO",
      noIndex: false,
      noFollow: false,
    });

    const rootAfterSeo = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    await caller.publish({
      id: rootAfterSeo.currentVersionId!,
      rootId: created.rootId,
    });

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    const liveVersion = await db.postVersion.findUniqueOrThrow({
      where: { id: root.liveVersionId! },
    });
    const liveSeo = await db.seo.findUniqueOrThrow({
      where: { id: liveVersion.seoId! },
    });
    expect(liveSeo.title).toBe("Staged SEO");
  });

  it("throws NOT_FOUND for an unknown post", async () => {
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

describe("postsRouter remove", () => {
  it("deletes the root, every version, the editorial relations and the SEO rows", async () => {
    const created = await createPost();
    const category = await createCategory();
    const tag = await createTag();
    const coAuthor = await db.user.create({
      data: { email: `author-${randomUUID()}@example.com` },
    });
    userIds.push(coAuthor.id);

    await caller.update({
      id: created.id,
      rootId: created.rootId,
      categories: [{ id: category.id, sort: 0 }],
      tags: [{ id: tag.id }],
      authors: [
        { id: userId, sort: 0 },
        { id: coAuthor.id, sort: 1 },
      ],
      faqs: [{ question: "Q1", answer: "A1", sort: 0 }],
    });

    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Second version",
    });

    const versionIds = [created.id, forked.id];
    const versions = await db.postVersion.findMany({
      where: { id: { in: versionIds } },
      select: { seoId: true },
    });
    const seoIds = versions
      .map((version) => version.seoId)
      .filter((id): id is string => Boolean(id));

    await caller.remove({ id: created.rootId });

    expect(
      await db.postRoot.findUnique({ where: { id: created.rootId } }),
    ).toBeNull();
    expect(
      await db.postVersion.findMany({ where: { rootId: created.rootId } }),
    ).toHaveLength(0);
    expect(
      await db.postCategory.count({ where: { postId: { in: versionIds } } }),
    ).toBe(0);
    expect(
      await db.postAuthor.count({ where: { postId: { in: versionIds } } }),
    ).toBe(0);
    expect(
      await db.faq.count({ where: { postId: { in: versionIds } } }),
    ).toBe(0);

    const tagLinks = await db.$queryRaw<{ A: string; B: string }[]>`
      SELECT "A", "B" FROM "_PostVersionToTag"
      WHERE "A" IN (${created.id}, ${forked.id})
    `;
    expect(tagLinks).toHaveLength(0);

    for (const seoId of seoIds) {
      expect(await db.seo.findUnique({ where: { id: seoId } })).toBeNull();
    }

    // The taxonomy entities themselves survive; only the links are removed.
    expect(
      await db.category.findUnique({ where: { id: category.id } }),
    ).not.toBeNull();
    expect(await db.tag.findUnique({ where: { id: tag.id } })).not.toBeNull();
  });

  it("removes all revisions when given the root id", async () => {
    const created = await createPost();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Forked",
    });

    const versionsBefore = await db.postVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versionsBefore).toHaveLength(2);
    expect(versionsBefore.map((version) => version.id)).toEqual(
      expect.arrayContaining([created.id, forked.id]),
    );

    await caller.remove({ id: created.rootId });

    expect(
      await db.postVersion.findMany({ where: { rootId: created.rootId } }),
    ).toHaveLength(0);
    expect(
      await db.postRoot.findUnique({ where: { id: created.rootId } }),
    ).toBeNull();
  });

  it("leaves no orphaned versions or SEO rows after deleting a multi-version post", async () => {
    const created = await createPost();
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

    const seoIds = (
      await db.postVersion.findMany({
        where: { rootId: created.rootId },
        select: { seoId: true },
      })
    )
      .map((version) => version.seoId)
      .filter((id): id is string => Boolean(id));
    expect(seoIds.length).toBeGreaterThan(0);

    await caller.remove({ id: created.rootId });

    expect(
      await db.postVersion.findMany({ where: { rootId: created.rootId } }),
    ).toHaveLength(0);
    expect(
      await db.postRoot.findUnique({ where: { id: created.rootId } }),
    ).toBeNull();
    const orphanedSeo = await db.seo.findMany({
      where: { id: { in: seoIds } },
    });
    expect(orphanedSeo).toHaveLength(0);
  });

  it("keeps a SEO row that is still referenced by another post's version", async () => {
    const first = await createPost();
    const second = await createPost();

    const sharedSeoId = (
      await db.postVersion.findUniqueOrThrow({ where: { id: first.id } })
    ).seoId;
    expect(sharedSeoId).toBeTruthy();
    await db.postVersion.update({
      where: { id: second.id },
      data: { seoId: sharedSeoId },
    });

    await caller.remove({ id: first.rootId });

    const survivor = await db.seo.findUnique({ where: { id: sharedSeoId! } });
    expect(survivor).not.toBeNull();
  });

  it("cancels a pending publication action targeting the root", async () => {
    const created = await caller.create({
      title: "Scheduled",
      slug: `post-${randomUUID()}`,
      scheduledAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    rootIds.push(created.rootId);

    const action = await db.scheduledAction.findFirstOrThrow({
      where: { targetId: created.rootId, targetType: "POST_ROOT" },
    });
    expect(action.active).toBe(true);

    await caller.remove({ id: created.rootId });

    const canceled = await db.scheduledAction.findUniqueOrThrow({
      where: { id: action.id },
    });
    expect(canceled.active).toBe(false);
    expect(canceled.status).toBe(ScheduledActionStatus.CANCELED);
  });

  it("rejects a version id: the input is the root id", async () => {
    const created = await createPost();

    await expect(caller.remove({ id: created.id })).rejects.toThrow();
    expect(
      await db.postRoot.findUnique({ where: { id: created.rootId } }),
    ).not.toBeNull();
  });

  it("throws NOT_FOUND for an unknown root", async () => {
    await expect(caller.remove({ id: randomUUID() })).rejects.toThrow();
  });
});
