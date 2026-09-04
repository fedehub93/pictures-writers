import "server-only";

import { ScheduledActionStatus } from "@/generated/prisma";
import { runScheduledActions } from "@/modules/scheduler/lib/scheduler-runner";
import { backfillScheduledPosts } from "@/modules/scheduler/lib/scheduled-action-repository";

import { SCHEDULED_PUBLICATION_BATCH } from "../constants";

export interface PublishDuePostsInput {
  now?: Date;
  batchSize?: number;
}

export interface PublishDuePostsResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  details: Array<{
    postId: string;
    rootId: string | null;
    status: "published" | "failed" | "skipped";
    error?: string;
  }>;
}

/**
 * Backward-compatible boundary for the existing scheduled-publication cron.
 *
 * The actual scheduling logic now lives in the scheduler worker. This function
 * backfills any legacy scheduled Post rows into ScheduledAction records and
 * then runs the common worker.
 */
export async function publishDuePosts({
  now = new Date(),
  batchSize = SCHEDULED_PUBLICATION_BATCH,
}: PublishDuePostsInput = {}): Promise<PublishDuePostsResult> {
  await backfillScheduledPosts(now, batchSize);

  const runnerResult = await runScheduledActions({ now, batchSize });

  const details: PublishDuePostsResult["details"] = runnerResult.details.map(
    (item) => ({
      postId: item.actionId,
      rootId: item.targetId,
      status:
        item.status === "succeeded"
          ? "published"
          : item.status === "skipped"
            ? "skipped"
            : "failed",
      error: item.error,
    }),
  );

  return {
    processed: runnerResult.processed,
    succeeded: runnerResult.succeeded,
    failed: runnerResult.failed,
    skipped: runnerResult.skipped,
    details,
  };
}

/**
 * Compatibility helper used by tests and internal callers to determine
 * whether a post root still has a pending scheduled action.
 */
export async function hasPendingScheduledAction(
  rootId: string,
): Promise<boolean> {
  // Avoid a direct dependency on the scheduler repository in the public
  // publishDuePosts signature, but expose this for tests.
  const { getActiveScheduledActionByTarget } = await import(
    "@/modules/scheduler/lib/scheduled-action-repository"
  );
  const action = await getActiveScheduledActionByTarget("POST_ROOT", rootId);
  return (
    action !== null &&
    action.status !== ScheduledActionStatus.SUCCEEDED &&
    action.status !== ScheduledActionStatus.FAILED &&
    action.status !== ScheduledActionStatus.CANCELED
  );
}
