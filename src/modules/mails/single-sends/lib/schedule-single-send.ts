import "server-only";

import { db } from "@/shared/lib/db";
import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";
import type { Prisma, ScheduledAction } from "@/generated/prisma";

import {
  createScheduledActionTx,
  createIdempotencyKey,
  rescheduleScheduledAction,
  cancelScheduledAction,
  getActiveScheduledActionByTarget,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

export type SingleSendScheduleResult = ScheduledAction;

export class SingleSendScheduleError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "VALIDATION_ERROR" | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

export interface ScheduleSingleSendInput {
  singleSendId: string;
  scheduledAt: Date;
  timezone?: string;
  now?: Date;
}

export interface RescheduleSingleSendInput {
  singleSendId: string;
  scheduledAt: Date;
  timezone?: string;
  now?: Date;
}

export interface CancelSingleSendScheduleInput {
  singleSendId: string;
}

function assertFutureScheduledAt(scheduledAt: Date, now: Date) {
  if (
    Number.isNaN(scheduledAt.getTime()) ||
    scheduledAt.getTime() <= now.getTime()
  ) {
    throw new SingleSendScheduleError(
      "VALIDATION_ERROR",
      "Scheduled time must be in the future",
    );
  }
}

function assertFiveMinuteInterval(scheduledAt: Date) {
  if (
    scheduledAt.getSeconds() !== 0 ||
    scheduledAt.getMilliseconds() !== 0 ||
    scheduledAt.getMinutes() % 5 !== 0
  ) {
    throw new SingleSendScheduleError(
      "VALIDATION_ERROR",
      "Scheduled time must be in five-minute intervals",
    );
  }
}

async function findActiveAction(singleSendId: string) {
  return getActiveScheduledActionByTarget(
    SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
    singleSendId,
  );
}

async function findActiveActionTx(
  tx: Prisma.TransactionClient,
  singleSendId: string,
) {
  return tx.scheduledAction.findFirst({
    where: {
      targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
      targetId: singleSendId,
      active: true,
      status: {
        in: [ScheduledActionStatus.SCHEDULED, ScheduledActionStatus.RETRY_WAIT],
      },
    },
  });
}

export async function scheduleSingleSend({
  singleSendId,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: ScheduleSingleSendInput): Promise<SingleSendScheduleResult> {
  if (!singleSendId) {
    throw new SingleSendScheduleError(
      "VALIDATION_ERROR",
      "singleSendId is required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);
  assertFiveMinuteInterval(scheduledAt);

  const idempotencyKey = createIdempotencyKey(
    ScheduledActionType.SEND_EMAIL,
    SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
    singleSendId,
  );

  // Serialize scheduling per target: lock the single send row, check for an
  // existing active action, and create the new one in the same transaction so
  // concurrent requests cannot create two active SEND_EMAIL actions.
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "EmailSingleSend" WHERE id = ${singleSendId} FOR UPDATE
    `;

    if (locked.length === 0) {
      throw new SingleSendScheduleError("NOT_FOUND", "Single send not found");
    }

    const existing = await findActiveActionTx(tx, singleSendId);

    if (existing) {
      throw new SingleSendScheduleError(
        "CONFLICT",
        "An active schedule already exists for this single send",
      );
    }

    return createScheduledActionTx(tx, {
      type: ScheduledActionType.SEND_EMAIL,
      targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
      targetId: singleSendId,
      plannedAt: scheduledAt,
      timezone,
      idempotencyKey,
    });
  });
}

export async function rescheduleSingleSend({
  singleSendId,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  now = new Date(),
}: RescheduleSingleSendInput): Promise<SingleSendScheduleResult> {
  if (!singleSendId) {
    throw new SingleSendScheduleError(
      "VALIDATION_ERROR",
      "singleSendId is required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);
  assertFiveMinuteInterval(scheduledAt);

  const action = await findActiveAction(singleSendId);

  if (!action) {
    throw new SingleSendScheduleError(
      "NOT_FOUND",
      "No active schedule found for this single send",
    );
  }

  return rescheduleScheduledAction(action.id, scheduledAt, timezone, now);
}

export async function cancelScheduledSingleSend({
  singleSendId,
}: CancelSingleSendScheduleInput): Promise<SingleSendScheduleResult> {
  if (!singleSendId) {
    throw new SingleSendScheduleError(
      "VALIDATION_ERROR",
      "singleSendId is required",
    );
  }

  const action = await findActiveAction(singleSendId);

  if (!action) {
    throw new SingleSendScheduleError(
      "NOT_FOUND",
      "No active schedule found for this single send",
    );
  }

  return cancelScheduledAction(action.id);
}
