import type { Metadata } from "@puckeditor/core";

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

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
