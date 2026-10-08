import "server-only";

import { ContentStatus, type PageVersion } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { PageError } from "./errors";
import { acquirePageRootLock } from "./lock-page-root";

export interface PageVersionWithSlug extends PageVersion {
  slug: string;
}

export interface PublishPageInput {
  id: string;
  rootId: string;
  now?: Date;
}

/**
 * Promote a Page version to the root's live version.
 *
 * The `PageRoot` row is locked for the duration of the transaction so two
 * concurrent publishers serialize: the second call observes an already-live
 * target and becomes a no-op instead of racing a second publication.
 * `firstPublishedAt` is only written the first time a root goes live.
 */
export async function publishPageVersion({
  id,
  rootId,
  now = new Date(),
}: PublishPageInput): Promise<PageVersionWithSlug> {
  return db.$transaction(async (tx) => {
    await acquirePageRootLock(tx, rootId);

    const root = await tx.pageRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    const target = await tx.pageVersion.findUnique({ where: { id } });
    if (!target || target.rootId !== rootId) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    if (!target.title || !root.slug) {
      throw new PageError("MISSING_FIELDS", "Missing required fields");
    }

    if (
      root.liveVersionId === target.id &&
      target.status === ContentStatus.PUBLISHED
    ) {
      return { ...target, slug: root.slug };
    }

    if (root.liveVersionId && root.liveVersionId !== target.id) {
      await tx.pageVersion.update({
        where: { id: root.liveVersionId },
        data: { status: ContentStatus.CHANGED },
      });
    }

    const published = await tx.pageVersion.update({
      where: { id: target.id },
      data: { status: ContentStatus.PUBLISHED, publishedAt: now },
    });

    await tx.pageRoot.update({
      where: { id: rootId },
      data: {
        liveVersionId: published.id,
        ...(root.firstPublishedAt === null ? { firstPublishedAt: now } : {}),
      },
    });

    return { ...published, slug: root.slug };
  });
}

export interface UnpublishPageInput {
  id: string;
}

/**
 * Take a version off the live site: clear the root's live pointer and move the
 * published revision back to `CHANGED`. The revision stays the current one so
 * the editor keeps their draft. Locked on the root for symmetry with publish.
 */
export async function unpublishPageVersion({
  id,
}: UnpublishPageInput): Promise<PageVersionWithSlug> {
  return db.$transaction(async (tx) => {
    const version = await tx.pageVersion.findUnique({ where: { id } });
    if (!version) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    await acquirePageRootLock(tx, version.rootId);

    // Re-read the root after locking so a concurrent publish cannot slip
    // between the lock and the decision to clear the live pointer.
    const root = await tx.pageRoot.findUnique({ where: { id: version.rootId } });
    if (!root) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    if (root.liveVersionId !== version.id) {
      return { ...version, slug: root.slug };
    }

    const unpublished = await tx.pageVersion.update({
      where: { id: version.id },
      data: { status: ContentStatus.CHANGED },
    });

    await tx.pageRoot.update({
      where: { id: root.id },
      data: { liveVersionId: null },
    });

    return { ...unpublished, slug: root.slug };
  });
}
