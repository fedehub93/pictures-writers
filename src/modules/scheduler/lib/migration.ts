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
 * One-time operational migration used at cutover: materialize every legacy
 * scheduled Post (status SCHEDULED + scheduledAt) as an active
 * ScheduledAction. Idempotent — safe to run repeatedly — and loops until the
 * legacy backlog is exhausted.
 *
 * The runtime cron does not depend on this: after the cutover the common
 * worker is the only processing path. This exists so operators can bring the
 * legacy rows forward and then verify with `verifySchedulerCutover` before the
 * legacy Post fields are eventually removed.
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
  legacyScheduledPosts: number;
  legacyScheduledPostsWithoutActiveAction: number;
  activeActionsOrphaned: number;
  duplicateActiveActions: number;
  terminalActionsPreserved: number;
  ok: boolean;
}

/**
 * Read-only verification of the scheduler cutover state.
 *
 * Flags the gaps that must be absent before the legacy Post scheduling fields
 * can be removed:
 * - legacy SCHEDULED Posts that are not backed by an active action;
 * - active PUBLISH_POST actions whose latest root version is not SCHEDULED;
 * - two or more active actions for the same Post root.
 *
 * Also reports the number of preserved terminal actions (history).
 */
export async function verifySchedulerCutover(): Promise<SchedulerCutoverReport> {
  const scheduled = ContentStatus.SCHEDULED;

  const legacyPosts = await db.post.findMany({
    where: {
      status: scheduled,
      scheduledAt: { not: null },
      rootId: { not: null },
    },
    select: { rootId: true },
  });

  // Only pending (not yet claimed) actions are audited for incoherence. An
  // action being executed (PROCESSING) has just been claimed by the worker:
  // while it runs, the root is still SCHEDULED until the publication
  // transaction commits, and after it commits the action is terminal. Auditing
  // in-flight actions would flag legitimate concurrent runs as orphans.
  const pendingActions = await db.scheduledAction.findMany({
    where: {
      type: ScheduledActionType.PUBLISH_POST,
      targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
      status: { in: PENDING_ACTION_STATUSES },
    },
    select: { targetId: true },
  });

  const activeTargets = new Set(pendingActions.map((action) => action.targetId));

  const legacyScheduledPostsWithoutActiveAction = legacyPosts.filter(
    (post) => !post.rootId || !activeTargets.has(post.rootId),
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
    const postsByRoot = await db.post.findMany({
      where: { rootId: { in: [...activeTargets] } },
      select: { rootId: true, version: true, status: true },
    });

    for (const targetId of activeTargets) {
      const versions = postsByRoot.filter((post) => post.rootId === targetId);
      const latest = versions.reduce<
        (typeof versions)[number] | undefined
      >((max, post) => (!max || post.version > max.version ? post : max), undefined);

      if (!latest || latest.status !== scheduled) {
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
    legacyScheduledPosts: legacyPosts.length,
    legacyScheduledPostsWithoutActiveAction,
    activeActionsOrphaned,
    duplicateActiveActions,
    terminalActionsPreserved,
    ok:
      legacyScheduledPostsWithoutActiveAction === 0 &&
      activeActionsOrphaned === 0 &&
      duplicateActiveActions === 0,
  };
}