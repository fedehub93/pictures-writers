import type { Config } from "@puckeditor/core";

/**
 * Component names rendered by each Site region.
 *
 * This module is deliberately free of React and database imports: both the
 * public render config and the backoffice editor config are derived from these
 * tuples, so a client bundle never pulls in the server-only renderers just to
 * learn which blocks a region allows.
 */
const SHARED_REGION_COMPONENTS = [
  "Container",
  "Flex",
  "Grid",
  "Brand",
  "Heading",
  "Text",
  "Link",
  "Image",
] as const;

/**
 * Blocks rendered (and offered in the editor) inside a Header region.
 *
 * `AnnouncementBar`, `NavbarBlock` and `SearchBar` join this list with their
 * own tickets.
 */
export const HEADER_REGION_COMPONENTS = [
  ...SHARED_REGION_COMPONENTS,
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
