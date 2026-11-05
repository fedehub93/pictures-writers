import { describe, expect, it } from "vitest";

import {
  FOOTER_RENDER_COMPONENTS,
  HEADER_RENDER_COMPONENTS,
  renderConfigForRegion,
} from "../region-render-config";
import { pageRenderConfig } from "../render-config";

describe("renderConfigForRegion", () => {
  it("uses the header palette for the header region", () => {
    const config = renderConfigForRegion("HEADER");

    expect(Object.keys(config.components)).toEqual([...HEADER_RENDER_COMPONENTS]);
  });

  it("uses the footer palette for the footer region", () => {
    const config = renderConfigForRegion("FOOTER");

    expect(Object.keys(config.components)).toEqual([...FOOTER_RENDER_COMPONENTS]);
  });

  it("keeps header-only blocks out of the footer and pages", () => {
    const header = Object.keys(renderConfigForRegion("HEADER").components);
    const footer = Object.keys(renderConfigForRegion("FOOTER").components);
    const page = Object.keys(pageRenderConfig.components);

    expect(header).toContain("AnnouncementBar");
    expect(header).toContain("SearchBar");
    expect(header).toContain("NavbarBlock");
    expect(footer).not.toContain("AnnouncementBar");
    expect(footer).not.toContain("SearchBar");
    expect(footer).not.toContain("NavbarBlock");
    expect(page).not.toContain("AnnouncementBar");
    expect(page).not.toContain("SearchBar");
    expect(page).not.toContain("NavbarBlock");
  });

  it("keeps footer-only blocks out of the header", () => {
    const header = Object.keys(renderConfigForRegion("HEADER").components);

    expect(header).not.toContain("Form");
    expect(header).not.toContain("Separator");
    expect(header).not.toContain("LinkList");
    expect(header).not.toContain("Copyright");
  });

  it("makes the footer blocks available only in the footer palette", () => {
    const footer = Object.keys(renderConfigForRegion("FOOTER").components);

    expect(footer).toContain("LinkList");
    expect(footer).toContain("Copyright");
    expect(Object.keys(pageRenderConfig.components)).not.toContain("LinkList");
    expect(Object.keys(pageRenderConfig.components)).not.toContain("Copyright");
  });

  it("makes the Brand block available in both regions but not in pages", () => {
    expect(Object.keys(renderConfigForRegion("HEADER").components)).toContain(
      "Brand",
    );
    expect(Object.keys(renderConfigForRegion("FOOTER").components)).toContain(
      "Brand",
    );
    expect(Object.keys(pageRenderConfig.components)).not.toContain("Brand");
  });

  it("makes the Text block available in both regions", () => {
    expect(Object.keys(renderConfigForRegion("HEADER").components)).toContain(
      "Text",
    );
    expect(Object.keys(renderConfigForRegion("FOOTER").components)).toContain(
      "Text",
    );
  });

  it("returns stable, distinct configs per region", () => {
    expect(renderConfigForRegion("HEADER")).toBe(
      renderConfigForRegion("HEADER"),
    );
    expect(renderConfigForRegion("HEADER")).not.toBe(
      renderConfigForRegion("FOOTER"),
    );
  });

  it("registers the Text block in the generic page palette", () => {
    expect(Object.keys(pageRenderConfig.components)).toContain("Text");
  });
});
