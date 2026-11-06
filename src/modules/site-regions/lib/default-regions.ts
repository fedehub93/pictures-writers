import type { Data } from "@puckeditor/core";

import type { SiteRegionKey } from "@/generated/prisma";

import { BRAND_DEFAULT_CONTENT } from "@/puck/blocks/Brand/defaults";

/**
 * Generic fallbacks for a Site region that has never been published.
 *
 * They are intentionally brand-neutral: a fresh Installation gets a header
 * with only its Brand and a footer with only its Copyright. The matching Puck
 * blocks are registered in the Header/Footer palettes by their own tickets;
 * until then Puck skips unknown component types at render time.
 */
const DEFAULT_REGION_PUCK_DATA: Record<SiteRegionKey, Data> = {
  HEADER: {
    root: {},
    content: [
      {
        type: "Brand",
        props: {
          id: "default-header-brand",
          content: BRAND_DEFAULT_CONTENT,
        },
      },
    ],
  },
  FOOTER: {
    root: {},
    content: [
      {
        type: "Copyright",
        props: {
          id: "default-footer-copyright",
          showYear: true,
        },
      },
    ],
  },
};

/**
 * Return a fresh copy of the generic fallback for a region.
 *
 * The copy keeps callers from mutating the shared template, which would leak
 * into every other request served by the same process.
 */
export function getDefaultRegionPuckData(key: SiteRegionKey): Data {
  return structuredClone(DEFAULT_REGION_PUCK_DATA[key]);
}

/**
 * Pick the published document for a region, falling back to the generic
 * default when the region does not exist or was never published.
 *
 * A published empty document is a deliberate choice (a headerless site), so
 * only a null document triggers the fallback.
 */
export function resolveRegionPuckData(
  key: SiteRegionKey,
  live: { puckData: Data | null } | null,
): Data {
  return live?.puckData ?? getDefaultRegionPuckData(key);
}
