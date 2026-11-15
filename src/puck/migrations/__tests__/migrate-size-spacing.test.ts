import { describe, expect, it } from "vitest";

import { migrateSizeSpacing } from "../migrate-size-spacing";

/**
 * A page document as the editor stores it: the root holds props but no `type`,
 * and blocks live in `content`, in slots under `props`, and in `zones`.
 */
function pageDocument() {
  return {
    root: {
      props: {
        dimension: {
          desktop: { maxWidth: "72rem", marginLeft: "auto", marginRight: "auto" },
          tablet: { paddingLeft: "1rem", paddingRight: "1rem" },
        },
      },
    },
    content: [
      {
        type: "Button",
        props: {
          id: "button-1",
          label: "Read more",
          dimension: {
            desktop: { width: "12rem", height: "3rem", paddingTop: "0.5rem" },
            mobile: { width: "100%", paddingBottom: "1rem" },
          },
        },
      },
    ],
    zones: {},
  };
}

describe("migrateSizeSpacing", () => {
  it("splits the dimension of the root and of a page block", () => {
    const result = migrateSizeSpacing(pageDocument());

    expect(result.data.root.props).toEqual({
      size: {
        desktop: { maxWidth: "72rem" },
      },
      spacing: {
        desktop: { marginLeft: "auto", marginRight: "auto" },
        tablet: { paddingLeft: "1rem", paddingRight: "1rem" },
      },
    });
    expect(result.data.content[0]?.props).toEqual({
      id: "button-1",
      label: "Read more",
      size: {
        desktop: { width: "12rem", height: "3rem" },
        mobile: { width: "100%" },
      },
      spacing: {
        desktop: { paddingTop: "0.5rem" },
        mobile: { paddingBottom: "1rem" },
      },
    });
    expect(result.changes).toEqual([
      {
        componentType: "root",
        componentId: undefined,
        size: ["maxWidth"],
        spacing: ["marginLeft", "marginRight", "paddingLeft", "paddingRight"],
        emptyMarkers: [],
      },
      {
        componentType: "Button",
        componentId: "button-1",
        size: ["width", "height"],
        spacing: ["paddingTop", "paddingBottom"],
        emptyMarkers: [],
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("keeps an authored box: an empty spacing is written when the dimension holds no spacing key", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Separator",
          props: {
            id: "separator-1",
            dimension: {
              desktop: { width: "100%", height: "1px" },
              mobile: {},
            },
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);
    const props = result.changes.length === 1 ? result.data.content[0]?.props : null;

    // `spacing: {}` is not decoration: absent spacing makes a block render fall
    // back on its own default, which the pre-split authored `dimension` had
    // suppressed. The empty object carries that suppression over.
    expect(props).toEqual({
      id: "separator-1",
      size: {
        desktop: { width: "100%", height: "1px" },
      },
      spacing: {},
    });
    expect(result.changes).toEqual([
      {
        componentType: "Separator",
        componentId: "separator-1",
        size: ["width", "height"],
        spacing: [],
        emptyMarkers: ["spacing"],
      },
    ]);
  });

  it("keeps both destinations when the dimension is authored but empty", () => {
    const input = {
      root: { props: {} },
      content: [{ type: "Text", props: { id: "text-1", dimension: { desktop: {} } } }],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "text-1",
      size: {},
      spacing: {},
    });
    expect(result.changes).toEqual([
      {
        componentType: "Text",
        componentId: "text-1",
        size: [],
        spacing: [],
        emptyMarkers: ["size", "spacing"],
      },
    ]);
  });

  it("converts a dimension that is an empty object and warns about nothing", () => {
    const input = {
      root: { props: {} },
      content: [{ type: "Text", props: { id: "text-1", dimension: {} } }],
    };

    const result = migrateSizeSpacing(input);

    // An empty object is still a responsive map, vacuously: it must not be
    // reported as a value the migration cannot read, or its key would survive
    // every run and the suppression it carried would be lost.
    expect(result.data.content[0]?.props).toEqual({
      id: "text-1",
      size: {},
      spacing: {},
    });
    expect(result.warnings).toEqual([]);
    expect(result.changes).toEqual([
      {
        componentType: "Text",
        componentId: "text-1",
        size: [],
        spacing: [],
        emptyMarkers: ["size", "spacing"],
      },
    ]);
  });

  it("adds no empty destination when the props already carry the new shape", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "TopBar",
          props: {
            id: "top-bar-1",
            dimension: { desktop: { height: "3rem" } },
            size: { desktop: { height: "4rem" } },
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    // The new editor wrote `size`, so a missing `spacing` is the new shape's
    // own "nothing authored": the block default applies, as the canvas showed.
    expect(result.data.content[0]?.props).toEqual({
      id: "top-bar-1",
      size: { desktop: { height: "4rem" } },
    });
    expect(result.changes).toEqual([
      {
        componentType: "TopBar",
        componentId: "top-bar-1",
        size: ["height"],
        spacing: [],
        emptyMarkers: [],
      },
    ]);
  });

  it("leaves an already migrated document unchanged", () => {
    const input = {
      root: {
        props: {
          size: { desktop: { maxWidth: "72rem" } },
          spacing: { desktop: { marginTop: "1rem" } },
        },
      },
      content: [
        {
          type: "Button",
          props: {
            id: "button-1",
            size: { desktop: { width: "12rem" } },
            spacing: { mobile: { paddingTop: "0.5rem" } },
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("is idempotent: a second run produces the same document and no changes", () => {
    const first = migrateSizeSpacing(pageDocument());
    const second = migrateSizeSpacing(first.data);

    expect(second.data).toEqual(first.data);
    expect(second.changes).toEqual([]);
    expect(second.warnings).toEqual([]);
  });

  it("does not mutate the input document", () => {
    const input = pageDocument();
    const snapshot = structuredClone(input);

    migrateSizeSpacing(input);

    expect(input).toEqual(snapshot);
  });

  it("preserves and reports a dimension that is not a responsive map", () => {
    const input = {
      root: { props: {} },
      content: [
        { type: "Text", props: { id: "string", dimension: "12rem" } },
        { type: "Text", props: { id: "unknown-key", dimension: { fluid: true } } },
        { type: "Text", props: { id: "null", dimension: null } },
        { type: "Text", props: { id: "array", dimension: [] } },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([
      {
        componentType: "Text",
        componentId: "string",
        reason: "dimension is not a responsive map; left unchanged",
      },
      {
        componentType: "Text",
        componentId: "unknown-key",
        reason: "dimension is not a responsive map; left unchanged",
      },
      {
        componentType: "Text",
        componentId: "null",
        reason: "dimension is not a responsive map; left unchanged",
      },
      {
        componentType: "Text",
        componentId: "array",
        reason: "dimension is not a responsive map; left unchanged",
      },
    ]);
  });

  it("preserves and reports a breakpoint rung that is not an object", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Text",
          props: {
            id: "text-1",
            dimension: { desktop: { width: "10rem" }, tablet: "2rem" },
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([
      {
        componentType: "Text",
        componentId: "text-1",
        reason: "dimension.tablet is not an object; left unchanged",
      },
    ]);
  });

  it("keeps the new shape when the props already carry size and spacing", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Button",
          props: {
            id: "button-1",
            dimension: {
              desktop: { width: "10rem", marginTop: "1rem", paddingTop: "2rem" },
            },
            size: { desktop: { width: "20rem" } },
            spacing: { desktop: { marginBottom: "3rem" } },
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data.content[0]?.props).toEqual({
      id: "button-1",
      size: { desktop: { width: "20rem" } },
      spacing: {
        desktop: { marginTop: "1rem", paddingTop: "2rem", marginBottom: "3rem" },
      },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Button",
        componentId: "button-1",
        size: ["width"],
        spacing: ["marginTop", "paddingTop"],
        emptyMarkers: [],
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("preserves a sibling size or spacing that is not an object", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Text",
          props: {
            id: "text-1",
            dimension: { desktop: { marginTop: "1rem" } },
            size: "10rem",
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data).toEqual(input);
    expect(result.changes).toEqual([]);
    expect(result.warnings).toEqual([
      {
        componentType: "Text",
        componentId: "text-1",
        reason: "size is not an object; dimension left unchanged",
      },
    ]);
  });

  it("migrates unknown block types and preserves unknown props", () => {
    const input = {
      root: { props: { title: "Home" } },
      content: [
        {
          type: "Mystery",
          props: {
            id: "mystery-1",
            settings: { nested: true },
            dimension: { desktop: { width: "8rem", paddingTop: "1rem" } },
          },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data).toEqual({
      root: { props: { title: "Home" } },
      content: [
        {
          type: "Mystery",
          props: {
            id: "mystery-1",
            settings: { nested: true },
            size: { desktop: { width: "8rem" } },
            spacing: { desktop: { paddingTop: "1rem" } },
          },
        },
      ],
    });
    expect(result.changes).toEqual([
      {
        componentType: "Mystery",
        componentId: "mystery-1",
        size: ["width"],
        spacing: ["paddingTop"],
        emptyMarkers: [],
      },
    ]);
  });

  it("skips malformed component data without aborting the rest", () => {
    const input = {
      root: { props: null },
      content: [
        { type: "Text", props: "not an object" },
        { type: "Text" },
        { type: "Text", props: ["not", "an", "object"] },
        null,
        "not a block",
        {
          type: "Button",
          props: { id: "button-1", dimension: { desktop: { width: "10rem" } } },
        },
      ],
    };

    const result = migrateSizeSpacing(input);

    expect(result.data.root.props).toBeNull();
    const content = result.data.content as { props?: Record<string, unknown> }[];
    expect(content.at(-1)?.props).toEqual({
      id: "button-1",
      size: { desktop: { width: "10rem" } },
      spacing: {},
    });
    expect(result.changes).toEqual([
      {
        componentType: "Button",
        componentId: "button-1",
        size: ["width"],
        spacing: [],
        emptyMarkers: ["spacing"],
      },
    ]);
    expect(result.warnings).toEqual([]);
  });

  it("converts blocks nested in slots and zones", () => {
    const input = {
      root: { props: {} },
      content: [
        {
          type: "Container",
          props: {
            id: "container-1",
            content: [
              {
                type: "Text",
                props: {
                  id: "nested-text",
                  dimension: { desktop: { marginTop: "2rem" } },
                },
              },
            ],
          },
        },
      ],
      zones: {
        "page-footer": [
          {
            type: "Copyright",
            props: {
              id: "zoned-copyright",
              dimension: { mobile: { paddingTop: "1rem" } },
            },
          },
        ],
      },
    };

    const result = migrateSizeSpacing(input);

    const nested = result.data.content[0]?.props as {
      content: { props: Record<string, unknown> }[];
    };
    expect(nested.content[0]?.props).toEqual({
      id: "nested-text",
      size: {},
      spacing: { desktop: { marginTop: "2rem" } },
    });
    const zoned = (
      result.data.zones as Record<string, { props: Record<string, unknown> }[]>
    )["page-footer"];
    expect(zoned?.[0]?.props).toEqual({
      id: "zoned-copyright",
      size: {},
      spacing: { mobile: { paddingTop: "1rem" } },
    });
    expect(result.changes).toEqual([
      {
        componentType: "Text",
        componentId: "nested-text",
        size: [],
        spacing: ["marginTop"],
        emptyMarkers: ["size"],
      },
      {
        componentType: "Copyright",
        componentId: "zoned-copyright",
        size: [],
        spacing: ["paddingTop"],
        emptyMarkers: ["size"],
      },
    ]);
  });
});
