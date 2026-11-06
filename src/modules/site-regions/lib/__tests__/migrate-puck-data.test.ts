import { describe, expect, it } from "vitest";

import { migrateSiteRegionPuckData } from "../migrate-puck-data";

function documentWith(block: Record<string, unknown>) {
  return {
    root: {},
    content: [block],
  };
}

describe("migrateSiteRegionPuckData", () => {
  it("moves the Brand flat props into content", () => {
    const input = documentWith({
      type: "Brand",
      props: {
        id: "brand-1",
        showLogo: false,
        showSiteName: true,
        customText: "Pictures Writers",
        customLogoUrl: "/logo.png",
        dimension: { desktop: { width: "auto" } },
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "brand-1",
      content: {
        showLogo: false,
        showSiteName: true,
        customText: "Pictures Writers",
        customLogoUrl: "/logo.png",
      },
      dimension: { desktop: { width: "auto" } },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Brand",
        componentId: "brand-1",
        fields: ["showLogo", "showSiteName", "customText", "customLogoUrl"],
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("moves the Search bar flat props into content", () => {
    const input = documentWith({
      type: "SearchBar",
      props: {
        id: "search-1",
        placeholder: "Search the blog",
        variant: "compact",
        decoration: { desktop: { background: "#fff" } },
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "search-1",
      content: {
        placeholder: "Search the blog",
        variant: "compact",
      },
      decoration: { desktop: { background: "#fff" } },
    });
    expect(result.changes[0]?.fields).toEqual(["placeholder", "variant"]);
  });

  it("moves the NavbarBlock layout and items into content", () => {
    const items = [
      {
        type: "link",
        label: "Home",
        link: { type: "external", url: "/" },
      },
    ];
    const input = documentWith({
      type: "NavbarBlock",
      props: {
        id: "navbar-1",
        layout: "mega",
        items,
        dimension: { desktop: { width: "full" } },
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "navbar-1",
      content: { layout: "mega", items },
      dimension: { desktop: { width: "full" } },
    });
    expect(result.changes[0]).toMatchObject({
      componentType: "NavbarBlock",
      componentId: "navbar-1",
      fields: ["items", "layout"],
    });
  });

  it("moves the Link list title and links into content", () => {
    const links = [
      {
        label: "About",
        link: { type: "external", url: "/about/" },
      },
    ];
    const input = documentWith({
      type: "LinkList",
      props: {
        id: "link-list-1",
        title: "Company",
        links,
        typography: { desktop: { fontSize: "0.875rem" } },
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "link-list-1",
      content: { title: "Company", links },
      typography: { desktop: { fontSize: "0.875rem" } },
    });
    expect(result.changes[0]?.fields).toEqual(["title", "links"]);
  });

  it("moves the Copyright flat props into content", () => {
    const links = [
      {
        label: "Privacy",
        link: { type: "external", url: "/privacy/" },
      },
    ];
    const input = documentWith({
      type: "Copyright",
      props: {
        id: "copyright-1",
        showYear: false,
        extraText: "All rights reserved.",
        links,
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "copyright-1",
      content: {
        showYear: false,
        extraText: "All rights reserved.",
        links,
      },
    });
    expect(result.changes[0]?.fields).toEqual([
      "showYear",
      "extraText",
      "links",
    ]);
  });

  it("converts blocks nested in slots and zones", () => {
    const input = {
      root: {},
      content: [
        {
          type: "TopBar",
          props: {
            id: "top-bar-1",
            content: [
              {
                type: "Brand",
                props: {
                  id: "nested-brand",
                  showLogo: true,
                  showSiteName: false,
                },
              },
            ],
            settings: { dismissible: true },
          },
        },
      ],
      zones: {
        "footer-zone": [
          {
            type: "LinkList",
            props: {
              id: "zoned-link-list",
              title: "Legal",
              links: [],
            },
          },
        ],
      },
    };

    const result = migrateSiteRegionPuckData(input);

    expect(
      (result.data.content[0]?.props as { content: unknown[] }).content[0],
    ).toMatchObject({
      props: { content: { showLogo: true, showSiteName: false } },
    });
    expect(
      (result.data.zones as { "footer-zone": unknown[] })["footer-zone"][0],
    ).toMatchObject({
      props: { content: { title: "Legal", links: [] } },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Brand",
        componentId: "nested-brand",
        fields: ["showLogo", "showSiteName"],
      },
      {
        componentType: "LinkList",
        componentId: "zoned-link-list",
        fields: ["title", "links"],
      },
    ]);
  });

  it("leaves an already migrated document unchanged", () => {
    const input = {
      root: {},
      content: [
        {
          type: "Brand",
          props: {
            id: "brand-1",
            content: {
              showLogo: true,
              showSiteName: false,
              customText: "Pictures Writers",
            },
            dimension: { desktop: { width: "auto" } },
          },
        },
        {
          type: "Copyright",
          props: {
            id: "copyright-1",
            content: { showYear: true, links: [] },
            typography: { desktop: { fontSize: "0.875rem" } },
          },
        },
      ],
    };

    const result = migrateSiteRegionPuckData(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("is idempotent: a second run produces the same document and no changes", () => {
    const input = documentWith({
      type: "Brand",
      props: {
        id: "brand-1",
        showLogo: true,
        showSiteName: true,
      },
    });

    const first = migrateSiteRegionPuckData(input);
    const second = migrateSiteRegionPuckData(first.data);

    expect(second.data).toEqual(first.data);
    expect(second.changes).toEqual([]);
    expect(second.warnings).toEqual([]);
  });

  it("does not mutate the input document", () => {
    const input = documentWith({
      type: "Copyright",
      props: {
        id: "copyright-1",
        showYear: true,
        extraText: "All rights reserved.",
        links: [],
      },
    });
    const snapshot = structuredClone(input);

    migrateSiteRegionPuckData(input);

    expect(input).toEqual(snapshot);
  });

  it("preserves unknown component types and reports the legacy AnnouncementBar block", () => {
    const input = {
      root: {},
      content: [
        {
          type: "Mystery",
          props: {
            id: "mystery-1",
            showLogo: true,
            content: { showLogo: false },
          },
        },
        {
          type: "AnnouncementBar",
          props: {
            id: "announcement-1",
            text: "Free shipping",
            link: { type: "external", url: "/shipping/" },
          },
        },
      ],
    };

    const result = migrateSiteRegionPuckData(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([
      {
        componentType: "AnnouncementBar",
        componentId: "announcement-1",
        reason:
          "legacy AnnouncementBar block is not migrated; recreate it as a Top bar in the editor",
      },
    ]);
  });

  it("merges stale flat props into an existing content object", () => {
    const input = documentWith({
      type: "Brand",
      props: {
        id: "brand-1",
        content: { customText: "Pictures Writers" },
        showLogo: false,
        showSiteName: true,
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "brand-1",
      content: {
        customText: "Pictures Writers",
        showLogo: false,
        showSiteName: true,
      },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Brand",
        componentId: "brand-1",
        fields: ["showLogo", "showSiteName"],
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps the nested value and reports a duplicate flat prop", () => {
    const input = documentWith({
      type: "Copyright",
      props: {
        id: "copyright-1",
        content: { showYear: false },
        showYear: true,
      },
    });

    const result = migrateSiteRegionPuckData(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "copyright-1",
      content: { showYear: false },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Copyright",
        componentId: "copyright-1",
        fields: ["showYear"],
      },
    ]);
    expect(result.warnings).toEqual([
      {
        componentType: "Copyright",
        componentId: "copyright-1",
        reason: 'content already defines "showYear"; flat value discarded',
      },
    ]);
  });

  it("does not throw on component types that collide with object prototypes", () => {
    const input = {
      root: {},
      content: [
        { type: "constructor", props: { showLogo: true } },
        { type: "toString", props: { title: "Links" } },
        { type: "__proto__", props: { links: [] } },
      ],
    };

    const result = migrateSiteRegionPuckData(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("skips malformed component data without throwing", () => {
    const input = {
      root: {},
      content: [
        { type: "Brand", props: "not an object" },
        { type: "NavbarBlock" },
        { type: "Copyright", props: null },
        { type: "LinkList", props: ["not", "an", "object"] },
        { type: 42, props: {} },
        { type: "Brand", props: { id: "broken-content", content: "nope", showLogo: true } },
        null,
        "not a block",
      ],
    };

    const result = migrateSiteRegionPuckData(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([
      {
        componentType: "Brand",
        componentId: "broken-content",
        reason: "content is not an object; flat props left unchanged",
      },
    ]);
  });
});
