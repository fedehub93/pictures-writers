import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { publishPost } from "../publish-post";
import { schedulePost } from "../schedule-post";
import { publishDuePosts } from "../publish-due-posts";

describe("publishDuePosts workflow", () => {
  const createdRootIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!createdRootIds.includes(rootId)) {
      createdRootIds.push(rootId);
    }
  };

  const createPost = async (
    overrides: Partial<{
      title: string;
      slug: string;
      status: ContentStatus;
      version: number;
      rootId: string;
      isLatest: boolean;
      firstPublishedAt: Date;
      publishedAt: Date;
      scheduledAt: Date;
      preSchedulingStatus: ContentStatus;
    }> = {},
  ) => {
    const explicitRootId = overrides.rootId;
    const post = await db.post.create({
      data: {
        title: "Test Post",
        slug: "test-post",
        version: 1,
        status: ContentStatus.DRAFT,
        bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
        rootId: explicitRootId,
        ...overrides,
      },
    });

    const rootId = explicitRootId ?? post.id;
    if (!explicitRootId) {
      await db.post.update({
        where: { id: post.id },
        data: { rootId },
      });
    }

    trackRootId(rootId);
    return { ...post, rootId };
  };

  afterEach(async () => {
    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("due post selection", () => {
    it("publishes every due scheduled post and leaves future posts untouched", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const duePost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: duePost.id,
        rootId: duePost.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      const futurePost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: futurePost.id,
        rootId: futurePost.rootId,
        scheduledAt: new Date("2025-06-01T13:00:00.000Z"),
        now: scheduleNow,
      });

      const result = await publishDuePosts({ now: publishNow });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);

      const due = await db.post.findUnique({ where: { id: duePost.id } });
      const future = await db.post.findUnique({ where: { id: futurePost.id } });

      expect(due?.status).toBe(ContentStatus.PUBLISHED);
      expect(due?.scheduledAt).toBeNull();
      expect(future?.status).toBe(ContentStatus.SCHEDULED);
      expect(future?.scheduledAt).not.toBeNull();
    });

    it("publishes scheduled posts whose timestamp is less than or equal to the current time", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");

      const boundaryPost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: boundaryPost.id,
        rootId: boundaryPost.rootId,
        scheduledAt,
        now: scheduleNow,
      });

      const result = await publishDuePosts({ now: scheduledAt });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });
  });

  describe("independent processing", () => {
    it("publishes valid due posts even when another due post is invalid", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const validPost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: validPost.id,
        rootId: validPost.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      const invalidPost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: invalidPost.id,
        rootId: invalidPost.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });
      await db.post.update({
        where: { id: invalidPost.id },
        data: { title: "" },
      });

      const result = await publishDuePosts({ now: publishNow });

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(1);

      const valid = await db.post.findUnique({ where: { id: validPost.id } });
      const invalid = await db.post.findUnique({
        where: { id: invalidPost.id },
      });

      expect(valid?.status).toBe(ContentStatus.PUBLISHED);
      expect(invalid?.status).toBe(ContentStatus.SCHEDULED);
    });
  });

  describe("idempotency", () => {
    it("does not publish a due post a second time when invoked repeatedly", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      const first = await publishDuePosts({ now: publishNow });
      const second = await publishDuePosts({
        now: new Date("2025-06-01T13:00:00.000Z"),
      });

      expect(first.processed).toBe(1);
      expect(first.succeeded).toBe(1);
      expect(second.processed).toBe(0);
      expect(second.succeeded).toBe(0);

      const published = await db.post.findUnique({ where: { id: post.id } });
      expect(published?.status).toBe(ContentStatus.PUBLISHED);
      expect(published?.publishedAt.toISOString()).toBe(publishNow.toISOString());
    });
  });

  describe("retry", () => {
    it("publishes a previously failing post after the validation issue is fixed", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });
      await db.post.update({
        where: { id: post.id },
        data: { title: "" },
      });

      const first = await publishDuePosts({ now: publishNow });
      expect(first.succeeded).toBe(0);
      expect(first.failed).toBe(1);

      await db.post.update({
        where: { id: post.id },
        data: { title: "Fixed Title" },
      });

      const second = await publishDuePosts({
        now: new Date("2025-06-01T13:00:00.000Z"),
      });
      expect(second.succeeded).toBe(1);
      expect(second.failed).toBe(0);

      const published = await db.post.findUnique({ where: { id: post.id } });
      expect(published?.status).toBe(ContentStatus.PUBLISHED);
      expect(published?.title).toBe("Fixed Title");
    });
  });

  describe("ignored states", () => {
    it("ignores posts that are no longer scheduled", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      await publishPost({ postId: post.id, rootId: post.rootId, now: publishNow });

      const result = await publishDuePosts({
        now: new Date("2025-06-01T13:00:00.000Z"),
      });

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
    });

    it("ignores deleted scheduled posts", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      await db.post.delete({ where: { id: post.id } });

      const result = await publishDuePosts({ now: publishNow });

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
    });

    it("skips scheduled posts that are missing a rootId", async () => {
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const post = await db.post.create({
        data: {
          title: "Orphan scheduled post",
          slug: "orphan",
          version: 1,
          status: ContentStatus.SCHEDULED,
          bodyData: [{ type: "paragraph", children: [{ text: "" }] }],
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        },
      });

      const result = await publishDuePosts({ now: publishNow });

      expect(result.processed).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.succeeded).toBe(0);

      await db.post.delete({ where: { id: post.id } });
    });
  });

  describe("batching", () => {
    it("processes at most the configured batch size per invocation", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");
      const batchRootIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const post = await createPost({
          status: ContentStatus.DRAFT,
          slug: `batch-post-${i}`,
        });
        batchRootIds.push(post.rootId);
        await schedulePost({
          postId: post.id,
          rootId: post.rootId,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now: scheduleNow,
        });
      }

      const result = await publishDuePosts({ now: publishNow, batchSize: 2 });

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);

      const remaining = await db.post.count({
        where: {
          status: ContentStatus.SCHEDULED,
          rootId: { in: batchRootIds },
        },
      });

      expect(remaining).toBe(1);
    });
  });
});
