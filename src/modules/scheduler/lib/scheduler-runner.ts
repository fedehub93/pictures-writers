import "server-only";

import { randomUUID } from "node:crypto";

import { ScheduledActionStatus } from "@/generated/prisma";
import type { ScheduledAction, ScheduledActionType } from "@/generated/prisma";

import {
  SCHEDULER_BATCH_SIZE,
  SCHEDULER_LEASE_MS,
  SCHEDULER_MAX_ATTEMPTS,
  SCHEDULER_RETRY_DELAY_MS,
  ScheduledActionHandlerError,
} from "../constants";

import {
  claimDueScheduledAction,
  updateScheduledActionResult,
  findDueScheduledActions,
} from "./scheduled-action-repository";
import { getHandler, type ScheduledActionHandler } from "./handlers/registry";

export interface RunScheduledActionsInput {
  now?: Date;
  batchSize?: number;
  leaseMs?: number;
}

export interface RunScheduledActionsResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  details: Array<{
    actionId: string;
    type: string;
    targetId: string;
    status: "succeeded" | "failed" | "skipped" | "retry_wait";
    error?: string;
  }>;
}

export type HandlerRegistry = Record<ScheduledActionType, ScheduledActionHandler>;

function computeRetryAt(action: ScheduledAction, now: Date): Date {
  const delay = SCHEDULER_RETRY_DELAY_MS;
  return new Date(now.getTime() + delay * (action.attempts + 1));
}

async function executeAction(
  action: ScheduledAction,
  leaseId: string,
  now: Date,
  handler: ScheduledActionHandler,
): Promise<{
  status: "succeeded" | "failed" | "skipped" | "retry_wait";
  error?: string;
}> {
  if (action.leaseId !== leaseId) {
    return { status: "skipped", error: "Lease lost before execution" };
  }

  try {
    await handler(action, { now });

    await updateScheduledActionResult(action.id, {
      status: ScheduledActionStatus.SUCCEEDED,
      attempts: action.attempts + 1,
      executedAt: now,
      retryAt: null,
      lastError: null,
    });

    return { status: "succeeded" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown handler error";

    const transient =
      error instanceof ScheduledActionHandlerError && error.transient;
    const canRetry =
      transient &&
      action.attempts + 1 < (action.maxAttempts ?? SCHEDULER_MAX_ATTEMPTS);

    if (canRetry) {
      await updateScheduledActionResult(action.id, {
        status: ScheduledActionStatus.RETRY_WAIT,
        attempts: action.attempts + 1,
        retryAt: computeRetryAt(action, now),
        executedAt: null,
        lastError: message,
      });
      return { status: "retry_wait", error: message };
    }

    await updateScheduledActionResult(action.id, {
      status: ScheduledActionStatus.FAILED,
      attempts: action.attempts + 1,
      executedAt: now,
      retryAt: null,
      lastError: message,
    });

    return { status: "failed", error: message };
  }
}

/**
 * Run the scheduler worker with an explicit handler registry.
 *
 * Each action is claimed atomically and executed independently. One failure
 * does not prevent later actions from being processed.
 */
export async function runScheduledActionsWithHandlers(
  handlers: HandlerRegistry,
  {
    now = new Date(),
    batchSize = SCHEDULER_BATCH_SIZE,
    leaseMs = SCHEDULER_LEASE_MS,
  }: RunScheduledActionsInput = {},
): Promise<RunScheduledActionsResult> {
  const result: RunScheduledActionsResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  // Peek first to avoid issuing leases when the batch is empty; this also
  // provides a bounded view of the work to be done.
  const due = await findDueScheduledActions({ now, batchSize });
  if (due.length === 0) {
    return result;
  }

  for (let i = 0; i < due.length; i++) {
    const leaseId = randomUUID();
    const action = await claimDueScheduledAction({
      leaseId,
      now,
      leaseMs,
    });

    if (!action) {
      // The action was claimed by another worker between peek and claim.
      continue;
    }

    const handler = handlers[action.type];
    if (!handler) {
      await updateScheduledActionResult(action.id, {
        status: ScheduledActionStatus.FAILED,
        attempts: action.attempts + 1,
        executedAt: now,
        lastError: `No handler registered for action type ${action.type}`,
      });
      result.processed++;
      result.failed++;
      result.details.push({
        actionId: action.id,
        type: action.type,
        targetId: action.targetId,
        status: "failed",
        error: `No handler registered for action type ${action.type}`,
      });
      continue;
    }

    result.processed++;

    const execution = await executeAction(action, leaseId, now, handler);

    switch (execution.status) {
      case "succeeded":
        result.succeeded++;
        break;
      case "retry_wait":
        result.failed++;
        break;
      case "failed":
        result.failed++;
        break;
      case "skipped":
        result.skipped++;
        break;
    }

    result.details.push({
      actionId: action.id,
      type: action.type,
      targetId: action.targetId,
      status: execution.status,
      error: execution.error,
    });
  }

  return result;
}

/**
 * Run the scheduler worker using the default handler registry.
 */
export async function runScheduledActions(
  input: RunScheduledActionsInput = {},
): Promise<RunScheduledActionsResult> {
  const handlers: HandlerRegistry = {
    PUBLISH_POST: getHandler("PUBLISH_POST"),
    SEND_EMAIL: getHandler("SEND_EMAIL"),
  };

  return runScheduledActionsWithHandlers(handlers, input);
}
