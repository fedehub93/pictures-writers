import { describe, expect, it } from "vitest";

import {
  getDefaultRegionPuckData,
  resolveRegionPuckData,
} from "../default-regions";

function contentTypes(data: ReturnType<typeof getDefaultRegionPuckData>) {
  return data.content.map((block) => block.type);
}

describe("getDefaultRegionPuckData", () => {
  it("returns a header with only a Brand block", () => {
    const data = getDefaultRegionPuckData("HEADER");

    expect(data.root).toEqual({});
    expect(contentTypes(data)).toEqual(["Brand"]);
    expect(data.content[0]?.props).toMatchObject({
      content: {
        showLogo: true,
        showSiteName: true,
      },
    });
  });

  it("returns a footer with only a Copyright block", () => {
    const data = getDefaultRegionPuckData("FOOTER");

    expect(data.root).toEqual({});
    expect(contentTypes(data)).toEqual(["Copyright"]);
    expect(data.content[0]?.props).toMatchObject({
      content: {
        showYear: true,
        extraText: "",
        links: [],
      },
    });
  });

  it("returns a fresh copy on every call", () => {
    const first = getDefaultRegionPuckData("HEADER");
    first.content.length = 0;

    expect(contentTypes(getDefaultRegionPuckData("HEADER"))).toEqual(["Brand"]);
  });
});

describe("resolveRegionPuckData", () => {
  it("uses the published document when the region is live", () => {
    const published = {
      root: {},
      content: [{ type: "Heading", props: { id: "published" } }],
      zones: { "published-zone": [] },
    };

    const resolved = resolveRegionPuckData("HEADER", {
      puckData: published,
    });

    expect(resolved).toBe(published);
  });

  it("falls back to the generic default when the region is missing", () => {
    expect(contentTypes(resolveRegionPuckData("FOOTER", null))).toEqual([
      "Copyright",
    ]);
  });

  it("falls back to the generic default when the live version has no document", () => {
    expect(
      contentTypes(resolveRegionPuckData("HEADER", { puckData: null })),
    ).toEqual(["Brand"]);
  });
});
