import "server-only";

import {
  ContentStatus,
  type SiteRegionKey,
  type SiteRegionVersion,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { dehydratePuckForms } from "@/puck/utils/dehydrate-puck-forms";

import { EMPTY_PUCK_DATA } from "../constants";
import type { SiteRegionUpdateValues } from "../schemas";

import { SiteRegionError } from "./errors";
import { acquireSiteRegionLock } from "./lock-site-region";

export interface SavedSiteRegionVersion extends SiteRegionVersion {
  key: SiteRegionKey;
}

/**
 * Persist an edit to the current revision of a Site region root.
 *
 * - When the current revision is not live, it is updated in place: a draft
 *   stays a single row while the editor iterates.
 * - When the current revision is live, the edit forks a new `CHANGED` revision
 *   so the public layout keeps serving the published version until the change
 *   is published.
 *
 * Only the root's current revision can be edited: anything else is stale
 * history and must not be rewritten in place.
 */
export async function saveSiteRegionVersion(
  input: SiteRegionUpdateValues,
): Promise<SavedSiteRegionVersion> {
  const { id, rootId } = input;

  return db.$transaction(async (tx) => {
    await acquireSiteRegionLock(tx, rootId);

    const root = await tx.siteRegion.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new SiteRegionError("NOT_FOUND", "Site region not found");
    }

    const current = await tx.siteRegionVersion.findFirst({
      where: { id, rootId },
    });
    if (!current) {
      throw new SiteRegionError("NOT_FOUND", "Site region not found");
    }

    if (root.currentVersionId !== current.id) {
      throw new SiteRegionError(
        "STALE_VERSION",
        "Site region version is not the current one",
      );
    }

    const nextPuckData = resolvePuckData(input, current);

    if (root.liveVersionId === current.id) {
      const latest = await tx.siteRegionVersion.aggregate({
        where: { rootId },
        _max: { version: true },
      });
      const nextVersionNumber = (latest._max.version ?? 0) + 1;

      const forked = await tx.siteRegionVersion.create({
        data: {
          rootId,
          version: nextVersionNumber,
          status: ContentStatus.CHANGED,
          puckData: nextPuckData,
          userId: current.userId,
        },
      });

      await tx.siteRegion.update({
        where: { id: rootId },
        data: { currentVersionId: forked.id },
      });

      return { ...forked, key: root.key };
    }

    const updated = await tx.siteRegionVersion.update({
      where: { id: current.id },
      data: { puckData: nextPuckData },
    });

    return { ...updated, key: root.key };
  });
}

function resolvePuckData(
  input: SiteRegionUpdateValues,
  current: { puckData: PrismaJson.PuckData | null },
): PrismaJson.PuckData {
  if (input.puckData != null) {
    // Region documents can contain blocks outside the page component map
    // (Brand, LinkList, Copyright); dehydration only looks for Form blocks.
    return dehydratePuckForms(input.puckData);
  }

  if (current.puckData != null) {
    return current.puckData;
  }

  return EMPTY_PUCK_DATA;
}
