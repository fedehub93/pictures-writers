import type { Config } from "@puckeditor/core";

/**
 * Single source of truth for the Site region block palettes and the editor
 * categories.
 *
 * The tuples below describe the block segments a region can be composed from.
 * The Header and Footer palettes (editor and public render), and the editor
 * categories, are all derived from these tuples, so a block cannot be offered
 * in one palette and missing from another.
 *
 * This module is deliberately free of React and database imports: both the
 * public render config and the backoffice editor config consume it, so a
 * client bundle never pulls in the server-only renderers just to learn which
 * blocks a region allows.
 */

/** Layout blocks available in every Site region. */
export const REGION_LAYOUT_COMPONENTS = [
  "Container",
  "Flex",
  "Grid",
] as const;

/** Brand block available in every Site region. */
export const REGION_BRAND_COMPONENTS = ["Brand"] as const;

/** Text blocks available in every Site region. */
const REGION_TYPOGRAPHY_COMPONENTS = ["Heading", "Text"] as const;

/** Blocks in the region Basic category: the Button and media. */
const REGION_BASIC_COMPONENTS = ["Button", "Image"] as const;

/**
 * Content blocks shared by the Header and the Footer.
 *
 * Composed from the typography and media segments so the editor categories can
 * group the same line items without duplicating the block names.
 */
export const REGION_CONTENT_COMPONENTS = [
  ...REGION_TYPOGRAPHY_COMPONENTS,
  ...REGION_BASIC_COMPONENTS,
] as const;

/** Blocks that only exist inside a Header region. */
export const HEADER_ONLY_COMPONENTS = [
  "TopBar",
  "SearchBar",
  "NavbarBlock",
] as const;

/**
 * Blocks a Footer shares with the page surface. They are valid on pages, so
 * they are not part of the footer-only tuple, but the Header does not offer
 * them.
 */
const FOOTER_PAGE_COMPONENTS = ["Form", "Separator"] as const;

/**
 * Blocks that only exist inside a Footer region: absent from the Header and
 * from the page palette.
 */
export const FOOTER_ONLY_COMPONENTS = ["LinkList", "Copyright"] as const;

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
 * Blocks rendered (and offered in the editor) inside a Footer region.
 */
export const FOOTER_REGION_COMPONENTS = [
  ...REGION_LAYOUT_COMPONENTS,
  ...REGION_BRAND_COMPONENTS,
  ...REGION_CONTENT_COMPONENTS,
  ...FOOTER_PAGE_COMPONENTS,
  ...FOOTER_ONLY_COMPONENTS,
] as const;

export type RegionComponent =
  | (typeof HEADER_REGION_COMPONENTS)[number]
  | (typeof FOOTER_REGION_COMPONENTS)[number];

type RegionCategoryDefinition = {
  key: string;
  title: string;
  components: readonly RegionComponent[];
};

/**
 * Editor category definitions, expressed as views over the palette segments.
 *
 * Membership is filtered against the selected region palette before a category
 * is emitted (see `region/editor-config.tsx`), so a category can never list a
 * block that the region does not offer. Adding a block to a segment therefore
 * updates the palette and every category that uses that segment together.
 */
export const REGION_CATEGORY_DEFINITIONS = [
  {
    key: "layout",
    title: "Layout",
    components: REGION_LAYOUT_COMPONENTS,
  },
  {
    key: "region",
    title: "Site layout",
    components: [...REGION_BRAND_COMPONENTS, ...FOOTER_ONLY_COMPONENTS],
  },
  {
    key: "header",
    title: "Header",
    components: HEADER_ONLY_COMPONENTS,
  },
  {
    key: "basic",
    title: "Basic",
    components: [...REGION_BASIC_COMPONENTS, ...FOOTER_PAGE_COMPONENTS],
  },
  {
    key: "typography",
    title: "Typography",
    components: REGION_TYPOGRAPHY_COMPONENTS,
  },
] as const satisfies readonly RegionCategoryDefinition[];

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
