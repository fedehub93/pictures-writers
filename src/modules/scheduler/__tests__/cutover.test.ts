import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";
import { runScheduledActions } from "@/modules/scheduler/lib/scheduler-runner";
import {
  createScheduledAction,
  createIdempotencyKey,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";
import {
  runSchedulerCutoverBackfill,
  verifySchedulerCutover,
} from "@/modules/scheduler/lib/migration";
import { schedulePost, cancelSchedule } from "@/modules/blog/posts/lib/schedule-post";
import { publishPost } from "@/modules/blog/posts/lib/publish-post";
import { emptyTiptapDoc } from "@/modules/blog/posts/lib/__tests__/fixtures";
import { scheduleSingleSend } from "@/modules/mails/single-sends/lib/schedule-single-send";

import * as sendSingleSendModule from "@/modules/mails/single-sends/lib/send-single-send";

describe("scheduler cutover", () => {
  const createdRootIds: string[] = [];
  const createdActionIds: string[] = [];
  const createdSingleSendIds: string[] = [];
  const createdAudienceIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!createdRootIds.includes(rootId)) {
      createdRootIds.push(rootId);
    }
  };

  const trackActionId = (id: string) => {
    createdActionIds.push(id);
  };

  beforeEach(async () => {
    // This file verifies global cutover state, so it owns the whole scheduler
    // tables for the duration of each test (test database only).
    await db.scheduledAction.deleteMany({});
    await db.post.deleteMany({ where: { status: ContentStatus.SCHEDULED } });
    await db.emailSingleSend.deleteMany({});
    await db.emailAudience.deleteMany({});
    createdRootIds.length = 0;
    createdActionIds.length = 0;
    createdSingleSendIds.length = 0;
    createdAudienceIds.length = 0;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    await db.scheduledAction.deleteMany({});
    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
    }
    await db.emailSingleSend.deleteMany({});
    await db.emailAudience.deleteMany({});
    createdRootIds.length = 0;
    createdActionIds.length = 0;
    createdSingleSendIds.length = 0;
    createdAudienceIds.length = 0;
  });

  const createPost = async (
    overrides: Partial<{
      title: string;
      slug: string;
      status: ContentStatus;
      version: number;
      rootId: string;
      isLatest: boolean;
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
        tiptapBodyData: emptyTiptapDoc,
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

  const createLegacyScheduledPost = async (scheduledAt: Date) => {
    const post = await db.post.create({
      data: {
        title: "Legacy scheduled",
        slug: `legacy-${randomUUID()}`,
        version: 1,
        status: ContentStatus.SCHEDULED,
        tiptapBodyData: emptyTiptapDoc,
        scheduledAt,
        preSchedulingStatus: ContentStatus.DRAFT,
      },
    });
    const rootId = post.id;
    await db.post.update({
      where: { id: post.id },
      data: { rootId },
    });
    trackRootId(rootId);
    return rootId;
  };

  const createEmailFixture = async () => {
    const audience = await db.emailAudience.create({
      data: {
        name: "Test Audience",
        externalId: `aud-${randomUUID()}`,
      },
    });
    createdAudienceIds.push(audience.id);

    const singleSend = await db.emailSingleSend.create({
      data: {
        name: "Scheduled Newsletter",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        audiences: { connect: { id: audience.id } },
      },
    });
    createdSingleSendIds.push(singleSend.id);

    return { audience, singleSend };
  };

  const createPublishPostAction = async (
    targetId: string,
    plannedAt: Date,
    status: ScheduledActionStatus = ScheduledActionStatus.SCHEDULED,
  ) => {
    const action = await createScheduledAction({
      type: ScheduledActionType.PUBLISH_POST,
      targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
      targetId,
      plannedAt,
      timezone: "UTC",
      idempotencyKey: createIdempotencyKey(
        ScheduledActionType.PUBLISH_POST,
        SCHEDULER_TARGET_TYPES.POST_ROOT,
        `${targetId}-${randomUUID()}`,
      ),
    });
    if (status !== ScheduledActionStatus.SCHEDULED) {
      await db.scheduledAction.update({
        where: { id: action.id },
        data: { status, active: false },
      });
    }
    trackActionId(action.id);
    return action;
  };

  describe("single operational path", () => {
    it("processes due Post and newsletter actions together in one worker run", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const runAt = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost({ status: ContentStatus.DRAFT });
      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      const { singleSend } = await createEmailFixture();
      await scheduleSingleSend({
        singleSendId: singleSend.id,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      const sendSpy = vi
        .spyOn(sendSingleSendModule, "sendSingleSend")
        .mockResolvedValue({ providerId: "campaign-1" });

      const result = await runScheduledActions({ now: runAt });

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);

      const published = await db.post.findUnique({ where: { id: post.id } });
      expect(published?.status).toBe(ContentStatus.PUBLISHED);

      const emailActions = await db.scheduledAction.findMany({
        where: { targetType: "EMAIL_SINGLE_SEND", targetId: singleSend.id },
      });
      expect(emailActions).toHaveLength(1);
      expect(emailActions[0]?.status).toBe(ScheduledActionStatus.SUCCEEDED);
      expect(emailActions[0]?.providerId).toBe("campaign-1");

      expect(sendSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("mutation consistency", () => {
    it("keeps a canceled Post free of an active ScheduledAction", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const post = await createPost({ status: ContentStatus.DRAFT });

      await schedulePost({
        postId: post.id,
        rootId: post.rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      const canceled = await cancelSchedule({
        postId: post.id,
        rootId: post.rootId,
      });
      expect(canceled.status).toBe(ContentStatus.DRAFT);

      const actions = await db.scheduledAction.findMany({
        where: { targetType: "POST_ROOT", targetId: post.rootId },
      });
      expect(actions).toHaveLength(1);
      expect(actions[0]?.status).toBe(ScheduledActionStatus.CANCELED);
      expect(actions[0]?.active).toBe(false);

      const report = await verifySchedulerCutover();
      expect(report.activeActionsOrphaned).toBe(0);
      expect(report.ok).toBe(true);
    });
  });

  describe("legacy migration", () => {
    it("backfills the whole legacy backlog even when it exceeds one batch", async () => {
      const now = new Date("2025-06-01T10:00:00.000Z");
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");

      for (let i = 0; i < 3; i++) {
        await createLegacyScheduledPost(scheduledAt);
      }

      const first = await runSchedulerCutoverBackfill(now, 2);
      expect(first.created).toBe(3);

      const second = await runSchedulerCutoverBackfill(now, 2);
      expect(second.created).toBe(0);
      expect(second.skipped).toBe(0);
    });

    it("verifies gaps are flagged before backfill and cleared after", async () => {
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      await createLegacyScheduledPost(scheduledAt);

      const before = await verifySchedulerCutover();
      expect(before.legacyScheduledPosts).toBe(1);
      expect(before.legacyScheduledPostsWithoutActiveAction).toBe(1);
      expect(before.ok).toBe(false);

      await runSchedulerCutoverBackfill(new Date("2025-06-01T10:00:00.000Z"));

      const after = await verifySchedulerCutover();
      expect(after.legacyScheduledPosts).toBe(1);
      expect(after.legacyScheduledPostsWithoutActiveAction).toBe(0);
      expect(after.activeActionsOrphaned).toBe(0);
      expect(after.duplicateActiveActions).toBe(0);
      expect(after.ok).toBe(true);
    });

    it("flags orphaned and duplicate active actions", async () => {
      // Orphan: an active action whose latest root version is not SCHEDULED.
      const orphanRoot = await createPost({ status: ContentStatus.DRAFT });
      await createPublishPostAction(
        orphanRoot.rootId,
        new Date("2025-06-01T11:00:00.000Z"),
      );

      const orphanReport = await verifySchedulerCutover();
      expect(orphanReport.activeActionsOrphaned).toBe(1);
      expect(orphanReport.duplicateActiveActions).toBe(0);
      expect(orphanReport.ok).toBe(false);

      // Duplicate: two active actions for the same SCHEDULED root.
      const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
      const duplicateRoot = await createPost({ status: ContentStatus.DRAFT });
      await createPublishPostAction(duplicateRoot.rootId, scheduledAt);
      await createPublishPostAction(duplicateRoot.rootId, scheduledAt);
      await db.post.update({
        where: { id: duplicateRoot.id },
        data: { status: ContentStatus.SCHEDULED, scheduledAt },
      });

      const duplicateReport = await verifySchedulerCutover();
      expect(duplicateReport.duplicateActiveActions).toBe(1);
      expect(duplicateReport.activeActionsOrphaned).toBe(1);
      expect(duplicateReport.ok).toBe(false);
    });
  });

  describe("history preservation", () => {
    it("keeps terminal actions while allowing a new schedule for the same root", async () => {
      const scheduleNow = new Date("2025-06-01T10:00:00.000Z");
      const publishAt = new Date("2025-06-01T12:00:00.000Z");
      const firstPublishAt = new Date("2025-01-01T00:00:00.000Z");

      const versionOne = await createPost({
        status: ContentStatus.DRAFT,
        version: 1,
      });
      const rootId = versionOne.rootId;

      await schedulePost({
        postId: versionOne.id,
        rootId,
        scheduledAt: new Date("2025-06-01T11:00:00.000Z"),
        now: scheduleNow,
      });

      await publishPost({
        postId: versionOne.id,
        rootId,
        now: publishAt,
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

      await schedulePost({
        postId: versionTwo.id,
        rootId,
        scheduledAt: new Date("2025-06-02T12:00:00.000Z"),
        now: new Date("2025-06-01T13:00:00.000Z"),
      });

      const actions = await db.scheduledAction.findMany({
        where: { targetType: "POST_ROOT", targetId: rootId },
        orderBy: { createdAt: "asc" },
      });

      expect(actions).toHaveLength(2);
      expect(actions[0]?.status).toBe(ScheduledActionStatus.SUCCEEDED);
      expect(actions[0]?.active).toBe(false);
      expect(actions[1]?.status).toBe(ScheduledActionStatus.SCHEDULED);
      expect(actions[1]?.active).toBe(true);

      const report = await verifySchedulerCutover();
      expect(report.terminalActionsPreserved).toBe(1);
      expect(report.activeActionsOrphaned).toBe(0);
      expect(report.duplicateActiveActions).toBe(0);
      expect(report.ok).toBe(true);
    });
  });
});