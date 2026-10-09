import "server-only";

import type { Prisma } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";
import { cancelScheduledActionTx } from "@/modules/scheduler/lib/scheduled-action-repository";

import { PostError } from "./errors";
import { acquireRootLock } from "./lock-root-posts";

/**
 * Whether any row other than the post versions we are deleting still points at
 * this SEO record. Covers every model that owns a `seoId` so deleting a post
 * never removes metadata another entity depends on.
 */
async function seoIsReferenced(
  tx: Prisma.TransactionClient,
  seoId: string,
): Promise<boolean> {
  const [
    postVersions,
    pageVersions,
    categories,
    tags,
    productVersions,
    productCategories,
    settings,
  ] = await Promise.all([
    tx.postVersion.count({ where: { seoId } }),
    tx.pageVersion.count({ where: { seoId } }),
    tx.category.count({ where: { seoId } }),
    tx.tag.count({ where: { seoId } }),
    tx.productVersion.count({ where: { seoId } }),
    tx.productCategory.count({ where: { seoId } }),
    tx.settings.count({ where: { seoId } }),
  ]);

  return (
    postVersions +
      pageVersions +
      categories +
      tags +
      productVersions +
      productCategories +
      settings >
    0
  );
}

export interface DeletePostRootInput {
  /** Id of the `PostRoot` to delete. */
  rootId: string;
}

export interface DeletePostRootResult {
  id: string;
  slug: string;
}

/**
 * Delete a logical post: its `PostRoot`, every `PostVersion` (cascade) and the
 * SEO rows that belonged to those versions. SEO rows still referenced by
 * another entity are left intact; any SEO left with no owner is deleted.
 */
export async function deletePostRoot({
  rootId,
}: DeletePostRootInput): Promise<DeletePostRootResult> {
  return db.$transaction(async (tx) => {
    const root = await tx.postRoot.findUnique({
      where: { id: rootId },
      select: { id: true, slug: true },
    });

    if (!root) {
      throw new PostError("NOT_FOUND", "Post not found");
    }

    await acquireRootLock(tx, root.id);

    // A deleted root can never be published, so cancel any pending publication
    // action rather than leaving the worker to fail against a missing target.
    const activeActions = await tx.scheduledAction.findMany({
      where: {
        targetType: SCHEDULER_TARGET_TYPES.POST_ROOT,
        targetId: root.id,
        active: true,
      },
      select: { id: true },
    });

    for (const action of activeActions) {
      await cancelScheduledActionTx(tx, action.id);
    }

    const versions = await tx.postVersion.findMany({
      where: { rootId: root.id },
      select: { seoId: true },
    });

    const seoIds = [
      ...new Set(
        versions
          .map((row) => row.seoId)
          .filter((seoId): seoId is string => Boolean(seoId)),
      ),
    ];

    await tx.postRoot.delete({ where: { id: root.id } });

    for (const seoId of seoIds) {
      if (!(await seoIsReferenced(tx, seoId))) {
        await tx.seo.delete({ where: { id: seoId } });
      }
    }

    return { id: root.id, slug: root.slug };
  });
}
