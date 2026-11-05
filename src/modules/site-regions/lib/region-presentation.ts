import type { ContentStatus, SiteRegionKey } from "@/generated/prisma";

export type SiteRegionStatusBadgeVariant =
  | "default"
  | "secondary"
  | "outline";

export interface SiteRegionVersionSummaryInput {
  id: string;
  version: number;
  status: ContentStatus;
  updatedAt: Date;
}

export interface SiteRegionLiveVersionSummaryInput {
  version: number;
  publishedAt: Date | null;
}

export interface SiteRegionSummaryInput {
  id: string;
  currentVersion: SiteRegionVersionSummaryInput | null;
  liveVersion: SiteRegionLiveVersionSummaryInput | null;
  updatedAt: Date;
}

export interface SiteRegionSummary {
  key: SiteRegionKey;
  title: string;
  description: string;
  status: ContentStatus | null;
  rootId: string | null;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  liveVersionNumber: number | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
}

export const SITE_REGION_LABELS: Record<SiteRegionKey, string> = {
  HEADER: "Header",
  FOOTER: "Footer",
};

const SITE_REGION_PRESENTATION: Record<
  SiteRegionKey,
  { description: string }
> = {
  HEADER: {
    description:
      "The shared top area of every public page: brand, navigation and announcement bar.",
  },
  FOOTER: {
    description:
      "The shared bottom area of every public page: link lists, copyright and optional forms.",
  },
};

const STATUS_PRESENTATION: Record<
  ContentStatus,
  { label: string; variant: SiteRegionStatusBadgeVariant }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  CHANGED: { label: "Unpublished changes", variant: "secondary" },
  PUBLISHED: { label: "Published", variant: "default" },
  SCHEDULED: { label: "Scheduled", variant: "outline" },
};

/**
 * Flatten a region row into the fields the backoffice list needs. Missing
 * regions stay in the list as "Not created" so both Site regions always have a
 * discoverable entry point.
 */
export function toSiteRegionSummary(
  key: SiteRegionKey,
  region: SiteRegionSummaryInput | null,
): SiteRegionSummary {
  const presentation = SITE_REGION_PRESENTATION[key];

  return {
    key,
    title: SITE_REGION_LABELS[key],
    ...presentation,
    status: region?.currentVersion?.status ?? null,
    rootId: region?.id ?? null,
    currentVersionId: region?.currentVersion?.id ?? null,
    currentVersionNumber: region?.currentVersion?.version ?? null,
    liveVersionNumber: region?.liveVersion?.version ?? null,
    publishedAt: region?.liveVersion?.publishedAt ?? null,
    // The root row is only touched when a version forks, so the current
    // version is the honest "last updated" signal for in-place draft saves.
    updatedAt: region?.currentVersion?.updatedAt ?? region?.updatedAt ?? null,
  };
}

export function getSiteRegionStatusLabel(
  status: ContentStatus | null,
): string {
  return status === null ? "Not created" : STATUS_PRESENTATION[status].label;
}

export function getSiteRegionStatusVariant(
  status: ContentStatus | null,
): SiteRegionStatusBadgeVariant {
  return status === null
    ? "outline"
    : STATUS_PRESENTATION[status].variant;
}
