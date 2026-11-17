import type { Config } from "@puckeditor/core";

import type { SiteRegionKey } from "@/generated/prisma";

import { editorComponentConfigs } from "../config";
import { RootEditor } from "../root";
import { HeaderRootEditor } from "../root/header";
import {
  FOOTER_REGION_COMPONENTS,
  HEADER_REGION_COMPONENTS,
  REGION_CATEGORY_DEFINITIONS,
  pickComponentConfigs,
  type RegionComponent,
} from "./palettes";

function buildCategories(componentNames: readonly RegionComponent[]) {
  const categories: Record<
    string,
    { title: string; components: RegionComponent[] }
  > = {};

  for (const category of REGION_CATEGORY_DEFINITIONS) {
    const components = category.components.filter((name) =>
      componentNames.includes(name),
    );

    if (components.length > 0) {
      categories[category.key] = { title: category.title, components };
    }
  }

  return categories as Config["categories"];
}

function buildEditorConfig(
  names: readonly RegionComponent[],
  root: Config["root"],
): Config {
  return {
    categories: buildCategories(names),
    components: pickComponentConfigs(names, editorComponentConfigs),
    root,
  };
}

const REGION_EDITOR_CONFIGS: Record<SiteRegionKey, Config> = {
  HEADER: buildEditorConfig(HEADER_REGION_COMPONENTS, HeaderRootEditor),
  FOOTER: buildEditorConfig(FOOTER_REGION_COMPONENTS, RootEditor),
};

/**
 * Puck editor palette for a Site region.
 *
 * The Header and Footer deliberately receive different component maps: a
 * `LinkList` cannot be dragged into the header, and header-only blocks never
 * leak into the footer editor.
 */
export function editorConfigForRegion(key: SiteRegionKey): Config {
  return REGION_EDITOR_CONFIGS[key];
}
