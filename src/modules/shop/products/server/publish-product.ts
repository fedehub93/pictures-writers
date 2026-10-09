import "server-only";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { ProductError } from "./errors";
import { acquireProductRootLock } from "./lock-root-products";
import type { ProductVersionWithSlug } from "./save-product";

export interface PublishProductInput {
  id: string;
  rootId: string;
  now?: Date;
}

/**
 * Promote a Product version to the root's live version.
 *
 * The `ProductRoot` row is locked for the duration of the transaction so two
 * concurrent publishers serialize: the second call observes an already-live
 * target and becomes a no-op instead of racing a second publication. The
 * previous live version (if any) is demoted to `CHANGED`, the target is promoted
 * to `PUBLISHED`, and `firstPublishedAt` is only written the first time a root
 * goes live.
 */
export async function publishProductVersion({
  id,
  rootId,
  now = new Date(),
}: PublishProductInput): Promise<ProductVersionWithSlug> {
  return db.$transaction(async (tx) => {
    await acquireProductRootLock(tx, rootId);

    const root = await tx.productRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    const target = await tx.productVersion.findUnique({ where: { id } });
    if (!target || target.rootId !== rootId) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    if (!target.title || !root.slug) {
      throw new ProductError("MISSING_FIELDS", "Missing required fields");
    }

    if (
      root.liveVersionId === target.id &&
      target.status === ContentStatus.PUBLISHED
    ) {
      return { ...target, slug: root.slug, type: root.type };
    }

    if (root.liveVersionId && root.liveVersionId !== target.id) {
      await tx.productVersion.update({
        where: { id: root.liveVersionId },
        data: { status: ContentStatus.CHANGED },
      });
    }

    const published = await tx.productVersion.update({
      where: { id: target.id },
      data: { status: ContentStatus.PUBLISHED, publishedAt: now },
    });

    await tx.productRoot.update({
      where: { id: rootId },
      data: {
        liveVersionId: published.id,
        ...(root.firstPublishedAt === null ? { firstPublishedAt: now } : {}),
      },
    });

    return { ...published, slug: root.slug, type: root.type };
  });
}

export interface UnpublishProductInput {
  id: string;
}

/**
 * Take a version off the live site: clear the root's live pointer and move the
 * published revision back to `CHANGED`. The revision stays the current one so
 * the editor keeps their draft. Locked on the root for symmetry with publish.
 */
export async function unpublishProductVersion({
  id,
}: UnpublishProductInput): Promise<ProductVersionWithSlug> {
  return db.$transaction(async (tx) => {
    const version = await tx.productVersion.findUnique({ where: { id } });
    if (!version) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    await acquireProductRootLock(tx, version.rootId);

    // Re-read the root after locking so a concurrent publish cannot slip
    // between the lock and the decision to clear the live pointer.
    const root = await tx.productRoot.findUnique({
      where: { id: version.rootId },
    });
    if (!root) {
      throw new ProductError("NOT_FOUND", "Product not found");
    }

    if (root.liveVersionId !== version.id) {
      return { ...version, slug: root.slug, type: root.type };
    }

    const unpublished = await tx.productVersion.update({
      where: { id: version.id },
      data: { status: ContentStatus.CHANGED },
    });

    await tx.productRoot.update({
      where: { id: root.id },
      data: { liveVersionId: null },
    });

    return { ...unpublished, slug: root.slug, type: root.type };
  });
}
