import type { Data, Metadata } from "@puckeditor/core";

import {
  isSiteLayoutPreviewState,
  type SiteLayoutPreview,
  type SiteLayoutPreviewRegion,
} from "@/modules/site-regions/lib/site-layout-preview";

/**
 * Installation details the Site region editor passes into the Puck canvas.
 *
 * Puck metadata is an untyped bag, so the blocks read it through
 * `readSiteRegionMetadata` instead of trusting its values. Keeping the shape
 * here lets region blocks (starting with Brand) preview the same Installation
 * details without importing anything from the database.
 */
export type SiteRegionMetadata = Metadata & {
  /** Installation site name, used as a canvas preview fallback. */
  siteName?: string;
  /** Installation logo URL, used as a canvas preview fallback. */
  logoUrl?: string;
};

/**
 * Read the Installation metadata injected by the Site region editor.
 *
 * Values are checked at the boundary because any Puck consumer can write to
 * the metadata bag; an empty string is treated like a missing value so the
 * block keeps its own defaults.
 */
export function readSiteRegionMetadata(
  metadata: Metadata | undefined,
): SiteRegionMetadata {
  return {
    siteName: readString(metadata?.siteName),
    logoUrl: readString(metadata?.logoUrl),
  };
}

/**
 * Read the Site layout preview injected by the page editor.
 *
 * Metadata is an untyped bag, so both regions are validated before the canvas
 * trusts them. A malformed payload simply renders no Site layout preview.
 */
export function readSiteLayoutPreview(
  metadata: Metadata | undefined,
): SiteLayoutPreview | undefined {
  const value = metadata?.siteLayout;

  if (!value || typeof value !== "object") return undefined;

  const header = readPreviewRegion((value as { header?: unknown }).header);
  const footer = readPreviewRegion((value as { footer?: unknown }).footer);

  if (!header || !footer) return undefined;

  return { header, footer };
}

function readPreviewRegion(value: unknown): SiteLayoutPreviewRegion | undefined {
  if (!value || typeof value !== "object") return undefined;

  const { data, state } = value as { data?: unknown; state?: unknown };

  if (!data || typeof data !== "object") return undefined;
  if (!isSiteLayoutPreviewState(state)) return undefined;

  return { data: data as Data, state };
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
