import "server-only";

import type {
  ContentStatus,
  SiteRegionKey,
  SiteRegionVersion,
} from "@/generated/prisma";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

export interface SiteRegionVersionView {
  id: string;
  rootId: string;
  key: SiteRegionKey;
  version: number;
  status: ContentStatus;
  puckData: Awaited<ReturnType<typeof hydratePuckForms>> | null;
  userId: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Present a version with the root key and hydrated Puck forms. The stored
 * document keeps forms by reference; the editor and the public renderer need
 * the form content inlined.
 */
export async function presentSiteRegionVersion(
  root: { id: string; key: SiteRegionKey },
  version: SiteRegionVersion,
): Promise<SiteRegionVersionView> {
  return {
    id: version.id,
    rootId: root.id,
    key: root.key,
    version: version.version,
    status: version.status,
    puckData: version.puckData
      ? await hydratePuckForms(version.puckData)
      : null,
    userId: version.userId,
    publishedAt: version.publishedAt,
    scheduledAt: version.scheduledAt,
    createdAt: version.createdAt,
    updatedAt: version.updatedAt,
  };
}
