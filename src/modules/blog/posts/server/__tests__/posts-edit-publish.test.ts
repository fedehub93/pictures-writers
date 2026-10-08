import { randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The procedures only need the router builders, not the auth middleware. This
// mock swaps the permission procedure for a plain one so the round-trip can be
// exercised against the test database without a session, exactly like the
// pages-edit-publish suite.
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

import { postsRouter } from "../procedures";

const createCaller = createCallerFactory(postsRouter);

const rootIds: string[] = [];
const userIds: string[] = [];

let caller: ReturnType<typeof createCaller>;
let userId: string;

beforeEach(async () => {
  rootIds.length = 0;
  userIds.length = 0;

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
  if (userIds.length > 0) {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
  }
  rootIds.length = 0;
  userIds.length = 0;
});

async function createPost(marker: string = randomUUID()) {
  const created = await caller.create({
    title: `Post ${marker}`,
    slug: `post-${marker}`,
  });
  rootIds.push(created.rootId);
  return created;
}

describe("postsRouter create", () => {
  it("creates a root plus a version 1 draft with its own SEO", async () => {
    const created = await createPost();

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.slug).toBe(created.slug);
    expect(root.liveVersionId).toBeNull();
    expect(root.currentVersionId).toBe(created.id);

    const versions = await db.postVersion.findMany({
      where: { rootId: root.id },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
    expect(versions[0]!.seoId).toBeTruthy();

    const seo = await db.seo.findUnique({ where: { id: versions[0]!.seoId! } });
    expect(seo).not.toBeNull();
    expect(seo!.rootId).toBe(seo!.id);
  });
});

describe("postsRouter getVersions (version history)", () => {
  it("returns the single draft after creation", async () => {
    const created = await createPost();

    const versions = await caller.getVersions({ rootId: created.rootId });

    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
  });

  it("keeps every revision, newest first, after publishing and editing", async () => {
    const created = await createPost();

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

describe("postsRouter edit", () => {
  it("updates the current version in place when it is a draft", async () => {
    const created = await createPost();

    const updated = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Edited draft",
    });

    expect(updated.title).toBe("Edited draft");

    const versions = await db.postVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(1);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.version).toBe(1);
    expect(versions[0]!.status).toBe(ContentStatus.DRAFT);
    expect(versions[0]!.title).toBe("Edited draft");

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.currentVersionId).toBe(created.id);
  });

  it("updates the root slug when the slug changes", async () => {
    const created = await createPost();
    const nextSlug = `renamed-${randomUUID()}`;

    await caller.update({
      id: created.id,
      rootId: created.rootId,
      slug: nextSlug,
    });

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.slug).toBe(nextSlug);

    const loaded = await caller.getOne({ id: created.rootId });
    expect(loaded.slug).toBe(nextSlug);
  });

  it("forks a new CHANGED version when editing a published post", async () => {
    const created = await createPost();
    const published = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });

    const updated = await caller.update({
      id: published.id,
      rootId: created.rootId,
      title: "Staged change",
    });

    expect(updated.id).not.toBe(created.id);

    const versions = await db.postVersion.findMany({
      where: { rootId: created.rootId },
      orderBy: { version: "asc" },
    });
    expect(versions).toHaveLength(2);
    expect(versions[0]!.id).toBe(created.id);
    expect(versions[0]!.status).toBe(ContentStatus.PUBLISHED);
    expect(versions[0]!.title).toBe(created.title);
    expect(versions[1]!.id).toBe(updated.id);
    expect(versions[1]!.version).toBe(2);
    expect(versions[1]!.status).toBe(ContentStatus.CHANGED);
    expect(versions[1]!.title).toBe("Staged change");

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.currentVersionId).toBe(updated.id);
    expect(root.liveVersionId).toBe(created.id);
  });

  it("copies the live version's editorial relations onto the fork", async () => {
    const created = await createPost();

    await caller.update({
      id: created.id,
      rootId: created.rootId,
      authors: [{ id: userId, sort: 0 }],
      faqs: [{ question: "Q1", answer: "A1", sort: 0 }],
    });

    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Staged change",
    });

    const forkedAuthors = await db.postAuthor.findMany({
      where: { postId: forked.id },
    });
    expect(forkedAuthors).toHaveLength(1);
    expect(forkedAuthors[0]!.userId).toBe(userId);

    const forkedFaqs = await db.faq.findMany({ where: { postId: forked.id } });
    expect(forkedFaqs.map((faq) => faq.question)).toEqual(["Q1"]);

    const liveFaqs = await db.faq.findMany({ where: { postId: created.id } });
    expect(liveFaqs.map((faq) => faq.question)).toEqual(["Q1"]);
  });

  it("keeps editing the forked version in place", async () => {
    const created = await createPost();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "First edit",
    });

    const second = await caller.update({
      id: forked.id,
      rootId: created.rootId,
      title: "Second edit",
    });

    expect(second.id).toBe(forked.id);

    const versions = await db.postVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(2);
  });

  it("throws NOT_FOUND when the version does not exist", async () => {
    await expect(
      caller.update({ id: randomUUID(), rootId: randomUUID(), title: "x" }),
    ).rejects.toThrow();
  });
});

describe("postsRouter publish", () => {
  it("promotes the target version to live and marks it published", async () => {
    const created = await createPost();

    const published = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });

    expect(published.status).toBe(ContentStatus.PUBLISHED);
    expect(published.publishedAt).toBeInstanceOf(Date);

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(created.id);
    expect(root.currentVersionId).toBe(created.id);
    expect(root.firstPublishedAt).toBeInstanceOf(Date);
  });

  it("clears scheduling state when publishing a scheduled version", async () => {
    const created = await createPost();

    const scheduledAt = new Date(Date.now() + 60 * 60 * 1000);
    const version = await db.postVersion.update({
      where: { id: created.id },
      data: {
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        preSchedulingStatus: ContentStatus.DRAFT,
      },
    });
    expect(version.status).toBe(ContentStatus.SCHEDULED);

    await caller.publish({ id: created.id, rootId: created.rootId });

    const live = await db.postVersion.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(live.status).toBe(ContentStatus.PUBLISHED);
    expect(live.scheduledAt).toBeNull();
    expect(live.preSchedulingStatus).toBeNull();
  });

  it("promotes a forked version and demotes the previous live version", async () => {
    const created = await createPost();
    await caller.publish({ id: created.id, rootId: created.rootId });
    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "New live",
    });

    await caller.publish({ id: forked.id, rootId: created.rootId });

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(forked.id);

    const previous = await db.postVersion.findUniqueOrThrow({
      where: { id: created.id },
    });
    expect(previous.status).toBe(ContentStatus.CHANGED);

    const live = await db.postVersion.findUniqueOrThrow({
      where: { id: forked.id },
    });
    expect(live.status).toBe(ContentStatus.PUBLISHED);
  });

  it("sets firstPublishedAt only on the first publication of the root", async () => {
    const created = await createPost();
    const first = await caller.publish({
      id: created.id,
      rootId: created.rootId,
    });
    const rootAfterFirst = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(rootAfterFirst.firstPublishedAt?.toISOString()).toBe(
      first.publishedAt?.toISOString(),
    );

    const forked = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Second publication",
    });
    const second = await caller.publish({
      id: forked.id,
      rootId: created.rootId,
    });

    const rootAfterSecond = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(rootAfterSecond.firstPublishedAt?.toISOString()).toBe(
      rootAfterFirst.firstPublishedAt?.toISOString(),
    );
    expect(second.publishedAt?.toISOString()).not.toBe(
      first.publishedAt?.toISOString(),
    );
  });

  it("leaves the root consistent when two publishes race on the same version", async () => {
    const created = await createPost();

    const results = await Promise.all([
      caller.publish({ id: created.id, rootId: created.rootId }),
      caller.publish({ id: created.id, rootId: created.rootId }),
    ]);

    const publishedAts = results.map((result) =>
      result.publishedAt?.toISOString(),
    );
    expect(new Set(publishedAts).size).toBe(1);
    expect(
      results.every((result) => result.status === ContentStatus.PUBLISHED),
    ).toBe(true);

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBe(created.id);

    const versions = await db.postVersion.findMany({
      where: { rootId: created.rootId },
    });
    expect(versions).toHaveLength(1);
  });

  it("leaves a single live version when two publishers promote different versions", async () => {
    const created = await createPost();
    await caller.publish({ id: created.id, rootId: created.rootId });

    const second = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Revision two",
    });
    const third = await caller.update({
      id: created.id,
      rootId: created.rootId,
      title: "Revision three",
    });

    await Promise.all([
      caller.publish({ id: second.id, rootId: created.rootId }),
      caller.publish({ id: third.id, rootId: created.rootId }),
    ]);

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect([second.id, third.id]).toContain(root.liveVersionId);

    const versions = await db.postVersion.findMany({
      where: { rootId: created.rootId },
      orderBy: { version: "asc" },
    });
    const live = versions.filter(
      (version) => version.status === ContentStatus.PUBLISHED,
    );
    expect(live).toHaveLength(1);
    expect(live[0]!.id).toBe(root.liveVersionId);
  });

  it("throws NOT_FOUND when the target version is unknown", async () => {
    await expect(
      caller.publish({ id: randomUUID(), rootId: randomUUID() }),
    ).rejects.toThrow();
  });
});

describe("postsRouter unpublish", () => {
  it("clears the live version and moves it back to CHANGED", async () => {
    const created = await createPost();
    await caller.publish({ id: created.id, rootId: created.rootId });

    const unpublished = await caller.unpublish({ id: created.id });

    expect(unpublished.status).toBe(ContentStatus.CHANGED);

    const root = await db.postRoot.findUniqueOrThrow({
      where: { id: created.rootId },
    });
    expect(root.liveVersionId).toBeNull();
    expect(root.currentVersionId).toBe(created.id);
  });

  it("throws NOT_FOUND for an unknown post", async () => {
    await expect(caller.unpublish({ id: randomUUID() })).rejects.toThrow();
  });
});
