import type {
  SiteLayoutPreview,
  SiteLayoutPreviewState,
} from "./site-layout-preview";
import { SITE_REGION_LABELS } from "./region-presentation";

/** The two Site regions, derived from the preview payload keys. */
export type SiteLayoutPreviewRegionKey = keyof SiteLayoutPreview;

export interface SiteLayoutStatusChip {
  /** Full chip text, for example `Header: bozza`. */
  label: string;
  /** Tooltip explaining what the state means for visitors. */
  title: string;
}

const REGION_LABELS: Record<SiteLayoutPreviewRegionKey, string> = {
  header: SITE_REGION_LABELS.HEADER,
  footer: SITE_REGION_LABELS.FOOTER,
};

const REGIONS = Object.keys(REGION_LABELS) as SiteLayoutPreviewRegionKey[];

/**
 * Chip copy for every preview state. A live region needs no warning, so it
 * maps to `null` and the status chip list simply skips it.
 */
const STATE_PRESENTATION: Record<
  SiteLayoutPreviewState,
  { label: string; title: string } | null
> = {
  live: null,
  draft: {
    label: "bozza",
    title:
      "Bozza: questa regione non è visibile ai visitatori finché non viene pubblicata.",
  },
  default: {
    label: "predefinito",
    title:
      "Predefinito: è il fallback del codice usato finché la regione non viene pubblicata.",
  },
};

/**
 * Chip describing a Site region that is not live in the page editor canvas.
 *
 * Pure mapping over the preview state, so the copy can be tested without
 * rendering the editor header bar.
 */
export function getSiteLayoutStatusChip(
  region: SiteLayoutPreviewRegionKey,
  state: SiteLayoutPreviewState,
): SiteLayoutStatusChip | null {
  const presentation = STATE_PRESENTATION[state];

  if (!presentation) return null;

  return {
    label: `${REGION_LABELS[region]}: ${presentation.label}`,
    title: presentation.title,
  };
}

/** Chips for every not-live region, header first. Empty when all are live. */
export function getSiteLayoutStatusChips(
  preview: SiteLayoutPreview,
): SiteLayoutStatusChip[] {
  return REGIONS.flatMap((region) => {
    const chip = getSiteLayoutStatusChip(region, preview[region].state);
    return chip ? [chip] : [];
  });
}
