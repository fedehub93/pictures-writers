import "server-only";

import { db } from "@/shared/lib/db";
import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";

import { SCHEDULER_BATCH_SIZE, SCHEDULER_TARGET_TYPES } from "../constants";
import {
  backfillScheduledPosts,
  PENDING_ACTION_STATUSES,
} from "./scheduled-action-repository";

export interface SchedulerCutoverBackfillResult {
  created: number;
  skipped: number;
}

/**
 * One-time operational migration used at cutover: materialize every scheduled
 * Post version (status SCHEDULED + scheduledAt) as an active ScheduledAction.
 * Idempotent — safe to run repeatedly — and loops until the backlog is
 * exhausted.
 *
 * The runtime cron does not depend on this: the common worker is the only
 * processing path. This exists so operators can bring rows created before the
 * scheduler cutover forward and then verify with `verifySchedulerCutover`.
 */
export async function runSchedulerCutoverBackfill(
  now = new Date(),
  batchSize = SCHEDULER_BATCH_SIZE,
): Promise<SchedulerCutoverBackfillResult> {
  let created = 0;
  let skipped = 0;

  for (;;) {
    const batch = await backfillScheduledPosts(now, batchSize);
    created += batch.created;
    skipped += batch.skipped;
    if (batch.created === 0) {
      break;
    }
  }

  return { created, skipped };
}

export interface SchedulerCutoverReport {
  scheduledVersions: number;
  scheduledVersionsWithoutActiveAction: number;
  activeActionsOrphaned: number;
  duplicateActiveActions: number;
  terminalActionsPreserved: number;
  ok: boolean;
}

/**
 * Read-only verification of the scheduler cutover state.
 *
 * Flags the gaps that must be absent for scheduling to be coherent:
 * - scheduled Post versions that are not backed by an active action;
 * - active PUBLISH_POST actions whose root's current version is not SCHEDULED;
 * - two or more active actions for the same Post root.
 *
 * Also reports the number of preserved terminal actions (history).
 */
export async function verifySchedulerCutover(): Promise<SchedulerCutoverReport> {
  const scheduled = ContentStatus.SCHEDULED;

  const scheduledRoots = await db.postRoot.findMany({
    where: {
      currentVersion: {
        status: scheduled,
        scheduledAt: { not: null },
      },
    },
    select: { id: true },
  });

  // Only pending (not yet claimed) actions are audited for incoherence. An
  // action being executed (PROCESSING) has just been claimed by the worker:
  // while it runs, the root's current version is still SCHEDULED until the
  // publication transaction commits, and after it commits the action is
  // terminal. Auditing in-flight actions would flag legitimate concurrent runs
  // as orphans.
  const pendingActions = await db.scheduledAction.findMany({
    where: {
      type: ScheduledActionType.PUBLISH_POST,
      targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
      status: { in: PENDING_ACTION_STATUSES },
    },
    select: { targetId: true },
  });

  const activeTargets = new Set(pendingActions.map((action) => action.targetId));

  const scheduledVersionsWithoutActiveAction = scheduledRoots.filter(
    (root) => !activeTargets.has(root.id),
  ).length;

  const targetCount = new Map<string, number>();
  for (const action of pendingActions) {
    targetCount.set(
      action.targetId,
      (targetCount.get(action.targetId) ?? 0) + 1,
    );
  }
  const duplicateActiveActions = [...targetCount.values()].filter(
    (count) => count > 1,
  ).length;

  let activeActionsOrphaned = 0;
  if (activeTargets.size > 0) {
    const roots = await db.postRoot.findMany({
      where: { id: { in: [...activeTargets] } },
      select: {
        id: true,
        currentVersion: { select: { status: true } },
      },
    });

    for (const targetId of activeTargets) {
      const root = roots.find((candidate) => candidate.id === targetId);
      if (!root || root.currentVersion?.status !== scheduled) {
        activeActionsOrphaned++;
      }
    }
  }

  const terminalActionsPreserved = await db.scheduledAction.count({
    where: {
      status: {
        in: [
          ScheduledActionStatus.SUCCEEDED,
          ScheduledActionStatus.FAILED,
          ScheduledActionStatus.CANCELED,
        ],
      },
    },
  });

  return {
    scheduledVersions: scheduledRoots.length,
    scheduledVersionsWithoutActiveAction,
    activeActionsOrphaned,
    duplicateActiveActions,
    terminalActionsPreserved,
    ok:
      scheduledVersionsWithoutActiveAction === 0 &&
      activeActionsOrphaned === 0 &&
      duplicateActiveActions === 0,
  };
}
