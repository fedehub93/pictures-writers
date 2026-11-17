import type { Config } from "@puckeditor/core";

import type { SiteRegionKey } from "@/generated/prisma";

import {
  regionComponentConfigs,
  rootRenderConfig,
  type RenderComponentName,
} from "../render-config";
import {
  FOOTER_REGION_COMPONENTS,
  HEADER_REGION_COMPONENTS,
  pickComponentConfigs,
} from "./palettes";

/**
 * Public render palettes for each region. The `satisfies` keeps the canonical
 * tuples in `./palettes.ts` in sync with the render registry at compile time,
 * while the client-side editor imports the tuples directly and never pulls in
 * the server-only renderers.
 */
export const HEADER_RENDER_COMPONENTS =
  HEADER_REGION_COMPONENTS satisfies readonly RenderComponentName[];
export const FOOTER_RENDER_COMPONENTS =
  FOOTER_REGION_COMPONENTS satisfies readonly RenderComponentName[];

const REGION_RENDER_CONFIGS: Record<SiteRegionKey, Config> = {
  HEADER: {
    components: pickComponentConfigs(
      HEADER_RENDER_COMPONENTS,
      regionComponentConfigs,
    ),
    root: rootRenderConfig,
  },
  FOOTER: {
    components: pickComponentConfigs(
      FOOTER_RENDER_COMPONENTS,
      regionComponentConfigs,
    ),
    root: rootRenderConfig,
  },
};

/**
 * Render palette for a Site region: the footer must not render a header-only
 * block even if one is present in the stored document.
 */
export function renderConfigForRegion(key: SiteRegionKey): Config {
  return REGION_RENDER_CONFIGS[key];
}
