import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { publishPost } from "../publish-post";
import { cancelSchedule, reschedulePost, schedulePost } from "../schedule-post";
import { createNewVersion } from "../create-new-version";

import { getPublishedPostByRootId } from "../../server/queries/get-published-post-by-root-id";

describe("scheduled post lifecycle", () => {
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

  describe("scheduling", () => {
    it("schedules a valid DRAFT post for a future time and becomes SCHEDULED", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });

      const scheduled = await schedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt,
        now,
      });

      expect(scheduled.status).toBe(ContentStatus.SCHEDULED);
      expect(scheduled.scheduledAt?.toISOString()).toBe(
        scheduledAt.toISOString(),
      );
      expect(scheduled.preSchedulingStatus).toBe(ContentStatus.DRAFT);
    });

    it("schedules a valid CHANGED post while the published version remains public", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const versionOne = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });
      const rootId = versionOne.rootId;

      await publishPost({
        postId: versionOne.id,
        rootId,
        now: firstPublishAt,
      });

      const versionTwo = await createPost({
        rootId,
        title: "Test Post",
        slug: "test-post",
        version: 2,
        status: ContentStatus.CHANGED,
        firstPublishedAt: firstPublishAt,
        publishedAt: firstPublishAt,
      });
      trackRootId(rootId);

      const scheduledAt = new Date("2025-06-02T12:00:00.000Z");
      const scheduled = await schedulePost({
        postId: versionTwo.id,
        rootId,
        scheduledAt,
        now,
      });

      expect(scheduled.status).toBe(ContentStatus.SCHEDULED);
      expect(scheduled.preSchedulingStatus).toBe(ContentStatus.CHANGED);

      const publicVersion = await getPublishedPostByRootId(rootId);
      expect(publicVersion?.id).toBe(versionOne.id);
    });

    it("rejects scheduling in the past", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T09:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await expect(
        schedulePost({
          postId: post.id,
          rootId: post.rootId!,
          scheduledAt,
          now,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Scheduled time must be in the future",
      });
    });

    it("rejects scheduling a post with missing required fields", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ title: "" });

      await expect(
        schedulePost({
          postId: post.id,
          rootId: post.rootId!,
          scheduledAt,
          now,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Missing required fields",
      });
    });

    it("rejects scheduling a PUBLISHED post", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ status: ContentStatus.PUBLISHED });

      await expect(
        schedulePost({
          postId: post.id,
          rootId: post.rootId!,
          scheduledAt,
          now,
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
        message: "Only draft or changed posts can be scheduled",
      });
    });

    it("rejects a second active schedule for the same root", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const firstPost = await createPost({ status: ContentStatus.DRAFT });
      const rootId = firstPost.rootId;

      await schedulePost({
        postId: firstPost.id,
        rootId,
        scheduledAt,
        now,
      });

      const secondPost = await createPost({
        rootId,
        title: "Test Post",
        slug: "test-post",
        version: 2,
        status: ContentStatus.DRAFT,
      });

      await expect(
        schedulePost({
          postId: secondPost.id,
          rootId,
          scheduledAt: new Date("2025-06-01T12:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "An active schedule already exists for this post",
      });
    });
  });

  describe("editing and rescheduling", () => {
    it("edits update the same scheduled version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await schedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt,
        now,
      });

      await createNewVersion({
        id: post.id,
        rootId: post.rootId!,
        title: "Updated scheduled title",
      });

      const updated = await db.post.findUnique({
        where: { id: post.id },
      });

      expect(updated?.id).toBe(post.id);
      expect(updated?.status).toBe(ContentStatus.SCHEDULED);
      expect(updated?.title).toBe("Updated scheduled title");
      expect(updated?.scheduledAt?.toISOString()).toBe(
        scheduledAt.toISOString(),
      );
    });

    it("reschedules changes the scheduled time", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await schedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt,
        now,
      });

      const newScheduledAt = new Date("2025-06-02T15:00:00.000Z");
      const rescheduled = await reschedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt: newScheduledAt,
        now,
      });

      expect(rescheduled.status).toBe(ContentStatus.SCHEDULED);
      expect(rescheduled.scheduledAt?.toISOString()).toBe(
        newScheduledAt.toISOString(),
      );
    });

    it("rejects rescheduling a non-scheduled post", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await expect(
        reschedulePost({
          postId: post.id,
          rootId: post.rootId!,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
        message: "Only scheduled posts can be rescheduled",
      });
    });
  });

  describe("cancellation", () => {
    it("cancelling a never-published scheduled post restores DRAFT", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await schedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt,
        now,
      });

      const cancelled = await cancelSchedule({
        postId: post.id,
        rootId: post.rootId!,
      });

      expect(cancelled.status).toBe(ContentStatus.DRAFT);
      expect(cancelled.scheduledAt).toBeNull();
      expect(cancelled.preSchedulingStatus).toBeNull();
    });

    it("cancelling a scheduled change restores CHANGED and keeps the public version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const versionOne = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });
      const rootId = versionOne.rootId;

      await publishPost({
        postId: versionOne.id,
        rootId,
        now: firstPublishAt,
      });

      const versionTwo = await createPost({
        rootId,
        title: "Test Post",
        slug: "test-post",
        version: 2,
        status: ContentStatus.CHANGED,
        firstPublishedAt: firstPublishAt,
        publishedAt: firstPublishAt,
      });
      trackRootId(rootId);

      await schedulePost({
        postId: versionTwo.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now,
      });

      const cancelled = await cancelSchedule({
        postId: versionTwo.id,
        rootId,
      });

      expect(cancelled.status).toBe(ContentStatus.CHANGED);
      expect(cancelled.scheduledAt).toBeNull();

      const publicVersion = await getPublishedPostByRootId(rootId);
      expect(publicVersion?.id).toBe(versionOne.id);
    });
  });

  describe("immediate publication", () => {
    it("publishes a scheduled post now and clears the scheduled state", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await schedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt,
        now,
      });

      const published = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now,
      });

      expect(published.status).toBe(ContentStatus.PUBLISHED);
      expect(published.scheduledAt).toBeNull();
      expect(published.preSchedulingStatus).toBeNull();
      expect(published.publishedAt.toISOString()).toBe(now.toISOString());
    });

    it("keeps a later scheduler run as a no-op after immediate publication", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await schedulePost({
        postId: post.id,
        rootId: post.rootId!,
        scheduledAt,
        now,
      });

      await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now,
      });

      const second = await publishPost({
        postId: post.id,
        rootId: post.rootId!,
        now: new Date("2025-06-01T12:00:00.000Z"),
      });

      expect(second.status).toBe(ContentStatus.PUBLISHED);
      expect(second.publishedAt.toISOString()).toBe(now.toISOString());
    });
  });

  describe("public visibility", () => {
    it("does not expose scheduled posts through public queries", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const versionOne = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });
      const rootId = versionOne.rootId;

      await publishPost({
        postId: versionOne.id,
        rootId,
        now: firstPublishAt,
      });

      const versionTwo = await createPost({
        rootId,
        title: "Test Post",
        slug: "test-post",
        version: 2,
        status: ContentStatus.CHANGED,
        firstPublishedAt: firstPublishAt,
        publishedAt: firstPublishAt,
      });
      trackRootId(rootId);

      await schedulePost({
        postId: versionTwo.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now,
      });

      const publicVersion = await getPublishedPostByRootId(rootId);
      expect(publicVersion?.id).toBe(versionOne.id);
    });
  });
});
