import "server-only";

import { db } from "@/shared/lib/db";
import { revalidateContent } from "@/shared/lib/revalidate-content";
import { ContentStatus } from "@/generated/prisma";
import { publishPost, PublishPostError } from "@/modules/blog/posts/lib/publish-post";

import { ScheduledActionHandlerError } from "../../constants";

import type { ScheduledAction } from "@/generated/prisma";

export interface PostPublishContext {
  now?: Date;
}

/**
 * Resolve the version a scheduled PUBLISH_POST action refers to.
 *
 * The action targets the `PostRoot`, so at execution time the scheduled
 * revision is the root's current version (scheduling moves the current version
 * to `SCHEDULED`). Resolving through the pointer — instead of trusting a stale
 * version id captured at schedule time — keeps the handler correct if the root
 * was published or re-edited meanwhile.
 */
async function resolveScheduledVersion(rootId: string) {
  const root = await db.postRoot.findUnique({
    where: { id: rootId },
    select: { currentVersion: true },
  });

  return root?.currentVersion ?? null;
}

/**
 * Handler for PUBLISH_POST scheduled actions.
 *
 * Resolves the root's scheduled (current) version and delegates the actual
 * publication transition to the `publishPost` workflow, which promotes it to
 * `liveVersion`.
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

  const version = await resolveScheduledVersion(action.targetId);

  if (!version) {
    throw new ScheduledActionHandlerError("Post not found", false);
  }

  if (version.status === ContentStatus.PUBLISHED) {
    // Idempotent success: the post was already published (e.g. manually).
    return;
  }

  if (version.status !== ContentStatus.SCHEDULED) {
    throw new ScheduledActionHandlerError(
      `Post is in unexpected state ${version.status}`,
      false,
    );
  }

  try {
    const published = await publishPost({
      id: version.id,
      rootId: action.targetId,
      now,
      mode: "scheduled",
    });

    revalidateContent("post", published.slug);
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
