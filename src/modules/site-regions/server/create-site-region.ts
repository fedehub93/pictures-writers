import "server-only";

import {
  ContentStatus,
  type SiteRegionKey,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { EMPTY_PUCK_DATA } from "../constants";

import {
  presentSiteRegionVersion,
  type SiteRegionVersionView,
} from "./present-site-region-version";

export interface CreateSiteRegionInput {
  key: SiteRegionKey;
  userId: string;
}

/**
 * Create a Site region root plus its first `DRAFT` version.
 *
 * Repeated calls return the existing current version instead of creating a
 * second root, so the admin screen can call `create` on first open without
 * checking existence first. A simultaneous first call is not expected for a
 * global region; if it happened, the unique key would reject one of the two.
 */
export async function createSiteRegion({
  key,
  userId,
}: CreateSiteRegionInput): Promise<SiteRegionVersionView> {
  const { root, version } = await db.$transaction(async (tx) => {
    const existingRoot = await tx.siteRegion.findUnique({
      where: { key },
      include: { currentVersion: true },
    });

    if (existingRoot?.currentVersion) {
      return { root: existingRoot, version: existingRoot.currentVersion };
    }

    const root =
      existingRoot ?? (await tx.siteRegion.create({ data: { key } }));

    const latest = await tx.siteRegionVersion.aggregate({
      where: { rootId: root.id },
      _max: { version: true },
    });

    const version = await tx.siteRegionVersion.create({
      data: {
        rootId: root.id,
        version: (latest._max.version ?? 0) + 1,
        status: ContentStatus.DRAFT,
        puckData: EMPTY_PUCK_DATA,
        userId,
      },
    });

    await tx.siteRegion.update({
      where: { id: root.id },
      data: { currentVersionId: version.id },
    });

    return { root, version };
  });

  return presentSiteRegionVersion(root, version);
}
