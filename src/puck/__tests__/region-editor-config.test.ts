import { describe, expect, it } from "vitest";

import { editorConfigForRegion } from "../region-editor-config";
import {
  FOOTER_REGION_COMPONENTS,
  HEADER_REGION_COMPONENTS,
} from "../region-palettes";

describe("editorConfigForRegion", () => {
  it("uses the header palette for the header editor", () => {
    const config = editorConfigForRegion("HEADER");

    expect(Object.keys(config.components)).toEqual([
      ...HEADER_REGION_COMPONENTS,
    ]);
  });

  it("uses the footer palette for the footer editor", () => {
    const config = editorConfigForRegion("FOOTER");

    expect(Object.keys(config.components)).toEqual([
      ...FOOTER_REGION_COMPONENTS,
    ]);
  });

  it("keeps header-only concerns out of the footer and vice versa", () => {
    const header = Object.keys(editorConfigForRegion("HEADER").components);
    const footer = Object.keys(editorConfigForRegion("FOOTER").components);

    expect(header).not.toContain("LinkList");
    expect(header).not.toContain("Copyright");
    expect(header).toContain("AnnouncementBar");
    expect(header).toContain("SearchBar");
    expect(footer).toContain("LinkList");
    expect(footer).toContain("Copyright");
    expect(footer).not.toContain("AnnouncementBar");
    expect(footer).not.toContain("SearchBar");
  });

  it("groups the header-only blocks under the Header category", () => {
    const header = editorConfigForRegion("HEADER");
    const footer = editorConfigForRegion("FOOTER");

    expect(header.categories?.header).toEqual({
      title: "Header",
      components: ["AnnouncementBar", "SearchBar"],
    });
    expect(footer.categories?.header).toBeUndefined();
  });

  it("returns stable, distinct configs per region", () => {
    expect(editorConfigForRegion("HEADER")).toBe(
      editorConfigForRegion("HEADER"),
    );
    expect(editorConfigForRegion("HEADER")).not.toBe(
      editorConfigForRegion("FOOTER"),
    );
  });
});
