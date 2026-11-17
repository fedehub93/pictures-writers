import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";

import {
  ContentStatus,
  type SiteRegionKey,
  type SiteRegionVersion,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { SITE_REGIONS_CACHE_TAG } from "../constants";

import { SiteRegionError } from "./errors";
import { acquireSiteRegionLock } from "./lock-site-region";

export interface PublishedSiteRegionVersion extends SiteRegionVersion {
  key: SiteRegionKey;
}

export interface PublishSiteRegionInput {
  id: string;
  rootId: string;
  now?: Date;
}

export interface UnpublishSiteRegionInput {
  key: SiteRegionKey;
}

export interface UnpublishedSiteRegion {
  id: string;
  key: SiteRegionKey;
  liveVersionId: string | null;
}

/**
 * A Site region renders in the public layout, so a change must invalidate every
 * page. The tag clears the cached layout read; the path invalidates the ISR
 * output. See ADR-0001 for the revalidation strategy.
 */
function revalidateSiteRegionLayout(): void {
  revalidatePath("/", "layout");
  revalidateTag(SITE_REGIONS_CACHE_TAG, { expire: 0 });
}

/**
 * Promote a Site region version to the root's live version.
 *
 * The `SiteRegion` row is locked for the duration of the transaction so two
 * concurrent publishers serialize: the second call observes an already-live
 * target and becomes a no-op instead of racing a second publication.
 * `firstPublishedAt` is only written the first time a region goes live.
 */
export async function publishSiteRegionVersion({
  id,
  rootId,
  now = new Date(),
}: PublishSiteRegionInput): Promise<PublishedSiteRegionVersion> {
  const published = await db.$transaction(async (tx) => {
    await acquireSiteRegionLock(tx, rootId);

    const root = await tx.siteRegion.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new SiteRegionError("NOT_FOUND", "Site region not found");
    }

    const target = await tx.siteRegionVersion.findUnique({ where: { id } });
    if (!target || target.rootId !== rootId) {
      throw new SiteRegionError("NOT_FOUND", "Site region not found");
    }

    if (
      root.liveVersionId === target.id &&
      target.status === ContentStatus.PUBLISHED
    ) {
      return { ...target, key: root.key };
    }

    if (root.liveVersionId && root.liveVersionId !== target.id) {
      await tx.siteRegionVersion.update({
        where: { id: root.liveVersionId },
        data: { status: ContentStatus.CHANGED },
      });
    }

    const published = await tx.siteRegionVersion.update({
      where: { id: target.id },
      data: { status: ContentStatus.PUBLISHED, publishedAt: now },
    });

    await tx.siteRegion.update({
      where: { id: rootId },
      data: {
        liveVersionId: published.id,
        ...(root.firstPublishedAt === null ? { firstPublishedAt: now } : {}),
      },
    });

    return { ...published, key: root.key };
  });

  revalidateSiteRegionLayout();

  return published;
}

/**
 * Take a Site region off the public site: clear the root's live pointer and
 * move the published revision back to `CHANGED`. The revision stays the current
 * one so the editor keeps their draft. Locked on the root for symmetry with
 * publish.
 */
export async function unpublishSiteRegion({
  key,
}: UnpublishSiteRegionInput): Promise<UnpublishedSiteRegion> {
  const unpublished = await db.$transaction(async (tx) => {
    const found = await tx.siteRegion.findUnique({ where: { key } });
    if (!found) {
      throw new SiteRegionError("NOT_FOUND", "Site region not found");
    }

    await acquireSiteRegionLock(tx, found.id);

    // Re-read the root after locking so a concurrent publish cannot slip
    // between the lock and the decision to clear the live pointer.
    const root = await tx.siteRegion.findUnique({ where: { id: found.id } });
    if (!root) {
      throw new SiteRegionError("NOT_FOUND", "Site region not found");
    }

    if (!root.liveVersionId) {
      return { id: root.id, key: root.key, liveVersionId: null };
    }

    await tx.siteRegionVersion.update({
      where: { id: root.liveVersionId },
      data: { status: ContentStatus.CHANGED },
    });

    await tx.siteRegion.update({
      where: { id: root.id },
      data: { liveVersionId: null },
    });

    return { id: root.id, key: root.key, liveVersionId: null };
  });

  revalidateSiteRegionLayout();

  return unpublished;
}
