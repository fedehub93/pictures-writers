import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";
import { schedulePost } from "@/modules/blog/posts/lib/schedule-post";
import { publishPost } from "@/modules/blog/posts/lib/publish-post";
import { runScheduledActions } from "@/modules/scheduler/lib/scheduler-runner";
import {
  createScheduledAction,
  createIdempotencyKey,
  claimDueScheduledAction,
  backfillScheduledPosts,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

describe("scheduler runner", () => {
  const createdRootIds: string[] = [];
  const createdActionIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!createdRootIds.includes(rootId)) {
      createdRootIds.push(rootId);
    }
  };

  const trackActionId = (id: string) => {
    createdActionIds.push(id);
  };

  const createPost = async (
    overrides: Partial<{
      title: string;
      slug: string;
      status: ContentStatus;
      version: number;
      rootId: string;
      scheduledAt: Date;
      preSchedulingStatus: ContentStatus;
      firstPublishedAt: Date;
      publishedAt: Date;
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

  beforeEach(async () => {
    // Remove scheduled posts left behind by other test files so the backfill
    // tests see a clean state. Safe: this file runs only against the
    // dedicated test database (.env.test).
    await db.post.deleteMany({
      where: { status: ContentStatus.SCHEDULED },
    });
  });

  afterEach(async () => {
    // Clean up every scheduled action created during this file's tests to
    // keep tests isolated. Posts are deleted afterwards because actions may
    // reference them through targetId.
    await db.scheduledAction.deleteMany({});
    createdActionIds.length = 0;

    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("due action selection", () => {
    it("publishes every due scheduled post and leaves future posts untouched", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");

      const duePost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: duePost.id,
        rootId: duePost.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      const futurePost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: futurePost.id,
        rootId: futurePost.rootId,
        scheduledAt: new Date("2025-06-01T13:00:00.000Z"),
        now,
      });

      const result = await runScheduledActions({ now: runAt });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);

      const due = await db.post.findUnique({ where: { id: duePost.id } });
      const future = await db.post.findUnique({ where: { id: futurePost.id } });

      expect(due?.status).toBe(ContentStatus.PUBLISHED);
      expect(future?.status).toBe(ContentStatus.SCHEDULED);
    });

    it("picks up overdue actions on the next invocation", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const plannedAt = new Date("2025-06-01T11:00:00.000Z");
      const runAt = new Date("2025-06-01T13:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: plannedAt,
        now: scheduleNow,
      });

      const result = await runScheduledActions({ now: runAt });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });
  });

  describe("claim and lease", () => {
    it("claims a due action atomically", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const action = await createScheduledAction({
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: randomUUID(),
        plannedAt: now,
        timezone: "UTC",
        idempotencyKey: createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          randomUUID(),
        ),
      });
      trackActionId(action.id);

      const claimed = await claimDueScheduledAction({ now });

      expect(claimed).not.toBeNull();
      expect(claimed?.status).toBe(ScheduledActionStatus.PROCESSING);
      expect(claimed?.leaseId).not.toBeNull();
    });

    it("does not allow two workers to claim the same action", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const action = await createScheduledAction({
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: randomUUID(),
        plannedAt: now,
        timezone: "UTC",
        idempotencyKey: createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          randomUUID(),
        ),
      });
      trackActionId(action.id);

      const [first, second] = await Promise.all([
        claimDueScheduledAction({ now, leaseId: "lease-1" }),
        claimDueScheduledAction({ now, leaseId: "lease-2" }),
      ]);

      const claimed = [first, second].filter(Boolean);
      expect(claimed).toHaveLength(1);
    });

    it("recovers an action after its lease expires", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const action = await createScheduledAction({
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: randomUUID(),
        plannedAt: now,
        timezone: "UTC",
        idempotencyKey: createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          randomUUID(),
        ),
      });
      trackActionId(action.id);

      const leaseMs = 5 * 60 * 1000;
      const claimed = await claimDueScheduledAction({ now, leaseMs });
      expect(claimed).not.toBeNull();

      const beforeExpiry = new Date(now.getTime() + leaseMs - 1000);
      const recoveredEarly = await claimDueScheduledAction({
        now: beforeExpiry,
      });
      expect(recoveredEarly).toBeNull();

      const afterExpiry = new Date(now.getTime() + leaseMs + 1000);
      const recovered = await claimDueScheduledAction({ now: afterExpiry });
      expect(recovered).not.toBeNull();
      expect(recovered?.leaseId).not.toBe(claimed?.leaseId);
    });
  });

  describe("idempotency", () => {
    it("does not execute a succeeded action a second time", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const publishNow = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      const first = await runScheduledActions({ now: publishNow });
      const second = await runScheduledActions({
        now: new Date("2025-06-01T13:00:00.000Z"),
      });

      expect(first.processed).toBe(1);
      expect(first.succeeded).toBe(1);
      expect(second.processed).toBe(0);
      expect(second.succeeded).toBe(0);
    });

    it("keeps the same idempotency key across retries", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const action = await createScheduledAction({
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: randomUUID(),
        plannedAt: now,
        timezone: "UTC",
        idempotencyKey: "stable-key",
      });
      trackActionId(action.id);

      const first = await db.scheduledAction.findUnique({
        where: { id: action.id },
      });

      expect(first?.idempotencyKey).toBe("stable-key");
    });
  });

  describe("batching", () => {
    it("processes at most the configured batch size per invocation", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");
      const rootIds: string[] = [];

      for (let i = 0; i < 3; i++) {
        const post = await createPost({
          status: ContentStatus.DRAFT,
          slug: `batch-post-${i}`,
        });
        rootIds.push(post.rootId);
        await schedulePost({
          postId: post.id,
          rootId: post.rootId,
          scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
          now,
        });
      }

      const result = await runScheduledActions({ now: runAt, batchSize: 2 });

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);

      const remaining = await db.post.count({
        where: {
          status: ContentStatus.SCHEDULED,
          rootId: { in: rootIds },
        },
      });

      expect(remaining).toBe(1);
    });
  });

  describe("retry", () => {
    it("picks up a RETRY_WAIT action when its retryAt is due", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const retryAt = new Date("2025-06-01T11:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      const action = await createScheduledAction({
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: post.rootId,
        plannedAt: now,
        timezone: "UTC",
        idempotencyKey: createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          post.rootId,
        ),
      });
      trackActionId(action.id);

      await db.scheduledAction.update({
        where: { id: action.id },
        data: {
          status: ScheduledActionStatus.RETRY_WAIT,
          retryAt,
          attempts: 1,
        },
      });

      // The post must be in SCHEDULED state for the handler to publish it.
      await db.post.update({
        where: { id: post.id },
        data: { status: ContentStatus.SCHEDULED, scheduledAt: now },
      });

      const result = await runScheduledActions({ now: runAt });

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
    });

    it("does not pick up a RETRY_WAIT action before its retryAt", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const retryAt = new Date("2025-06-01T13:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");

      const action = await createScheduledAction({
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: randomUUID(),
        plannedAt: now,
        timezone: "UTC",
        idempotencyKey: createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          randomUUID(),
        ),
      });
      trackActionId(action.id);

      await db.scheduledAction.update({
        where: { id: action.id },
        data: {
          status: ScheduledActionStatus.RETRY_WAIT,
          retryAt,
          attempts: 1,
        },
      });

      const result = await runScheduledActions({ now: runAt });

      expect(result.processed).toBe(0);
    });
  });

  describe("independent processing", () => {
    it("does not let one failed action block other due actions", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");

      const validPost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: validPost.id,
        rootId: validPost.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      const invalidPost = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: invalidPost.id,
        rootId: invalidPost.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });
      await db.post.update({
        where: { id: invalidPost.id },
        data: { title: "" },
      });

      const result = await runScheduledActions({ now: runAt });

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(1);
    });
  });

  describe("backfill", () => {
    it("creates scheduled actions for legacy scheduled posts", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");

      const post = await createPost({
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        preSchedulingStatus: ContentStatus.DRAFT,
      });

      const result = await backfillScheduledPosts(now);

      expect(result.created).toBe(1);
      expect(result.skipped).toBe(0);

      const action = await db.scheduledAction.findFirst({
        where: { targetId: post.rootId },
      });

      expect(action).not.toBeNull();
      expect(action?.type).toBe(ScheduledActionType.PUBLISH_POST);
      expect(action?.status).toBe(ScheduledActionStatus.SCHEDULED);
      expect(action?.plannedAt.toISOString()).toBe(scheduledAt.toISOString());

      if (action) {
        trackActionId(action.id);
      }
    });

    it("does not create duplicate actions for already backfilled posts", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");

      const post = await createPost({
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        preSchedulingStatus: ContentStatus.DRAFT,
      });

      await backfillScheduledPosts(now);
      const second = await backfillScheduledPosts(now);

      expect(second.created).toBe(0);
      expect(second.skipped).toBe(1);

      const actions = await db.scheduledAction.findMany({
        where: { targetId: post.rootId },
      });

      expect(actions).toHaveLength(1);
      trackActionId(actions[0]!.id);
    });
  });

  describe("compatibility with Post workflow", () => {
    it("uses the latest saved eligible version at execution time", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");

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
        title: "Updated Title",
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
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now,
      });

      await db.post.update({
        where: { id: versionTwo.id },
        data: { title: "Even Newer Title" },
      });

      await runScheduledActions({ now: runAt });

      const published = await db.post.findUnique({
        where: { id: versionTwo.id },
      });

      expect(published?.status).toBe(ContentStatus.PUBLISHED);
      expect(published?.title).toBe("Even Newer Title");
    });

    it("invalidates the pending scheduled action when published immediately", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt,
        now,
      });

      await publishPost({
        postId: post.id,
        rootId: post.rootId,
        now,
      });

      const laterRun = await runScheduledActions({
        now: new Date("2025-06-01T12:00:00.000Z"),
      });

      expect(laterRun.processed).toBe(0);

      const action = await db.scheduledAction.findFirst({
        where: { targetId: post.rootId },
      });

      expect(action?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    });
  });
});
