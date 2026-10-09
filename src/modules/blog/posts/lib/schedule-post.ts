import "server-only";

import { db } from "@/shared/lib/db";
import {
  Prisma,
  ContentStatus,
  ScheduledActionType,
  type PostVersion,
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

export type ScheduledPostResult = PostVersion & {
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
  versionId: string;
  rootId: string;
  scheduledAt: Date;
  timezone?: string;
  now?: Date;
}

export interface ReschedulePostInput {
  versionId: string;
  rootId: string;
  scheduledAt: Date;
  timezone?: string;
  now?: Date;
}

export interface CancelScheduleInput {
  versionId: string;
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

interface RootPointer {
  id: string;
  currentVersionId: string | null;
}

/**
 * Lock the `PostRoot` and read its version pointers. Every scheduling mutation
 * goes through here so scheduling serializes with publish/unpublish/edit on the
 * same row, exactly like the publication workflow.
 */
async function lockRoot(
  tx: Prisma.TransactionClient,
  rootId: string,
): Promise<RootPointer> {
  await acquireRootLock(tx, rootId);

  const root = await tx.postRoot.findUnique({
    where: { id: rootId },
    select: { id: true, currentVersionId: true },
  });

  if (!root) {
    throw new ScheduledPostError("NOT_FOUND", "Post not found");
  }

  return root;
}

async function loadTargetVersion(
  tx: Prisma.TransactionClient,
  rootId: string,
  versionId: string,
): Promise<PostVersion & { seo: Seo | null }> {
  const version = await tx.postVersion.findUnique({
    where: { id: versionId },
    include: { seo: true },
  });

  if (!version || version.rootId !== rootId) {
    throw new ScheduledPostError("NOT_FOUND", "Post not found");
  }

  return version;
}

function assertCurrentVersion(root: RootPointer, versionId: string) {
  if (root.currentVersionId !== versionId) {
    throw new ScheduledPostError(
      "INVALID_STATE",
      "Only the current version can be scheduled",
    );
  }
}

/**
 * Move the current version of a root to `SCHEDULED` and create the
 * `ScheduledAction` that will publish it. Both writes happen under the root
 * lock and in one transaction, so a schedule can never exist without its
 * action (or vice versa) and two concurrent requests cannot double-schedule.
 * The action targets the `PostRoot`, not the version: the worker resolves the
 * scheduled version through the root at execution time.
 */
export async function schedulePost({
  versionId,
  rootId,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: SchedulePostInput): Promise<ScheduledPostResult> {
  if (!versionId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "versionId and rootId are required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);

  const idempotencyKey = createIdempotencyKey(
    ScheduledActionType.PUBLISH_POST,
    SCHEDULER_TARGET_TYPES.POST_ROOT,
    rootId,
  );

  return db.$transaction(async (tx) => {
    const root = await lockRoot(tx, rootId);
    const target = await loadTargetVersion(tx, rootId, versionId);

    assertCurrentVersion(root, versionId);

    if (!target.title) {
      throw new ScheduledPostError(
        "VALIDATION_ERROR",
        "Missing required fields",
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

    const scheduled = await tx.postVersion.update({
      where: { id: versionId },
      data: {
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        preSchedulingStatus: target.status,
      },
      include: { seo: true },
    });

    await createScheduledActionTx(tx, {
      type: ScheduledActionType.PUBLISH_POST,
      targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
      targetId: rootId,
      plannedAt: scheduledAt,
      timezone,
      idempotencyKey,
    });

    return scheduled;
  });
}

/**
 * Move the scheduled instant of the current version and its action together.
 * Both updates share one transaction and the root lock so the version and the
 * `ScheduledAction` can never drift apart.
 */
export async function reschedulePost({
  versionId,
  rootId,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: ReschedulePostInput): Promise<ScheduledPostResult> {
  if (!versionId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "versionId and rootId are required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);

  return db.$transaction(async (tx) => {
    await lockRoot(tx, rootId);
    const target = await loadTargetVersion(tx, rootId, versionId);

    if (target.status !== ContentStatus.SCHEDULED) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only scheduled posts can be rescheduled",
      );
    }

    const rescheduled = await tx.postVersion.update({
      where: { id: versionId },
      data: { scheduledAt },
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

    return rescheduled;
  });
}

/**
 * Restore the pre-scheduling status of the current version and cancel its
 * action in the same transaction, so a canceled post never keeps an active
 * schedule behind.
 */
export async function cancelSchedule({
  versionId,
  rootId,
}: CancelScheduleInput): Promise<ScheduledPostResult> {
  if (!versionId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "versionId and rootId are required",
    );
  }

  return db.$transaction(async (tx) => {
    await lockRoot(tx, rootId);
    const target = await loadTargetVersion(tx, rootId, versionId);

    if (target.status !== ContentStatus.SCHEDULED) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only scheduled posts can be unscheduled",
      );
    }

    const restoredStatus = target.preSchedulingStatus ?? ContentStatus.DRAFT;

    const restored = await tx.postVersion.update({
      where: { id: versionId },
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

    return restored;
  });
}
