import type { Config } from "@puckeditor/core";

/**
 * Component names rendered by each Site region.
 *
 * This module is deliberately free of React and database imports: both the
 * public render config and the backoffice editor config are derived from these
 * tuples, so a client bundle never pulls in the server-only renderers just to
 * learn which blocks a region allows.
 *
 * The shared blocks are split into segments so the Header can insert its own
 * blocks between the brand and the content without duplicating the list.
 */
const REGION_LAYOUT_COMPONENTS = ["Container", "Flex", "Grid"] as const;
const REGION_BRAND_COMPONENTS = ["Brand"] as const;
const REGION_CONTENT_COMPONENTS = ["Heading", "Text", "Link", "Image"] as const;

const SHARED_REGION_COMPONENTS = [
  ...REGION_LAYOUT_COMPONENTS,
  ...REGION_BRAND_COMPONENTS,
  ...REGION_CONTENT_COMPONENTS,
] as const;

/**
 * Header-only blocks. `NavbarBlock` joins this list with its own ticket; the
 * editor "Header" category reads this tuple so the two cannot drift.
 */
export const HEADER_ONLY_COMPONENTS = [
  "AnnouncementBar",
  "SearchBar",
] as const;

/**
 * Blocks rendered (and offered in the editor) inside a Header region.
 */
export const HEADER_REGION_COMPONENTS = [
  ...REGION_LAYOUT_COMPONENTS,
  ...REGION_BRAND_COMPONENTS,
  ...HEADER_ONLY_COMPONENTS,
  ...REGION_CONTENT_COMPONENTS,
] as const;

/**
 * Blocks rendered inside a Footer region.
 *
 * `LinkList` and `Copyright` are footer-only: they are deliberately absent
 * from the page and header palettes.
 */
export const FOOTER_REGION_COMPONENTS = [
  ...SHARED_REGION_COMPONENTS,
  "Form",
  "Separator",
  "LinkList",
  "Copyright",
] as const;

export type RegionComponent =
  | (typeof HEADER_REGION_COMPONENTS)[number]
  | (typeof FOOTER_REGION_COMPONENTS)[number];

/**
 * Pick a component map in the same order as a region palette. Shared by the
 * public renderer and the editor so the two can never disagree on which blocks
 * a region exposes.
 */
export function pickComponentConfigs(
  names: readonly string[],
  components: Config["components"],
): Config["components"] {
  return Object.fromEntries(
    names.map((name) => [name, components[name]]),
  ) as Config["components"];
}
