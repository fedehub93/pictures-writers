import "server-only";

import { db } from "@/shared/lib/db";
import { ContentStatus, type Post, type Seo } from "@/generated/prisma";

import { acquireRootLock } from "./lock-root-posts";

export type PublishPostResult = Post & {
  seo: Seo | null;
};

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
  postId: string;
  rootId: string;
  now?: Date;
  mode?: PublishMode;
}

/**
 * Shared, idempotent publication workflow for Posts.
 *
 * The workflow can be invoked from multiple entry points (e.g. the admin tRPC
 * procedure, a future scheduled-publication job, etc.) without duplicating the
 * transition logic.
 *
 * It is safe to call concurrently for the same post: a repeated or racing
 * request on a version that is already published and latest is a no-op and
 * will not mutate `publishedAt`, `firstPublishedAt` or `isLatest`.
 */
export async function publishPost({
  postId,
  rootId,
  now = new Date(),
  mode = "manual",
}: PublishPostInput): Promise<PublishPostResult> {
  if (!postId || !rootId) {
    throw new PublishPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  return db.$transaction(async (tx) => {
    // Lock every version of the post root in a deterministic order to avoid
    // deadlocks and race conditions between concurrent publishers.
    await acquireRootLock(tx, rootId);

    const posts = await tx.post.findMany({
      where: { rootId },
      select: {
        id: true,
        status: true,
        version: true,
        isLatest: true,
        title: true,
        slug: true,
        scheduledAt: true,
      },
      orderBy: { id: "asc" },
    });

    const target = posts.find((post) => post.id === postId);

    if (!target) {
      throw new PublishPostError("NOT_FOUND", "Post not found");
    }

    if (!target.title || !target.slug) {
      throw new PublishPostError("VALIDATION_ERROR", "Missing required fields");
    }

    // Already published -> idempotent no-op. This keeps publishedAt,
    // firstPublishedAt and isLatest stable across repeated or concurrent calls.
    if (target.status === ContentStatus.PUBLISHED) {
      const current = await tx.post.findUnique({
        where: { id: postId },
        include: { seo: true },
      });

      // current is guaranteed to exist because we just locked the row
      return current as PublishPostResult;
    }

    if (mode === "scheduled") {
      if (target.status !== ContentStatus.SCHEDULED) {
        throw new PublishPostError(
          "INVALID_STATE",
          "Post is no longer scheduled",
        );
      }

      if (!target.scheduledAt || target.scheduledAt.getTime() > now.getTime()) {
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
      throw new PublishPostError("INVALID_STATE", "Post cannot be published");
    }

    // Demote every version of the root so only the target becomes latest.
    await tx.post.updateMany({
      where: { rootId },
      data: { isLatest: false },
    });

    const firstPublishedAt = target.version === 1 ? now : undefined;

    const publishedPost = await tx.post.update({
      where: { id: postId },
      data: {
        status: ContentStatus.PUBLISHED,
        isLatest: true,
        publishedAt: now,
        scheduledAt: null,
        preSchedulingStatus: null,
        ...(firstPublishedAt && { firstPublishedAt: now }),
      },
      include: { seo: true },
    });

    return publishedPost;
  });
}
