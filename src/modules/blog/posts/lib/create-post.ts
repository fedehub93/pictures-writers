import "server-only";

import { ContentStatus, ScheduledActionType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import {
  createIdempotencyKey,
  createScheduledActionTx,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

import { createPostVersionSeo } from "./post-seo";
import type { PostVersionWithSlug } from "./save-post";

export interface CreatePostInput {
  title: string;
  slug: string;
  scheduledAt?: Date | null;
  timezone?: string;
  userId: string;
  now?: Date;
}

/**
 * Create a logical post: a `PostRoot` owning the slug plus its first `DRAFT`
 * (or `SCHEDULED`) `PostVersion`. The version gets a self-owned SEO row and
 * immediately becomes the root's current version. The author link and, when the
 * post is created with a future `scheduledAt`, the `ScheduledAction` are written
 * in the same transaction so the post can never exist half-built.
 */
export async function createPost({
  title,
  slug,
  scheduledAt,
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
  userId,
  now = new Date(),
}: CreatePostInput): Promise<PostVersionWithSlug & { rootId: string }> {
  const isScheduled =
    scheduledAt != null && scheduledAt.getTime() > now.getTime();
  const status = isScheduled ? ContentStatus.SCHEDULED : ContentStatus.DRAFT;

  return db.$transaction(async (tx) => {
    const root = await tx.postRoot.create({ data: { slug } });

    const version = await tx.postVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        status,
        title,
        scheduledAt: isScheduled ? scheduledAt : null,
        preSchedulingStatus: isScheduled ? ContentStatus.DRAFT : null,
        userId,
        authors: { create: { userId, sort: 0 } },
      },
    });

    const seo = await createPostVersionSeo(
      tx,
      title,
      { description: null, noIndex: false, noFollow: false },
      version.imageCoverId,
    );

    const versionWithSeo = await tx.postVersion.update({
      where: { id: version.id },
      data: { seoId: seo.id },
    });

    await tx.postRoot.update({
      where: { id: root.id },
      data: { currentVersionId: version.id },
    });

    if (isScheduled && scheduledAt) {
      await createScheduledActionTx(tx, {
        type: ScheduledActionType.PUBLISH_POST,
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: root.id,
        plannedAt: scheduledAt,
        timezone,
        idempotencyKey: createIdempotencyKey(
          ScheduledActionType.PUBLISH_POST,
          SCHEDULER_TARGET_TYPES.POST_ROOT,
          root.id,
        ),
      });
    }

    return { ...versionWithSeo, slug: root.slug, rootId: root.id };
  });
}
