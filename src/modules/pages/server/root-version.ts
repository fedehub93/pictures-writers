import { ContentStatus, type Page } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

/**
 * Map a legacy `Page` row onto the mutable columns of `PageVersion`. Shared by
 * the live create path and the one-time backfill so the two cannot drift.
 */
export function toPageVersionData(page: Page) {
  return {
    rootId: page.rootId ?? page.id,
    version: page.version,
    title: page.title,
    status: page.status,
    editorType: page.editorType,
    puckData: page.puckData ?? undefined,
    seoId: page.seoId,
    userId: page.userId,
    publishedAt:
      page.status === ContentStatus.PUBLISHED ? page.publishedAt : null,
  };
}

/**
 * Dual-write a freshly created legacy `Page` row into the Root + Version
 * schema. The root id mirrors the legacy root id (the first version's id), so
 * the live write path and the one-time backfill converge on the same identity.
 */
export async function createPageRootVersion(
  page: Page,
  seoId: string | null,
): Promise<void> {
  const data = toPageVersionData(page);
  const isPublished = data.status === ContentStatus.PUBLISHED;

  await db.$transaction(async (tx) => {
    await tx.pageRoot.create({
      data: {
        id: data.rootId,
        slug: page.slug,
        firstPublishedAt: isPublished ? page.firstPublishedAt : null,
      },
    });

    const version = await tx.pageVersion.create({
      data: {
        // Reuse the legacy id so the version id, the first version id and the
        // legacy `Page.id` all converge, exactly like the one-time backfill.
        id: page.id,
        ...data,
        seoId,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
      },
    });

    await tx.pageRoot.update({
      where: { id: data.rootId },
      data: {
        currentVersionId: version.id,
        liveVersionId: isPublished ? version.id : null,
      },
    });
  });
}
