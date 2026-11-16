import { describe, expect, it } from "vitest";

import { migrateLayoutBlocks } from "../migrate-layout-blocks";

const TEXT_CHILD = {
  type: "Text",
  props: { id: "text-1", text: "<p>Hello</p>" },
};

/**
 * A page document as the editor stores it: blocks live in `content`, nested
 * blocks in the parent's `items`, and a zone holds blocks of its own.
 */
function pageDocument() {
  return {
    root: { props: { title: "Home" } },
    content: [
      {
        type: "Grid",
        props: {
          id: "grid-1",
          items: [TEXT_CHILD],
          size: { desktop: { maxWidth: "72rem" } },
          spacing: { desktop: { paddingTop: "1rem" } },
        },
      },
    ],
    zones: {},
  };
}

describe("migrateLayoutBlocks", () => {
  it("writes the retired mode into the desktop rung when no rung declares a display", () => {
    const result = migrateLayoutBlocks(pageDocument());

    expect(result.data.content[0]).toEqual({
      type: "Container",
      props: {
        id: "grid-1",
        items: [TEXT_CHILD],
        size: { desktop: { maxWidth: "72rem" } },
        spacing: { desktop: { paddingTop: "1rem" } },
        layout: { desktop: { display: "grid" } },
      },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Grid",
        componentId: "grid-1",
        display: "grid",
        wroteDisplay: true,
      },
    ]);
  });

  it("leaves an authored display alone", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Flex",
          props: {
            id: "flex-1",
            items: [],
            layout: {
              desktop: { display: "block", rowGap: "2rem" },
              mobile: { display: "flex" },
            },
          },
        },
      ],
    };

    const result = migrateLayoutBlocks(input);

    expect(result.data.content[0]).toEqual({
      type: "Container",
      props: {
        id: "flex-1",
        items: [],
        layout: {
          desktop: { display: "block", rowGap: "2rem" },
          mobile: { display: "flex" },
        },
      },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Flex",
        componentId: "flex-1",
        display: "flex",
        wroteDisplay: false,
      },
    ]);
  });

  it("keeps an authored display carried by a narrower rung", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Grid",
          props: {
            id: "grid-1",
            items: [],
            layout: { tablet: { display: "block" } },
          },
        },
      ],
    };

    const result = migrateLayoutBlocks(input);

    expect(result.data.content[0]?.props.layout).toEqual({
      tablet: { display: "block" },
    });
    expect(result.changes[0]?.wroteDisplay).toBe(false);
  });

  it("converts a node nested in a zone", () => {
    const input = {
      root: { props: {} },
      content: [],
      zones: {
        "page-footer": [
          {
            type: "Flex",
            props: { id: "zoned-flex", items: [TEXT_CHILD] },
          },
        ],
      },
    };

    const result = migrateLayoutBlocks(input);

    const zoned = (
      result.data.zones as Record<string, { type: string; props: Record<string, unknown> }[]>
    )["page-footer"];

    expect(zoned?.[0]).toEqual({
      type: "Container",
      props: {
        id: "zoned-flex",
        items: [TEXT_CHILD],
        layout: { desktop: { display: "flex" } },
      },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Flex",
        componentId: "zoned-flex",
        display: "flex",
        wroteDisplay: true,
      },
    ]);
  });

  it("preserves props it does not own, including the children", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Grid",
          props: {
            id: "grid-1",
            custom: { nested: true },
            decoration: { desktop: { backgroundColor: "#000" } },
            items: [TEXT_CHILD],
          },
        },
      ],
    };

    const result = migrateLayoutBlocks(input);

    expect(result.data.content[0]?.props).toMatchObject({
      id: "grid-1",
      custom: { nested: true },
      decoration: { desktop: { backgroundColor: "#000" } },
      items: [TEXT_CHILD],
    });
  });

  it("reports no changes on a second run and leaves the document as it was", () => {
    const first = migrateLayoutBlocks(pageDocument());
    const second = migrateLayoutBlocks(first.data);

    expect(second.data).toEqual(first.data);
    expect(second.changes).toEqual([]);
  });

  it("does not mutate the input document", () => {
    const input = pageDocument();
    const snapshot = structuredClone(input);

    migrateLayoutBlocks(input);

    expect(input).toEqual(snapshot);
  });

  it("leaves a document with no retired block untouched", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Container",
          props: { id: "container-1", items: [], layout: { desktop: { display: "flex" } } },
        },
      ],
    };

    const result = migrateLayoutBlocks(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("preserves and reports a retired node whose props are not an object", () => {
    const input = {
      root: { props: {} },
      content: [{ type: "Grid", props: "not an object" }],
    };

    const result = migrateLayoutBlocks(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([
      {
        componentType: "Grid",
        reason: "props is not an object; left unchanged",
      },
    ]);
  });
});
