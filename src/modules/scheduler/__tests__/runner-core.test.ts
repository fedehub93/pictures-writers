import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import {
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";
import { runScheduledActionsWithHandlers } from "@/modules/scheduler/lib/scheduler-runner";
import {
  createScheduledAction,
  createIdempotencyKey,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import {
  ScheduledActionHandlerError,
  SCHEDULER_TARGET_TYPES,
} from "@/modules/scheduler/constants";

import type { HandlerRegistry } from "@/modules/scheduler/lib/handlers/registry";

describe("scheduler runner core", () => {
  const createdActionIds: string[] = [];

  const trackActionId = (id: string) => {
    createdActionIds.push(id);
  };

  const createAction = async (overrides: {
    plannedAt: Date;
    status?: ScheduledActionStatus;
    retryAt?: Date;
    attempts?: number;
    targetId?: string;
    idempotencyKey?: string;
  }) => {
    const targetId = overrides.targetId ?? randomUUID();
    const action = await createScheduledAction({
      type: ScheduledActionType.PUBLISH_POST,
      targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
      targetId,
      plannedAt: overrides.plannedAt,
      timezone: "UTC",
      idempotencyKey:
        overrides.idempotencyKey ??
        createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          targetId,
        ),
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
          retryAt: overrides.retryAt ?? null,
          attempts: overrides.attempts ?? 0,
        },
      });
    }

    return action;
  };

  beforeEach(async () => {
    await db.scheduledAction.deleteMany({});
  });

  afterEach(async () => {
    await db.scheduledAction.deleteMany({
      where: { id: { in: createdActionIds } },
    });
    createdActionIds.length = 0;
  });

  it("retries transient errors with bounded attempts", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const handler = vi.fn().mockRejectedValue(
      new ScheduledActionHandlerError("provider timeout", true),
    );
    const handlers: HandlerRegistry = {
      PUBLISH_POST: handler,
      SEND_EMAIL: async () => {},
    };

    const action = await createAction({ plannedAt: now });

    const first = await runScheduledActionsWithHandlers(handlers, { now });
    expect(first.processed).toBe(1);
    expect(first.succeeded).toBe(0);
    expect(first.failed).toBe(1);

    const afterFirst = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(afterFirst?.status).toBe(ScheduledActionStatus.RETRY_WAIT);
    expect(afterFirst?.attempts).toBe(1);

    const retryAt = afterFirst?.retryAt;
    expect(retryAt).not.toBeNull();

    const second = await runScheduledActionsWithHandlers(handlers, {
      now: new Date(retryAt!.getTime() + 1000),
    });
    expect(second.processed).toBe(1);
    expect(second.succeeded).toBe(0);
    expect(second.failed).toBe(1);

    const afterSecond = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(afterSecond?.status).toBe(ScheduledActionStatus.RETRY_WAIT);
    expect(afterSecond?.attempts).toBe(2);

    const third = await runScheduledActionsWithHandlers(handlers, {
      now: new Date((afterSecond?.retryAt?.getTime() ?? 0) + 1000),
    });
    expect(third.processed).toBe(1);
    expect(third.succeeded).toBe(0);
    expect(third.failed).toBe(1);

    const afterThird = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    // After max attempts the action becomes terminally FAILED.
    expect(afterThird?.status).toBe(ScheduledActionStatus.FAILED);
    expect(afterThird?.attempts).toBe(3);
  });

  it("applies a non-zero backoff on the first retry", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const handler = vi.fn().mockRejectedValue(
      new ScheduledActionHandlerError("provider timeout", true),
    );
    const handlers: HandlerRegistry = {
      PUBLISH_POST: handler,
      SEND_EMAIL: async () => {},
    };

    const action = await createAction({ plannedAt: now });

    await runScheduledActionsWithHandlers(handlers, { now });

    const updated = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });

    expect(updated?.status).toBe(ScheduledActionStatus.RETRY_WAIT);
    expect(updated?.retryAt!.getTime()).toBeGreaterThanOrEqual(
      now.getTime() + 5 * 60 * 1000,
    );
  });

  it("permanent errors become FAILED without retry", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const handler = vi.fn().mockRejectedValue(
      new ScheduledActionHandlerError("invalid content", false),
    );
    const handlers: HandlerRegistry = {
      PUBLISH_POST: handler,
      SEND_EMAIL: async () => {},
    };

    const action = await createAction({ plannedAt: now });

    const result = await runScheduledActionsWithHandlers(handlers, { now });
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(0);
    expect(result.failed).toBe(1);

    const updated = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(updated?.status).toBe(ScheduledActionStatus.FAILED);
    expect(updated?.attempts).toBe(1);
    expect(updated?.retryAt).toBeNull();
  });

  it("executes a batch of due actions independently", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const handlers: HandlerRegistry = {
      PUBLISH_POST: async () => {},
      SEND_EMAIL: async () => {},
    };

    for (let i = 0; i < 3; i++) {
      await createAction({ plannedAt: now });
    }

    const result = await runScheduledActionsWithHandlers(handlers, {
      now,
      batchSize: 2,
    });

    expect(result.processed).toBe(2);
    expect(result.succeeded).toBe(2);
  });

  it("recovers a PROCESSING action with an expired lease", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const leaseMs = 60 * 1000;
    const handlers: HandlerRegistry = {
      PUBLISH_POST: async () => {},
      SEND_EMAIL: async () => {},
    };

    const action = await createAction({ plannedAt: now });
    await db.scheduledAction.update({
      where: { id: action.id },
      data: {
        status: ScheduledActionStatus.PROCESSING,
        leaseId: "stale-lease",
        leaseExpiresAt: new Date(now.getTime() + leaseMs),
      },
    });

    const beforeRecovery = await runScheduledActionsWithHandlers(handlers, {
      now: new Date(now.getTime() + leaseMs - 1000),
    });
    expect(beforeRecovery.processed).toBe(0);

    const afterRecovery = await runScheduledActionsWithHandlers(handlers, {
      now: new Date(now.getTime() + leaseMs + 1000),
    });
    expect(afterRecovery.processed).toBe(1);
    expect(afterRecovery.succeeded).toBe(1);
  });

  it("records provider identifiers and errors on the action", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const handlers: HandlerRegistry = {
      PUBLISH_POST: async () => {},
      SEND_EMAIL: async () => {},
    };

    const action = await createAction({ plannedAt: now });

    await runScheduledActionsWithHandlers(handlers, { now });

    const updated = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });

    expect(updated?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    expect(updated?.executedAt).not.toBeNull();
    expect(updated?.lastError).toBeNull();
  });
});
