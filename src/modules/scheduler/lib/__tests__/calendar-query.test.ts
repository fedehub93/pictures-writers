import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";

import type { CalendarEventStatus } from "../../types";

import {
  createScheduledAction,
  createIdempotencyKey,
} from "../scheduled-action-repository";
import {
  SCHEDULER_TARGET_TYPES,
  type SchedulerTargetType,
} from "../../constants";
import { getCalendarEvents } from "../calendar-query";

describe("calendar query", () => {
  const createdRootIds: string[] = [];
  const createdActionIds: string[] = [];
  const createdEmailIds: string[] = [];

  const trackRootId = (rootId: string) => {
    if (!createdRootIds.includes(rootId)) {
      createdRootIds.push(rootId);
    }
  };

  const trackActionId = (id: string) => {
    createdActionIds.push(id);
  };

  const trackEmailId = (id: string) => {
    createdEmailIds.push(id);
  };

  const createPost = async (
    overrides: Partial<{
      title: string;
      slug: string;
      status: ContentStatus;
      version: number;
      rootId: string;
      scheduledAt: Date;
      publishedAt: Date;
      firstPublishedAt: Date;
    }> = {},
  ) => {
    const explicitRootId = overrides.rootId;
    const post = await db.post.create({
      data: {
        title: "Test Post",
        slug: `test-post-${randomUUID().slice(0, 8)}`,
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

  const createEmailSingleSend = async (name = "Test Newsletter") => {
    const email = await db.emailSingleSend.create({
      data: { name },
    });
    trackEmailId(email.id);
    return email;
  };

  const createAction = async (overrides: {
    type?: ScheduledActionType;
    targetType?: SchedulerTargetType;
    targetId: string;
    plannedAt: Date;
    status?: ScheduledActionStatus;
    executedAt?: Date | null;
    timezone?: string;
  }) => {
    const type = overrides.type ?? ScheduledActionType.PUBLISH_POST;
    const targetType = overrides.targetType ?? SCHEDULER_TARGET_TYPES.POST_ROOT;
    const action = await createScheduledAction({
      type,
      targetType,
      targetId: overrides.targetId,
      plannedAt: overrides.plannedAt,
      timezone: overrides.timezone ?? "UTC",
      idempotencyKey: createIdempotencyKey(type, targetType, overrides.targetId),
    });
    trackActionId(action.id);

    if (
      overrides.status &&
      overrides.status !== ScheduledActionStatus.SCHEDULED
    ) {
      await db.scheduledAction.update({
        where: { id: action.id },
        data: {
          status: overrides.status,
          executedAt: overrides.executedAt ?? null,
        },
      });
    }

    return action;
  };

  beforeEach(async () => {
    // Other test files may leave rows behind; start every calendar test
    // from a clean state so assertions are not affected by leftovers.
    await db.scheduledAction.deleteMany({});
    await db.emailSingleSend.deleteMany({});
    await db.post.deleteMany({});
    createdActionIds.length = 0;
    createdEmailIds.length = 0;
    createdRootIds.length = 0;
  });

  afterEach(async () => {
    if (createdActionIds.length > 0) {
      await db.scheduledAction.deleteMany({
        where: { id: { in: createdActionIds } },
      });
      createdActionIds.length = 0;
    }

    if (createdEmailIds.length > 0) {
      await db.emailSingleSend.deleteMany({
        where: { id: { in: createdEmailIds } },
      });
      createdEmailIds.length = 0;
    }

    if (createdRootIds.length > 0) {
      await db.post.deleteMany({
        where: { rootId: { in: createdRootIds } },
      });
      createdRootIds.length = 0;
    }
  });

  describe("range boundaries", () => {
    it("includes events at the start boundary and excludes events at the end boundary", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const atStart = await createPost();
      await createAction({
        targetId: atStart.rootId,
        plannedAt: from,
      });

      const atEnd = await createPost();
      await createAction({
        targetId: atEnd.rootId,
        plannedAt: to,
      });

      const events = await getCalendarEvents({ from, to });
      const rootIds = events.map((event) => event.targetId);

      expect(rootIds).toContain(atStart.rootId);
      expect(rootIds).not.toContain(atEnd.rootId);
    });

    it("includes historical events inside [from, to) by actual execution time", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");
      const executedAt = new Date("2025-06-01T12:00:00.000Z");

      const post = await createPost();
      await createAction({
        targetId: post.rootId,
        plannedAt: new Date("2025-06-01T10:00:00.000Z"),
        status: ScheduledActionStatus.SUCCEEDED,
        executedAt,
      });

      const events = await getCalendarEvents({ from, to });
      expect(events).toHaveLength(1);
      expect(events[0]?.start.toISOString()).toBe(executedAt.toISOString());
    });
  });

  describe("operational statuses", () => {
    it("returns scheduled, succeeded, failed and canceled actions", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const scheduled = await createPost();
      await createAction({ targetId: scheduled.rootId, plannedAt: from });

      const succeeded = await createPost();
      await createAction({
        targetId: succeeded.rootId,
        plannedAt: from,
        status: ScheduledActionStatus.SUCCEEDED,
        executedAt: from,
      });

      const failed = await createPost();
      await createAction({
        targetId: failed.rootId,
        plannedAt: from,
        status: ScheduledActionStatus.FAILED,
        executedAt: from,
      });

      const canceled = await createPost();
      await createAction({
        targetId: canceled.rootId,
        plannedAt: from,
        status: ScheduledActionStatus.CANCELED,
      });

      const events = await getCalendarEvents({ from, to });
      const statuses = events.map((event) => event.status).sort();

      expect(events).toHaveLength(4);
      expect(statuses).toEqual([
        ScheduledActionStatus.CANCELED,
        ScheduledActionStatus.FAILED,
        ScheduledActionStatus.SCHEDULED,
        ScheduledActionStatus.SUCCEEDED,
      ]);
    });

    it("marks overdue scheduled actions", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const post = await createPost();
      await createAction({
        targetId: post.rootId,
        plannedAt: new Date("2025-06-01T01:00:00.000Z"),
      });

      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T12:00:00.000Z"));

      try {
        const events = await getCalendarEvents({ from, to });
        expect(events[0]?.overdue).toBe(true);
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe("manual publication history", () => {
    it("includes manually published posts when no scheduler action exists", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");
      const publishedAt = new Date("2025-06-01T14:00:00.000Z");

      const post = await createPost({
        status: ContentStatus.PUBLISHED,
        publishedAt,
        firstPublishedAt: publishedAt,
      });

      const events = await getCalendarEvents({ from, to });

      expect(events).toHaveLength(1);
      expect(events[0]?.status).toBe("PUBLISHED");
      expect(events[0]?.targetId).toBe(post.rootId);
    });

    it("does not show scheduler-published posts twice", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");
      const publishedAt = new Date("2025-06-01T14:00:00.000Z");

      const post = await createPost({
        status: ContentStatus.PUBLISHED,
        publishedAt,
        firstPublishedAt: publishedAt,
      });

      await createAction({
        targetId: post.rootId,
        plannedAt: new Date("2025-06-01T13:00:00.000Z"),
        status: ScheduledActionStatus.SUCCEEDED,
        executedAt: publishedAt,
      });

      const events = await getCalendarEvents({ from, to });

      expect(events).toHaveLength(1);
      expect(events[0]?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    });
  });

  describe("filters", () => {
    it("filters by action type", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const post = await createPost();
      await createAction({ targetId: post.rootId, plannedAt: from });

      const email = await createEmailSingleSend();
      await createAction({
        type: ScheduledActionType.SEND_EMAIL,
        targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
        targetId: email.id,
        plannedAt: from,
      });

      const postOnly = await getCalendarEvents({
        from,
        to,
        actionTypes: [ScheduledActionType.PUBLISH_POST],
      });
      expect(postOnly).toHaveLength(1);
      expect(postOnly[0]?.type).toBe(ScheduledActionType.PUBLISH_POST);

      const emailOnly = await getCalendarEvents({
        from,
        to,
        actionTypes: [ScheduledActionType.SEND_EMAIL],
      });
      expect(emailOnly).toHaveLength(1);
      expect(emailOnly[0]?.type).toBe(ScheduledActionType.SEND_EMAIL);
    });

    it("filters by operational status", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const scheduled = await createPost();
      await createAction({ targetId: scheduled.rootId, plannedAt: from });

      const succeeded = await createPost();
      await createAction({
        targetId: succeeded.rootId,
        plannedAt: from,
        status: ScheduledActionStatus.SUCCEEDED,
        executedAt: from,
      });

      const scheduledOnly = await getCalendarEvents({
        from,
        to,
        statuses: [ScheduledActionStatus.SCHEDULED],
      });
      expect(scheduledOnly).toHaveLength(1);
      expect(scheduledOnly[0]?.status).toBe(ScheduledActionStatus.SCHEDULED);

      const succeededOnly = await getCalendarEvents({
        from,
        to,
        statuses: [ScheduledActionStatus.SUCCEEDED],
      });
      expect(succeededOnly).toHaveLength(1);
      expect(succeededOnly[0]?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    });

    it("filters by the synthetic PUBLISHED status", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const manualPost = await createPost({
        status: ContentStatus.PUBLISHED,
        publishedAt: from,
        firstPublishedAt: from,
      });

      const scheduledPost = await createPost();
      await createAction({ targetId: scheduledPost.rootId, plannedAt: from });

      const publishedOnly = await getCalendarEvents({
        from,
        to,
        statuses: ["PUBLISHED" as CalendarEventStatus],
      });

      expect(publishedOnly).toHaveLength(1);
      expect(publishedOnly[0]?.status).toBe("PUBLISHED");
      expect(publishedOnly[0]?.targetId).toBe(manualPost.rootId);
    });

    it("combines action type and status filters", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const scheduledPost = await createPost();
      await createAction({
        targetId: scheduledPost.rootId,
        plannedAt: from,
      });

      const succeededPost = await createPost();
      await createAction({
        targetId: succeededPost.rootId,
        plannedAt: from,
        status: ScheduledActionStatus.SUCCEEDED,
        executedAt: from,
      });

      const events = await getCalendarEvents({
        from,
        to,
        actionTypes: [ScheduledActionType.PUBLISH_POST],
        statuses: [ScheduledActionStatus.SUCCEEDED],
      });

      expect(events).toHaveLength(1);
      expect(events[0]?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    });
  });

  describe("pagination", () => {
    it("returns more events than the old post page size", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");
      const count = 15;

      for (let i = 0; i < count; i++) {
        const post = await createPost({
          slug: `bulk-post-${i}`,
        });
        await createAction({
          targetId: post.rootId,
          plannedAt: new Date(from.getTime() + i * 60_000),
        });
      }

      const events = await getCalendarEvents({ from, to });
      expect(events).toHaveLength(count);
    });
  });

  describe("event metadata", () => {
    it("resolves post titles for publish actions", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const post = await createPost({ title: "My Editorial Post" });
      await createAction({ targetId: post.rootId, plannedAt: from });

      const events = await getCalendarEvents({ from, to });
      expect(events[0]?.title).toBe("My Editorial Post");
      expect(events[0]?.url).toBe(`/admin/posts/${post.rootId}`);
    });

    it("resolves newsletter names for email actions", async () => {
      const from = new Date("2025-06-01T00:00:00.000Z");
      const to = new Date("2025-06-02T00:00:00.000Z");

      const email = await createEmailSingleSend("Weekly Newsletter");
      await createAction({
        type: ScheduledActionType.SEND_EMAIL,
        targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
        targetId: email.id,
        plannedAt: from,
      });

      const events = await getCalendarEvents({ from, to });
      expect(events[0]?.title).toBe("Weekly Newsletter");
      expect(events[0]?.url).toBe(`/admin/mails/single-sends/${email.id}`);
    });
  });
});
