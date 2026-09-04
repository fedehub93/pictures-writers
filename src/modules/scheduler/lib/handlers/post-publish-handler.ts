import "server-only";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";
import { publishPost, PublishPostError } from "@/modules/blog/posts/lib/publish-post";

import { ScheduledActionHandlerError } from "../../constants";

import type { ScheduledAction } from "@/generated/prisma";

export interface PostPublishContext {
  now?: Date;
}

/**
 * Resolve the latest saved eligible post version for a root at execution time.
 *
 * Eligible means: not deleted, belongs to the root, and has the maximum
 * version number. Validation of required fields is left to publishPost.
 */
async function resolveLatestEligiblePost(rootId: string) {
  const post = await db.post.findFirst({
    where: { rootId },
    orderBy: { version: "desc" },
  });

  return post;
}

/**
 * Handler for PUBLISH_POST scheduled actions.
 *
 * Uses the latest saved eligible version of the post at execution time and
 * delegates the actual publication transition to the existing publishPost
 * workflow.
 *
 * Returns normally to signal success. Throws ScheduledActionHandlerError to
 * signal failure; `transient: true` requests a retry when attempts remain.
 */
export async function handlePublishPost(
  action: ScheduledAction,
  context: PostPublishContext = {},
): Promise<void> {
  const now = context.now ?? new Date();

  if (action.targetType !== "POST_ROOT") {
    throw new ScheduledActionHandlerError(
      `Unexpected target type ${action.targetType}`,
      false,
    );
  }

  const post = await resolveLatestEligiblePost(action.targetId);

  if (!post) {
    throw new ScheduledActionHandlerError("Post not found", false);
  }

  if (post.status === ContentStatus.PUBLISHED) {
    // Idempotent success: the post was already published (e.g. manually).
    return;
  }

  if (post.status !== ContentStatus.SCHEDULED) {
    throw new ScheduledActionHandlerError(
      `Post is in unexpected state ${post.status}`,
      false,
    );
  }

  try {
    await publishPost({
      postId: post.id,
      rootId: action.targetId,
      now,
      mode: "scheduled",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown publication error";

    // All known publishPost failures (not found, validation, invalid state)
    // are permanent. Unexpected errors (e.g. database or infrastructure)
    // are treated as transient so they can be retried.
    const permanent =
      error instanceof PublishPostError ||
      (error instanceof Error && message === "Post not found");

    throw new ScheduledActionHandlerError(message, !permanent);
  }
}
