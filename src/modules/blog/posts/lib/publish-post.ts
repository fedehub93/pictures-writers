import "server-only";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { markActiveScheduledActionSucceededTx } from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

import { acquireRootLock } from "./lock-root-posts";
import type { PostVersionWithSlug } from "./save-post";

export class PublishPostError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "VALIDATION_ERROR" | "INVALID_STATE",
    message: string,
  ) {
    super(message);
  }
}

export type PublishMode = "manual" | "scheduled";

export interface PublishPostInput {
  id: string;
  rootId: string;
  now?: Date;
  mode?: PublishMode;
}

/**
 * Shared, idempotent publication workflow for Posts.
 *
 * Publishing locks the `PostRoot` for the duration of the transaction so
 * concurrent publishes serialize: the second call observes an already-live
 * target and becomes a no-op instead of racing a second publication. The
 * previous live version (if any) is demoted to `CHANGED`, the target is
 * promoted to `PUBLISHED`, any scheduling state is cleared and
 * `firstPublishedAt` is only written the first time a root goes live.
 */
export async function publishPost({
  id,
  rootId,
  now = new Date(),
  mode = "manual",
}: PublishPostInput): Promise<PostVersionWithSlug> {
  if (!id || !rootId) {
    throw new PublishPostError(
      "VALIDATION_ERROR",
      "id and rootId are required",
    );
  }

  return db.$transaction(async (tx) => {
    await acquireRootLock(tx, rootId);

    const root = await tx.postRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new PublishPostError("NOT_FOUND", "Post not found");
    }

    const target = await tx.postVersion.findUnique({ where: { id } });
    if (!target || target.rootId !== rootId) {
      throw new PublishPostError("NOT_FOUND", "Post not found");
    }

    if (!target.title || !root.slug) {
      throw new PublishPostError(
        "VALIDATION_ERROR",
        "Missing required fields",
      );
    }

    let published = target;

    const alreadyLive =
      root.liveVersionId === target.id &&
      target.status === ContentStatus.PUBLISHED;

    if (!alreadyLive) {
      if (mode === "scheduled") {
        if (target.status !== ContentStatus.SCHEDULED) {
          throw new PublishPostError(
            "INVALID_STATE",
            "Post is no longer scheduled",
          );
        }

        if (
          !target.scheduledAt ||
          target.scheduledAt.getTime() > now.getTime()
        ) {
          throw new PublishPostError(
            "INVALID_STATE",
            "Scheduled time is in the future",
          );
        }
      }

      if (
        target.status !== ContentStatus.DRAFT &&
        target.status !== ContentStatus.CHANGED &&
        target.status !== ContentStatus.SCHEDULED
      ) {
        throw new PublishPostError(
          "INVALID_STATE",
          "Post cannot be published",
        );
      }

      if (root.liveVersionId && root.liveVersionId !== target.id) {
        await tx.postVersion.update({
          where: { id: root.liveVersionId },
          data: { status: ContentStatus.CHANGED },
        });
      }

      published = await tx.postVersion.update({
        where: { id: target.id },
        data: {
          status: ContentStatus.PUBLISHED,
          publishedAt: now,
          scheduledAt: null,
          preSchedulingStatus: null,
        },
      });

      await tx.postRoot.update({
        where: { id: rootId },
        data: {
          liveVersionId: published.id,
          ...(root.firstPublishedAt === null ? { firstPublishedAt: now } : {}),
        },
      });
    }

    // Invalidate any pending or in-flight ScheduledAction atomically with the
    // state transition (also on the idempotent no-op path) so the worker can
    // never process this root after publication.
    await markActiveScheduledActionSucceededTx(
      tx,
      SCHEDULER_TARGET_TYPES.POST_ROOT,
      rootId,
      now,
    );

    return { ...published, slug: root.slug };
  });
}

export interface UnpublishPostInput {
  id: string;
}

/**
 * Take a version off the live site: clear the root's live pointer and move the
 * published revision back to `CHANGED`. The revision stays the current one so
 * the editor keeps their draft. Locked on the root for symmetry with publish.
 */
export async function unpublishPostVersion({
  id,
}: UnpublishPostInput): Promise<PostVersionWithSlug> {
  return db.$transaction(async (tx) => {
    const version = await tx.postVersion.findUnique({ where: { id } });
    if (!version) {
      throw new PublishPostError("NOT_FOUND", "Post not found");
    }

    await acquireRootLock(tx, version.rootId);

    // Re-read the root after locking so a concurrent publish cannot slip
    // between the lock and the decision to clear the live pointer.
    const root = await tx.postRoot.findUnique({
      where: { id: version.rootId },
    });
    if (!root) {
      throw new PublishPostError("NOT_FOUND", "Post not found");
    }

    if (root.liveVersionId !== version.id) {
      return { ...version, slug: root.slug };
    }

    const unpublished = await tx.postVersion.update({
      where: { id: version.id },
      data: { status: ContentStatus.CHANGED },
    });

    await tx.postRoot.update({
      where: { id: root.id },
      data: { liveVersionId: null },
    });

    return { ...unpublished, slug: root.slug };
  });
}
