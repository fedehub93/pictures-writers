import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Config } from "@puckeditor/core";

import { config as pageEditorConfig } from "../config";
import { ElementsPalette } from "../editor/ui/view/element-palette";
import { editorConfigForRegion } from "../region/editor-config";

const noop = () => undefined;

/** Every editor palette, with the groups it must draw, in declaration order. */
const PALETTES: Record<string, { config: Config; groups: string[] }> = {
  page: {
    config: pageEditorConfig,
    groups: ["Layout", "Basic", "Typography", "Actions"],
  },
  header: {
    config: editorConfigForRegion("HEADER"),
    groups: ["Layout", "Site layout", "Header", "Basic", "Typography"],
  },
  footer: {
    config: editorConfigForRegion("FOOTER"),
    groups: ["Layout", "Site layout", "Basic", "Typography"],
  },
};

function renderPalette(search = "", config: Config = pageEditorConfig) {
  return renderToStaticMarkup(
    <ElementsPalette config={config} search={search} onSearchChange={noop} />,
  );
}

/** The group headings, in the order the palette draws them. */
function groupTitles(html: string) {
  return [...html.matchAll(/<h3[^>]*>(.*?)<\/h3>/g)].map(([, title]) => title);
}

/** Whether a tile with this label is offered. Labels are the only text nodes. */
function offers(html: string, label: string) {
  return html.includes(`>${label}<`);
}

describe("the elements palette", () => {
  it.each(Object.entries(PALETTES))(
    "draws the %s palette one group per category, in declaration order",
    (_name, palette) => {
      expect(groupTitles(renderPalette("", palette.config))).toEqual(
        palette.groups,
      );
    },
  );

  it("offers the Container tile and no retired layout block", () => {
    const html = renderPalette();

    expect(offers(html, "Container")).toBe(true);
    // Flex and Grid are retired: they are no longer registered and no category
    // lists them, so the palette must not offer their tiles.
    expect(offers(html, "Flex")).toBe(false);
    expect(offers(html, "Grid")).toBe(false);
  });

  it("filters by label, case-insensitively, and keeps the grouping", () => {
    const html = renderPalette("ON");

    expect(groupTitles(html)).toEqual(["Layout", "Basic", "Actions"]);
    expect(offers(html, "Container")).toBe(true);
    expect(offers(html, "Icon")).toBe(true);
    expect(offers(html, "Button")).toBe(true);
    expect(offers(html, "Image")).toBe(false);
    expect(offers(html, "Separator")).toBe(false);
    expect(offers(html, "Heading")).toBe(false);
  });

  it("shows an empty state instead of a blank panel", () => {
    const html = renderPalette("calendar");

    expect(groupTitles(html)).toEqual([]);
    expect(html).toContain(`No blocks match &quot;calendar&quot;`);
    expect(offers(html, "Container")).toBe(false);
  });

  it("draws no decorative group heading or badge", () => {
    const html = renderPalette();

    expect(html).not.toContain("Atomic Elements");
    expect(html).not.toContain(">New<");
  });
});
