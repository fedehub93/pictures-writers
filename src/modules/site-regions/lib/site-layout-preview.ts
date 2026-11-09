import type { Data } from "@puckeditor/core";

/**
 * Which document a Site region shows in the page editor canvas.
 *
 * - `live`: the published version (the code default when none exists).
 * - `draft`: the current version because it differs from the live one.
 * - `default`: the code fallback, used while the region has no live version.
 */
export type SiteLayoutPreviewState = "live" | "draft" | "default";

export interface SiteLayoutPreviewRegion {
  /** Puck document ready for rendering: links resolved and forms hydrated. */
  data: Data;
  state: SiteLayoutPreviewState;
}

/**
 * Read-only Header and Footer documents drawn around the Page being edited.
 *
 * It is not part of the Page document and never reaches the published layout.
 */
export interface SiteLayoutPreview {
  header: SiteLayoutPreviewRegion;
  footer: SiteLayoutPreviewRegion;
}

export const SITE_LAYOUT_PREVIEW_STATES: readonly SiteLayoutPreviewState[] = [
  "live",
  "draft",
  "default",
];

export function isSiteLayoutPreviewState(
  value: unknown,
): value is SiteLayoutPreviewState {
  return (
    typeof value === "string" &&
    (SITE_LAYOUT_PREVIEW_STATES as readonly string[]).includes(value)
  );
}
