import "server-only";

import { unstable_cache } from "next/cache";

import type { SiteRegionKey } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

import { SITE_REGIONS_CACHE_TAG } from "../../constants";

/**
 * Resolve the published version of a Site region by key.
 *
 * Used by the public layout: returns `null` when the region does not exist or
 * has never been published, so the caller can fall back to a generic default.
 */
export const getLiveRegionByKey = async (key: SiteRegionKey) => {
  const root = await db.siteRegion.findUnique({
    where: { key },
    include: { liveVersion: true },
  });

  if (!root || !root.liveVersion) return null;

  const version = root.liveVersion;

  return {
    id: version.id,
    rootId: root.id,
    key: root.key,
    version: version.version,
    status: version.status,
    puckData: version.puckData
      ? await hydratePuckForms(version.puckData)
      : null,
    publishedAt: version.publishedAt,
    updatedAt: version.updatedAt,
    firstPublishedAt: root.firstPublishedAt,
  };
};

export type GetLiveRegionByKey = Awaited<ReturnType<typeof getLiveRegionByKey>>;

/**
 * Cached variant used by the public layout.
 *
 * The layout renders on every page, so the same document is read for every
 * request. A short TTL bounds how long a missing tag invalidation can serve a
 * stale region, while `revalidateTag` on publish/unpublish makes the normal
 * path immediate.
 */
export const getCachedLiveRegionByKey = unstable_cache(
  getLiveRegionByKey,
  ["site-region-live"],
  { tags: [SITE_REGIONS_CACHE_TAG], revalidate: 60 },
);
