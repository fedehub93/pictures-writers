import { describe, it, expect, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import { ContentStatus, ScheduledActionStatus } from "@/generated/prisma";

import { publishPost } from "../publish-post";
import { savePostVersion } from "../save-post";
import { cancelSchedule, reschedulePost, schedulePost } from "../schedule-post";
import {
  addPostVersion,
  createPostRoot,
  makeCurrent,
} from "./root-fixtures";

import { getPublishedPostByRootId } from "../../server/queries/get-published-post-by-root-id";

describe("scheduled post lifecycle", () => {
  const createdRootIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!createdRootIds.includes(rootId)) {
      createdRootIds.push(rootId);
    }
    return rootId;
  };

  afterEach(async () => {
    if (createdRootIds.length > 0) {
      await db.scheduledAction.deleteMany({
        where: { targetId: { in: createdRootIds } },
      });
      await db.postRoot.deleteMany({
        where: { id: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("scheduling", () => {
    it("schedules the current DRAFT version and stores its previous status", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const { rootId, version } = await createPostRoot({
        version: { status: ContentStatus.DRAFT },
      });
      trackRootId(rootId);

      const scheduled = await schedulePost({
        versionId: version.id,
        rootId,
        scheduledAt,
        now,
      });

      expect(scheduled.status).toBe(ContentStatus.SCHEDULED);
      expect(scheduled.scheduledAt?.toISOString()).toBe(
        scheduledAt.toISOString(),
      );
      expect(scheduled.preSchedulingStatus).toBe(ContentStatus.DRAFT);

      const root = await db.postRoot.findUniqueOrThrow({
        where: { id: rootId },
      });
      expect(root.currentVersionId).toBe(version.id);
      expect(root.liveVersionId).toBeNull();

      const action = await db.scheduledAction.findFirstOrThrow({
        where: { targetId: rootId },
      });
      expect(action.type).toBe("PUBLISH_POST");
      expect(action.targetType).toBe("POST_ROOT");
      expect(action.status).toBe(ScheduledActionStatus.SCHEDULED);
    });

    it("schedules a CHANGED version while the published version remains public", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const { rootId, version: live } = await createPostRoot({
        firstPublishedAt: firstPublishAt,
        version: {
          status: ContentStatus.PUBLISHED,
          publishedAt: firstPublishAt,
        },
      });
      trackRootId(rootId);

      const staged = await addPostVersion(rootId, {
        status: ContentStatus.CHANGED,
        title: "Test Post",
      });
      await makeCurrent(rootId, staged.id);

      const scheduled = await schedulePost({
        versionId: staged.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now,
      });

      expect(scheduled.status).toBe(ContentStatus.SCHEDULED);
      expect(scheduled.preSchedulingStatus).toBe(ContentStatus.CHANGED);

      const publicVersion = await getPublishedPostByRootId(rootId);
      expect(publicVersion?.id).toBe(live.id);
    });

    it("rejects scheduling in the past", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await expect(
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("2025-06-01T09:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Scheduled time must be in the future",
      });
    });

    it("rejects an invalid scheduled date", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await expect(
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("invalid"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Scheduled time must be in the future",
      });
    });

    it("rejects scheduling a non-current version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version: current } = await createPostRoot();
      trackRootId(rootId);

      const other = await addPostVersion(rootId, {
        status: ContentStatus.DRAFT,
      });
      // `current` remains the current version; `other` is not.
      expect(other.id).not.toBe(current.id);

      await expect(
        schedulePost({
          versionId: other.id,
          rootId,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
        message: "Only the current version can be scheduled",
      });
    });

    it("rejects scheduling a version with a missing title", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot({ version: { title: "" } });
      trackRootId(rootId);

      await expect(
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        message: "Missing required fields",
      });
    });

    it("rejects scheduling a PUBLISHED version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot({
        version: {
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      });
      trackRootId(rootId);

      await expect(
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "INVALID_STATE",
        message: "Only draft or changed posts can be scheduled",
      });
    });

    it("rejects a second active schedule for the same root", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({
        versionId: version.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      await expect(
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("2025-06-01T12:00:00.000Z"),
          now,
        }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "An active schedule already exists for this post",
      });
    });

    it("allows scheduling a new version after the previous one was published", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-06-01T11:30:00.000Z");
      const { rootId, version: first } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({
        versionId: first.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      await publishPost({ id: first.id, rootId, now: firstPublishAt });

      const forked = await savePostVersion({
        id: first.id,
        rootId,
        title: "Second revision",
      });

      const rescheduled = await schedulePost({
        versionId: forked.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now: new Date("2025-06-01T12:00:00.000Z"),
      });

      expect(rescheduled.status).toBe(ContentStatus.SCHEDULED);

      const actions = await db.scheduledAction.findMany({
        where: { targetId: rootId },
      });

      expect(actions).toHaveLength(2);
      expect(actions.map((action) => action.status).sort()).toEqual([
        ScheduledActionStatus.SCHEDULED,
        ScheduledActionStatus.SUCCEEDED,
      ]);
    });

    it("allows at most one active schedule when two requests arrive concurrently", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      const [first, second] = await Promise.allSettled([
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now,
        }),
        schedulePost({
          versionId: version.id,
          rootId,
          scheduledAt: new Date("2025-06-01T12:00:00.000Z"),
          now,
        }),
      ]);

      const succeeded = [first, second].filter(
        (result) => result.status === "fulfilled",
      );
      const failed = [first, second].filter(
        (result) => result.status === "rejected",
      );

      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      const scheduled = await db.postVersion.findUniqueOrThrow({
        where: { id: version.id },
      });
      expect(scheduled.status).toBe(ContentStatus.SCHEDULED);

      const actions = await db.scheduledAction.findMany({
        where: { targetId: rootId },
      });
      expect(actions).toHaveLength(1);

      const rejected = failed[0] as PromiseRejectedResult;
      expect(rejected.reason).toMatchObject({
        code: "CONFLICT",
        message: "An active schedule already exists for this post",
      });
    });
  });

  describe("editing and rescheduling", () => {
    it("edits update the same scheduled version in place", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({ versionId: version.id, rootId, scheduledAt, now });

      const updated = await savePostVersion({
        id: version.id,
        rootId,
        title: "Updated scheduled title",
      });

      expect(updated.id).toBe(version.id);
      expect(updated.status).toBe(ContentStatus.SCHEDULED);
      expect(updated.title).toBe("Updated scheduled title");
      expect(updated.scheduledAt?.toISOString()).toBe(
        scheduledAt.toISOString(),
      );
    });

    it("reschedules changes the scheduled time on the version and the action", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({
        versionId: version.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      const newScheduledAt = new Date("2025-06-02T15:00:00.000Z");
      const rescheduled = await reschedulePost({
        versionId: version.id,
        rootId,
        scheduledAt: newScheduledAt,
        now,
      });

      expect(rescheduled.status).toBe(ContentStatus.SCHEDULED);
      expect(rescheduled.scheduledAt?.toISOString()).toBe(
        newScheduledAt.toISOString(),
      );

      const action = await db.scheduledAction.findFirstOrThrow({
        where: { targetId: rootId },
      });
      expect(action.plannedAt.toISOString()).toBe(newScheduledAt.toISOString());
    });

    it("rejects rescheduling a non-scheduled post", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await expect(
        reschedulePost({
          versionId: version.id,
          rootId,
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
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({
        versionId: version.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      const cancelled = await cancelSchedule({ versionId: version.id, rootId });

      expect(cancelled.status).toBe(ContentStatus.DRAFT);
      expect(cancelled.scheduledAt).toBeNull();
      expect(cancelled.preSchedulingStatus).toBeNull();

      const action = await db.scheduledAction.findFirstOrThrow({
        where: { targetId: rootId },
      });
      expect(action.status).toBe(ScheduledActionStatus.CANCELED);
    });

    it("cancelling a scheduled change restores CHANGED and keeps the public version", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const { rootId, version: live } = await createPostRoot({
        firstPublishedAt: firstPublishAt,
        version: {
          status: ContentStatus.PUBLISHED,
          publishedAt: firstPublishAt,
        },
      });
      trackRootId(rootId);

      const staged = await addPostVersion(rootId, {
        status: ContentStatus.CHANGED,
      });
      await makeCurrent(rootId, staged.id);

      await schedulePost({
        versionId: staged.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now,
      });

      const cancelled = await cancelSchedule({ versionId: staged.id, rootId });

      expect(cancelled.status).toBe(ContentStatus.CHANGED);
      expect(cancelled.scheduledAt).toBeNull();

      const publicVersion = await getPublishedPostByRootId(rootId);
      expect(publicVersion?.id).toBe(live.id);
    });
  });

  describe("immediate publication", () => {
    it("publishes a scheduled post now and clears the scheduled state", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({
        versionId: version.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      const published = await publishPost({ id: version.id, rootId, now });

      expect(published.status).toBe(ContentStatus.PUBLISHED);
      expect(published.scheduledAt).toBeNull();
      expect(published.preSchedulingStatus).toBeNull();
      expect(published.publishedAt?.toISOString()).toBe(now.toISOString());

      const root = await db.postRoot.findUniqueOrThrow({
        where: { id: rootId },
      });
      expect(root.liveVersionId).toBe(version.id);
    });

    it("keeps a later publish run as a no-op after immediate publication", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const { rootId, version } = await createPostRoot();
      trackRootId(rootId);

      await schedulePost({
        versionId: version.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      await publishPost({ id: version.id, rootId, now });

      const second = await publishPost({
        id: version.id,
        rootId,
        now: new Date("2025-06-01T12:00:00.000Z"),
      });

      expect(second.status).toBe(ContentStatus.PUBLISHED);
      expect(second.publishedAt?.toISOString()).toBe(now.toISOString());
    });
  });

  describe("public visibility", () => {
    it("keeps the current public version unchanged until the scheduled one is published", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const { rootId, version: live } = await createPostRoot({
        firstPublishedAt: firstPublishAt,
        version: {
          status: ContentStatus.PUBLISHED,
          publishedAt: firstPublishAt,
        },
      });
      trackRootId(rootId);

      const staged = await addPostVersion(rootId, {
        status: ContentStatus.CHANGED,
      });
      await makeCurrent(rootId, staged.id);

      await schedulePost({
        versionId: staged.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now,
      });

      const publicVersion = await db.postVersion.findUniqueOrThrow({
        where: { id: live.id },
      });

      expect(publicVersion.status).toBe(ContentStatus.PUBLISHED);
      expect(publicVersion.publishedAt?.toISOString()).toBe(
        firstPublishAt.toISOString(),
      );

      const scheduled = await db.postVersion.findUniqueOrThrow({
        where: { id: staged.id },
      });
      expect(scheduled.status).toBe(ContentStatus.SCHEDULED);
    });
  });
});
