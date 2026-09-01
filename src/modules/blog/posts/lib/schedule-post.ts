import "server-only";

import { db } from "@/shared/lib/db";
import { Prisma, ContentStatus, type Post, type Seo } from "@/generated/prisma";

export type ScheduledPostResult = Post & {
  seo: Seo | null;
};

export class ScheduledPostError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "VALIDATION_ERROR"
      | "INVALID_STATE"
      | "CONFLICT",
    message: string,
  ) {
    super(message);
  }
}

export interface SchedulePostInput {
  postId: string;
  rootId: string;
  scheduledAt: Date;
  now?: Date;
}

export interface ReschedulePostInput {
  postId: string;
  rootId: string;
  scheduledAt: Date;
  now?: Date;
}

export interface CancelScheduleInput {
  postId: string;
  rootId: string;
}

function assertFutureScheduledAt(scheduledAt: Date, now: Date) {
  if (scheduledAt.getTime() <= now.getTime()) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "Scheduled time must be in the future",
    );
  }
}

async function lockRootPosts(tx: Prisma.TransactionClient, rootId: string) {
  return tx.post.findMany({
    where: { rootId },
    select: {
      id: true,
      status: true,
      version: true,
      title: true,
      scheduledAt: true,
      preSchedulingStatus: true,
    },
    orderBy: { id: "asc" },
  });
}

function findTarget(
  posts: Awaited<ReturnType<typeof lockRootPosts>>,
  postId: string,
) {
  const target = posts.find((post) => post.id === postId);

  if (!target) {
    throw new ScheduledPostError("NOT_FOUND", "Post not found");
  }

  if (!target.title) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "Missing required fields",
    );
  }

  return target;
}

export async function schedulePost({
  postId,
  rootId,
  scheduledAt,
  now = new Date(),
}: SchedulePostInput): Promise<ScheduledPostResult> {
  if (!postId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);

  return db.$transaction(async (tx) => {
    const posts = await lockRootPosts(tx, rootId);
    const target = findTarget(posts, postId);

    if (
      target.status !== ContentStatus.DRAFT &&
      target.status !== ContentStatus.CHANGED
    ) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only draft or changed posts can be scheduled",
      );
    }

    const activeSchedule = posts.find(
      (post) => post.status === ContentStatus.SCHEDULED,
    );

    if (activeSchedule) {
      throw new ScheduledPostError(
        "CONFLICT",
        "An active schedule already exists for this post",
      );
    }

    const scheduledPost = await tx.post.update({
      where: { id: postId },
      data: {
        status: ContentStatus.SCHEDULED,
        scheduledAt,
        preSchedulingStatus: target.status,
      },
      include: { seo: true },
    });

    return scheduledPost;
  });
}

export async function reschedulePost({
  postId,
  rootId,
  scheduledAt,
  now = new Date(),
}: ReschedulePostInput): Promise<ScheduledPostResult> {
  if (!postId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  assertFutureScheduledAt(scheduledAt, now);

  return db.$transaction(async (tx) => {
    const posts = await lockRootPosts(tx, rootId);
    const target = findTarget(posts, postId);

    if (target.status !== ContentStatus.SCHEDULED) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only scheduled posts can be rescheduled",
      );
    }

    const rescheduledPost = await tx.post.update({
      where: { id: postId },
      data: {
        scheduledAt,
      },
      include: { seo: true },
    });

    return rescheduledPost;
  });
}

export async function cancelSchedule({
  postId,
  rootId,
}: CancelScheduleInput): Promise<ScheduledPostResult> {
  if (!postId || !rootId) {
    throw new ScheduledPostError(
      "VALIDATION_ERROR",
      "postId and rootId are required",
    );
  }

  return db.$transaction(async (tx) => {
    const posts = await lockRootPosts(tx, rootId);
    const target = findTarget(posts, postId);

    if (target.status !== ContentStatus.SCHEDULED) {
      throw new ScheduledPostError(
        "INVALID_STATE",
        "Only scheduled posts can be unscheduled",
      );
    }

    const restoredStatus =
      target.preSchedulingStatus ?? ContentStatus.DRAFT;

    const restoredPost = await tx.post.update({
      where: { id: postId },
      data: {
        status: restoredStatus,
        scheduledAt: null,
        preSchedulingStatus: null,
      },
      include: { seo: true },
    });

    return restoredPost;
  });
}
