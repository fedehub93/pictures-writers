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

  it("keeps footer-only blocks out of the header", () => {
    const header = Object.keys(renderConfigForRegion("HEADER").components);

    expect(header).not.toContain("Form");
    expect(header).not.toContain("Separator");
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
