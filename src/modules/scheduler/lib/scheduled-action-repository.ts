import "server-only";

import { randomUUID } from "node:crypto";

import { db } from "@/shared/lib/db";
import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
  type ScheduledAction,
} from "@/generated/prisma";

import {
  SCHEDULER_BATCH_SIZE,
  SCHEDULER_LEASE_MS,
  SCHEDULER_MAX_ATTEMPTS,
  type SchedulerTargetType,
} from "../constants";

export interface CreateScheduledActionInput {
  type: ScheduledActionType;
  targetType: SchedulerTargetType;
  targetId: string;
  plannedAt: Date;
  timezone: string;
  idempotencyKey: string;
  maxAttempts?: number;
}

export interface FindDueOptions {
  now?: Date;
  batchSize?: number;
}

export interface ClaimOptions {
  leaseId?: string;
  now?: Date;
  leaseMs?: number;
}

export interface UpdateResultInput {
  status: ScheduledActionStatus;
  attempts?: number;
  retryAt?: Date | null;
  executedAt?: Date | null;
  providerId?: string | null;
  lastError?: string | null;
}

export function createIdempotencyKey(
  type: ScheduledActionType,
  targetType: SchedulerTargetType,
  targetId: string,
): string {
  // Include a random suffix so the same target can be scheduled multiple
  // times over its lifetime while still keeping the key stable across
  // retries of one ScheduledAction.
  return `${type}:${targetType}:${targetId}:${randomUUID()}`;
}

export async function createScheduledAction(
  input: CreateScheduledActionInput,
): Promise<ScheduledAction> {
  return db.scheduledAction.create({
    data: {
      type: input.type,
      targetType: input.targetType,
      targetId: input.targetId,
      plannedAt: input.plannedAt,
      timezone: input.timezone,
      idempotencyKey: input.idempotencyKey,
      maxAttempts: input.maxAttempts ?? SCHEDULER_MAX_ATTEMPTS,
      status: ScheduledActionStatus.SCHEDULED,
    },
  });
}

export async function getScheduledActionById(
  id: string,
): Promise<ScheduledAction | null> {
  return db.scheduledAction.findUnique({ where: { id } });
}

export async function getActiveScheduledActionByTarget(
  targetType: SchedulerTargetType,
  targetId: string,
): Promise<ScheduledAction | null> {
  return db.scheduledAction.findFirst({
    where: {
      targetType,
      targetId,
      status: { in: [ScheduledActionStatus.SCHEDULED, ScheduledActionStatus.RETRY_WAIT] },
    },
  });
}

export async function getActiveScheduledActionByIdempotencyKey(
  idempotencyKey: string,
): Promise<ScheduledAction | null> {
  return db.scheduledAction.findFirst({
    where: {
      idempotencyKey,
      status: { in: [ScheduledActionStatus.SCHEDULED, ScheduledActionStatus.RETRY_WAIT] },
    },
  });
}

export async function getScheduledActionByIdempotencyKey(
  idempotencyKey: string,
): Promise<ScheduledAction | null> {
  return db.scheduledAction.findFirst({
    where: { idempotencyKey },
  });
}

/**
 * Atomically claim a due scheduled action.
 *
 * An action is eligible when:
 * - status is SCHEDULED and plannedAt <= now
 * - status is RETRY_WAIT and retryAt <= now
 * - status is PROCESSING with an expired lease (worker recovery)
 */
export async function claimDueScheduledAction(
  options: ClaimOptions = {},
): Promise<ScheduledAction | null> {
  const leaseId = options.leaseId ?? randomUUID();
  const now = options.now ?? new Date();
  const leaseExpiresAt = new Date(
    now.getTime() + (options.leaseMs ?? SCHEDULER_LEASE_MS),
  );

  const result = await db.$queryRaw<ScheduledAction[]>`
    UPDATE "ScheduledAction"
    SET "status" = 'PROCESSING',
        "leaseId" = ${leaseId},
        "leaseExpiresAt" = ${leaseExpiresAt},
        "updatedAt" = ${now}
    WHERE id = (
      SELECT id FROM "ScheduledAction"
      WHERE (
          ("status" = 'SCHEDULED' AND "plannedAt" <= ${now})
          OR ("status" = 'RETRY_WAIT' AND "retryAt" <= ${now})
          OR ("status" = 'PROCESSING' AND "leaseExpiresAt" <= ${now})
        )
        AND "status" != 'SUCCEEDED'
        AND "status" != 'FAILED'
        AND "status" != 'CANCELED'
      ORDER BY COALESCE("retryAt", "plannedAt") ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING *
  `;

  return result[0] ?? null;
}

export async function findDueScheduledActions(
  options: FindDueOptions = {},
): Promise<ScheduledAction[]> {
  const now = options.now ?? new Date();
  const batchSize = options.batchSize ?? SCHEDULER_BATCH_SIZE;

  return db.$queryRaw<ScheduledAction[]>`
    SELECT * FROM "ScheduledAction"
    WHERE (
        ("status" = 'SCHEDULED' AND "plannedAt" <= ${now})
        OR ("status" = 'RETRY_WAIT' AND "retryAt" <= ${now})
        OR ("status" = 'PROCESSING' AND "leaseExpiresAt" <= ${now})
      )
      AND "status" != 'SUCCEEDED'
      AND "status" != 'FAILED'
      AND "status" != 'CANCELED'
    ORDER BY COALESCE("retryAt", "plannedAt") ASC
    LIMIT ${batchSize}
  `;
}

export async function updateScheduledActionResult(
  id: string,
  input: UpdateResultInput,
): Promise<ScheduledAction> {
  return db.scheduledAction.update({
    where: { id },
    data: {
      status: input.status,
      ...(input.attempts !== undefined && { attempts: input.attempts }),
      ...(input.retryAt !== undefined && { retryAt: input.retryAt }),
      ...(input.executedAt !== undefined && { executedAt: input.executedAt }),
      ...(input.providerId !== undefined && { providerId: input.providerId }),
      ...(input.lastError !== undefined && { lastError: input.lastError }),
      leaseId: null,
      leaseExpiresAt: null,
    },
  });
}

export async function cancelScheduledAction(
  id: string,
  now = new Date(),
): Promise<ScheduledAction> {
  return db.scheduledAction.update({
    where: { id },
    data: {
      status: ScheduledActionStatus.CANCELED,
      canceledAt: now,
      leaseId: null,
      leaseExpiresAt: null,
      retryAt: null,
    },
  });
}

export async function rescheduleScheduledAction(
  id: string,
  plannedAt: Date,
  timezone: string,
  now = new Date(),
): Promise<ScheduledAction> {
  return db.scheduledAction.update({
    where: { id },
    data: {
      plannedAt,
      timezone,
      status: ScheduledActionStatus.SCHEDULED,
      retryAt: null,
      attempts: 0,
      leaseId: null,
      leaseExpiresAt: null,
      lastError: null,
      updatedAt: now,
    },
  });
}

export async function countActiveScheduledActionsByTarget(
  targetType: SchedulerTargetType,
  targetId: string,
): Promise<number> {
  return db.scheduledAction.count({
    where: {
      targetType,
      targetId,
      status: { in: [ScheduledActionStatus.SCHEDULED, ScheduledActionStatus.RETRY_WAIT] },
    },
  });
}

/**
 * Backfill existing scheduled posts into ScheduledAction records.
 *
 * This is idempotent: it skips posts that already have an active scheduled
 * action for their root.
 */
export async function backfillScheduledPosts(
  _now = new Date(),
  batchSize = SCHEDULER_BATCH_SIZE,
): Promise<{ created: number; skipped: number }> {
  const legacyPosts = await db.post.findMany({
    where: {
      status: ContentStatus.SCHEDULED,
      scheduledAt: { not: null },
      rootId: { not: null },
    },
    select: {
      id: true,
      rootId: true,
      scheduledAt: true,
    },
    take: batchSize,
  });

  let created = 0;
  let skipped = 0;

  for (const post of legacyPosts) {
    if (!post.rootId || !post.scheduledAt) {
      skipped++;
      continue;
    }

    const targetType = "POST_ROOT";
    const existing = await db.scheduledAction.findFirst({
      where: {
        type: "PUBLISH_POST",
        targetType,
        targetId: post.rootId,
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await createScheduledAction({
      type: "PUBLISH_POST",
      targetType,
      targetId: post.rootId,
      plannedAt: post.scheduledAt,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      idempotencyKey: createIdempotencyKey(
        "PUBLISH_POST",
        targetType,
        post.rootId,
      ),
      maxAttempts: SCHEDULER_MAX_ATTEMPTS,
    });

    created++;
  }

  return { created, skipped };
}
