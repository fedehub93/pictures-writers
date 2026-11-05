import "server-only";

import {
  Prisma,
  type SiteRegionKey,
  type SiteRegionVersion,
} from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

const versionSummarySelect = {
  id: true,
  rootId: true,
  version: true,
  status: true,
  publishedAt: true,
  scheduledAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SiteRegionVersionSelect;

export type SiteRegionVersionSummary = Pick<
  SiteRegionVersion,
  | "id"
  | "rootId"
  | "version"
  | "status"
  | "publishedAt"
  | "scheduledAt"
  | "createdAt"
  | "updatedAt"
>;

/**
 * Load a Site region root with its editable version and version history.
 *
 * Used by the admin list/detail screen. The current version is hydrated so the
 * editor can open it directly; history entries stay lightweight.
 */
export const getRegionWithVersions = async (key: SiteRegionKey) => {
  const root = await db.siteRegion.findUnique({
    where: { key },
    include: {
      currentVersion: true,
      liveVersion: { select: versionSummarySelect },
      versions: {
        orderBy: { version: "desc" },
        select: versionSummarySelect,
      },
    },
  });

  if (!root) return null;

  const { currentVersion, liveVersion, versions, ...region } = root;

  return {
    ...region,
    currentVersion: currentVersion
      ? {
          ...currentVersion,
          puckData: currentVersion.puckData
            ? await hydratePuckForms(currentVersion.puckData)
            : null,
        }
      : null,
    liveVersion,
    versions,
  };
};

export type GetRegionWithVersions = NonNullable<
  Awaited<ReturnType<typeof getRegionWithVersions>>
>;
