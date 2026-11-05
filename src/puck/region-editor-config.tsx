import type { Config } from "@puckeditor/core";

import type { SiteRegionKey } from "@/generated/prisma";

import { editorComponentConfigs } from "./custom-config";
import { RootEditor } from "./root";
import {
  FOOTER_REGION_COMPONENTS,
  HEADER_ONLY_COMPONENTS,
  HEADER_REGION_COMPONENTS,
  pickComponentConfigs,
  type RegionComponent,
} from "./region-palettes";

const CATEGORY_COMPONENTS: Array<{
  key: string;
  title: string;
  components: readonly RegionComponent[];
}> = [
  {
    key: "layout",
    title: "Layout",
    components: ["Container", "Flex", "Grid"],
  },
  {
    key: "region",
    title: "Site layout",
    components: ["Brand", "LinkList", "Copyright"],
  },
  {
    key: "header",
    title: "Header",
    components: [...HEADER_ONLY_COMPONENTS],
  },
  {
    key: "basic",
    title: "Basic",
    components: ["Link", "Image", "Form", "Separator"],
  },
  {
    key: "typography",
    title: "Typography",
    components: ["Heading", "Text"],
  },
];

function buildCategories(componentNames: readonly RegionComponent[]) {
  const categories: Record<
    string,
    { title: string; components: RegionComponent[] }
  > = {};

  for (const category of CATEGORY_COMPONENTS) {
    const components = category.components.filter((name) =>
      componentNames.includes(name),
    );

    if (components.length > 0) {
      categories[category.key] = { title: category.title, components };
    }
  }

  return categories as Config["categories"];
}

function buildEditorConfig(names: readonly RegionComponent[]): Config {
  return {
    categories: buildCategories(names),
    components: pickComponentConfigs(names, editorComponentConfigs),
    root: RootEditor,
  };
}

const REGION_EDITOR_CONFIGS: Record<SiteRegionKey, Config> = {
  HEADER: buildEditorConfig(HEADER_REGION_COMPONENTS),
  FOOTER: buildEditorConfig(FOOTER_REGION_COMPONENTS),
};

/**
 * Puck editor palette for a Site region.
 *
 * The Header and Footer deliberately receive different component maps: a
 * `LinkList` cannot be dragged into the header, and header-only blocks added by
 * later tickets never leak into the footer editor.
 */
export function editorConfigForRegion(key: SiteRegionKey): Config {
  return REGION_EDITOR_CONFIGS[key];
}
