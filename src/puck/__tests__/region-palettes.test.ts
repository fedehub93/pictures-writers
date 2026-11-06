import { describe, expect, it } from "vitest";

import type { SiteRegionKey } from "@/generated/prisma";

import { editorConfigForRegion } from "../region/editor-config";
import { renderConfigForRegion } from "../region/render-config";

const REGIONS = ["HEADER", "FOOTER"] as const satisfies readonly SiteRegionKey[];

const EXPECTED_CATEGORIES: Record<
  SiteRegionKey,
  Record<string, { title: string; components: string[] }>
> = {
  HEADER: {
    layout: { title: "Layout", components: ["Container", "Flex", "Grid"] },
    region: { title: "Site layout", components: ["Brand"] },
    header: {
      title: "Header",
      components: ["AnnouncementBar", "SearchBar", "NavbarBlock"],
    },
    basic: { title: "Basic", components: ["Link", "Image"] },
    typography: { title: "Typography", components: ["Heading", "Text"] },
  },
  FOOTER: {
    layout: { title: "Layout", components: ["Container", "Flex", "Grid"] },
    region: {
      title: "Site layout",
      components: ["Brand", "LinkList", "Copyright"],
    },
    basic: {
      title: "Basic",
      components: ["Link", "Image", "Form", "Separator"],
    },
    typography: { title: "Typography", components: ["Heading", "Text"] },
  },
};

function blockNames(config: { components: Record<string, unknown> }) {
  return Object.keys(config.components);
}

describe("Site region palettes", () => {
  it.each(REGIONS)(
    "exposes the same registered blocks in the %s editor and public render palettes",
    (region) => {
      const editor = editorConfigForRegion(region);
      const render = renderConfigForRegion(region);

      expect(blockNames(editor)).toEqual(blockNames(render));

      for (const name of blockNames(editor)) {
        expect(editor.components[name], `${name} editor entry`).toBeDefined();
        expect(render.components[name], `${name} render entry`).toBeDefined();
      }
    },
  );

  it.each(REGIONS)(
    "derives every %s editor category from the region palette",
    (region) => {
      expect(editorConfigForRegion(region).categories).toEqual(
        EXPECTED_CATEGORIES[region],
      );
    },
  );
});
