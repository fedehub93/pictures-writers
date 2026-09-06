import "server-only";

import { db } from "@/shared/lib/db";
import {
  Prisma,
  ContentStatus,
  ScheduledActionType,
  type Post,
  type Seo,
} from "@/generated/prisma";

import {
  createScheduledActionTx,
  createIdempotencyKey,
  rescheduleScheduledActionTx,
  cancelScheduledActionTx,
  hasActiveScheduledActionByTargetTx,
  getActiveScheduledActionByTargetTx,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

import { acquireRootLock } from "./lock-root-posts";

export type ScheduledPostResult = Post & {
  seo: Seo | null;
};

export class ScheduledPostError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "INVALID_STATE"
      | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

export interface SchedulePostInput {
  postId: string;
  rootId: string;
  scheduledAt: Date;
  timezone?: string;
  now?: Date;
}

export interface ReschedulePostInput {
  postId: string;
  rootId: string;
  scheduledAt: Date;
  timezone?: string;
  now?: Date;
}

export interface CancelScheduleInput {
  postId: string;
  rootId: string;
}

function assertFutureScheduledAt(scheduledAt: Date, now: Date) {
  if (
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getTime() <= now.getTime()
  ) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "Scheduled time must be in the future",
    );
  }
}

async function loadRootPosts(tx: Prisma.TransactionClient, rootId: string) {
  await acquireRootLock(tx, rootId);

  return tx.post.findMany({
    where: { rootId },
    select: {
      id: true,
      status: true,
      version: true,
      title: true,
      slug: true,
      scheduledAt: true,
      preSchedulingStatus: true,
    },
    orderBy: { id: "asc" },
  });
}

function findTarget(
  posts: Awaited<ReturnType<typeof loadRootPosts>>,
  postId: string,
) {
  const target = posts.find((post) => post.id === postId);

  if (!target) {
    throw new ScheduledPostError("NOT_FOUND", "Post not found");
  }

  if (!target.title || !target.slug) {
    throw new ScheduledPostError("VALIDATION_ERROR", "Missing required fields");
  }

  return target;
}

function assertCurrentVersion(
  posts: Awaited<ReturnType<typeof loadRootPosts>>,
  target: { id: string; version: number },
) {
  const maxVersion = Math.max(...posts.map((post) => post.version));

  if (target.version !== maxVersion) {
    throw new ScheduledPostError(
      "INVALID_STATE",
      "Only the current version can be scheduled",
    );
  }
}

export async function schedulePost({
  postId,
  rootId,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: SchedulePostInput): Promise<ScheduledPostResult> {
  if (!postId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);

  const idempotencyKey = createIdempotencyKey(
    ScheduledActionType.PUBLISH_POST,
    SCHEDULER_TARGET_TYPES.POST_ROOT,
    rootId,
  );

  // The Post state change and the ScheduledAction are written in the same
  // transaction so a scheduling either commits entirely or not at all: no
  // window exists in which the Post is SCHEDULED without a corresponding
  // action, and two concurrent requests cannot create duplicate schedules.
  return db.$transaction(async (tx) => {
    const posts = await loadRootPosts(tx, rootId);
    const target = findTarget(posts, postId);

    assertCurrentVersion(posts, target);

    const activeSchedule = posts.find(
      (post) => post.status === ContentStatus.SCHEDULED,
    );

    if (activeSchedule) {
      throw new ScheduledPostError(
        "CONFLICT",
        "An active schedule already exists for this post",
      );
    }

    const existingAction = await hasActiveScheduledActionByTargetTx(
      tx,
      SCHEDULER_TARGET_TYPES.POST_ROOT,
      rootId,
    );
    if (existingAction) {
      throw new ScheduledPostError(
        "CONFLICT",
        "An active schedule already exists for this post",
      );
    }

    if (
      target.status !== ContentStatus.DRAFT &&
      target.status !== ContentStatus.CHANGED
    ) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only draft or changed posts can be scheduled",
      );
    }

    const scheduledPost = await tx.post.update({
      where: { id: postId },
      data: {
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        preSchedulingStatus: target.status,
      },
      include: { seo: true },
    });

    // Compatibility: the legacy Post fields (status, scheduledAt,
    // preSchedulingStatus) remain synchronized with the operational
    // ScheduledAction so the existing editorial UI keeps working unchanged.
    await createScheduledActionTx(tx, {
      type: ScheduledActionType.PUBLISH_POST,
      targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
      targetId: rootId,
      plannedAt: scheduledAt,
      timezone,
      idempotencyKey,
    });

    return scheduledPost;
  });
}

export async function reschedulePost({
  postId,
  rootId,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: ReschedulePostInput): Promise<ScheduledPostResult> {
  if (!postId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);

  // Reschedule the ScheduledAction in the same transaction as the Post
  // update so the two can never drift apart.
  return db.$transaction(async (tx) => {
    const posts = await loadRootPosts(tx, rootId);
    const target = findTarget(posts, postId);

    if (target.status !== ContentStatus.SCHEDULED) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only scheduled posts can be rescheduled",
      );
    }

    const rescheduledPost = await tx.post.update({
      where: { id: postId },
      data: {
        scheduledAt,
      },
      include: { seo: true },
    });

    const action = await getActiveScheduledActionByTargetTx(
      tx,
      SCHEDULER_TARGET_TYPES.POST_ROOT,
      rootId,
    );
    if (action) {
      await rescheduleScheduledActionTx(
        tx,
        action.id,
        scheduledAt,
        timezone,
        now,
      );
    }

    return rescheduledPost;
  });
}

export async function cancelSchedule({
  postId,
  rootId,
}: CancelScheduleInput): Promise<ScheduledPostResult> {
  if (!postId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  // Cancel the ScheduledAction in the same transaction as the Post state
  // restoration so a canceled Post never keeps an active action behind.
  return db.$transaction(async (tx) => {
    const posts = await loadRootPosts(tx, rootId);
    const target = findTarget(posts, postId);

    if (target.status !== ContentStatus.SCHEDULED) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only scheduled posts can be unscheduled",
      );
    }

    const restoredStatus = target.preSchedulingStatus ?? ContentStatus.DRAFT;

    const restoredPost = await tx.post.update({
      where: { id: postId },
      data: {
        status: restoredStatus,
        scheduledAt: null,
        preSchedulingStatus: null,
      },
      include: { seo: true },
    });

    const action = await getActiveScheduledActionByTargetTx(
      tx,
      SCHEDULER_TARGET_TYPES.POST_ROOT,
      rootId,
    );
    if (action) {
      await cancelScheduledActionTx(tx, action.id);
    }

    return restoredPost;
  });
}
