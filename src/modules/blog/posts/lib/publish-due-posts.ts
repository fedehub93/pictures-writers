import "server-only";

import { db } from "@/shared/lib/db";
import { ContentStatus } from "@/generated/prisma";

import { publishPost, PublishPostError } from "./publish-post";

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

export async function publishDuePosts({
  now = new Date(),
  batchSize = SCHEDULED_PUBLICATION_BATCH,
}: PublishDuePostsInput = {}): Promise<PublishDuePostsResult> {
  const duePosts = await db.post.findMany({
    where: {
      status: ContentStatus.SCHEDULED,
      scheduledAt: { lte: now },
    },
    select: {
      id: true,
      rootId: true,
      title: true,
    },
    orderBy: { scheduledAt: "asc" },
    take: batchSize,
  });

  const result: PublishDuePostsResult = {
    processed: duePosts.length,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  for (const post of duePosts) {
    if (!post.rootId) {
      result.skipped++;
      result.details.push({
        postId: post.id,
        rootId: null,
        status: "skipped",
        error: "Missing rootId",
      });
      console.error(`[PUBLISH_DUE_POSTS] Post ${post.id} missing rootId`);
      continue;
    }

    try {
      await publishPost({ postId: post.id, rootId: post.rootId, now });
      result.succeeded++;
      result.details.push({
        postId: post.id,
        rootId: post.rootId,
        status: "published",
      });
    } catch (error) {
      result.failed++;
      const message =
        error instanceof PublishPostError
          ? `${error.code}: ${error.message}`
          : error instanceof Error
            ? error.message
            : "Unknown error";
      result.details.push({
        postId: post.id,
        rootId: post.rootId,
        status: "failed",
        error: message,
      });
      console.error(
        `[PUBLISH_DUE_POSTS] Failed to publish post ${post.id}: ${message}`,
      );
    }
  }

  return result;
}
