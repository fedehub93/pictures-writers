import type { Config } from "@puckeditor/core";

import type { SiteRegionKey } from "@/generated/prisma";

import type { RootProps } from "./root";
import {
  renderComponentConfigs,
  rootRenderConfig,
  type RenderComponentName,
} from "./render-config";

/**
 * Blocks shared by both Site regions.
 */
const SHARED_REGION_COMPONENTS = [
  "Container",
  "Flex",
  "Grid",
  "Heading",
  "Text",
  "Link",
  "Image",
] as const satisfies readonly RenderComponentName[];

/**
 * Blocks rendered inside a Header region.
 *
 * `Brand`, `AnnouncementBar`, `NavbarBlock` and `SearchBar` join this list
 * with their own blocks (header and navbar tickets).
 */
export const HEADER_RENDER_COMPONENTS = [
  ...SHARED_REGION_COMPONENTS,
] as const satisfies readonly RenderComponentName[];

/**
 * Blocks rendered inside a Footer region.
 *
 * `LinkList` and `Copyright` join this list with their own blocks (footer
 * ticket).
 */
export const FOOTER_RENDER_COMPONENTS = [
  ...SHARED_REGION_COMPONENTS,
  "Form",
  "Separator",
] as const satisfies readonly RenderComponentName[];

function pickComponentConfigs(
  names: readonly RenderComponentName[],
): Config<any, RootProps>["components"] {
  return Object.fromEntries(
    names.map((name) => [name, renderComponentConfigs[name]]),
  ) as Config<any, RootProps>["components"];
}

const REGION_RENDER_CONFIGS: Record<SiteRegionKey, Config<any, RootProps>> = {
  HEADER: {
    components: pickComponentConfigs(HEADER_RENDER_COMPONENTS),
    root: rootRenderConfig,
  },
  FOOTER: {
    components: pickComponentConfigs(FOOTER_RENDER_COMPONENTS),
    root: rootRenderConfig,
  },
};

/**
 * Render palette for a Site region: the footer must not render a header-only
 * block even if one is present in the stored document.
 */
export function renderConfigForRegion(
  key: SiteRegionKey,
): Config<any, RootProps> {
  return REGION_RENDER_CONFIGS[key];
}
