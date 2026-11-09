import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { renderTextBlock } from "../blocks/Text/render";
import type { TextBlockProps } from "../blocks/Text/types";
import { editorComponentConfigs } from "../config";
import { getLayoutClassNames } from "../fields/layout/get-layout-classes";
import { RootEditor } from "../root";

const PUBLIC_PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const CANVAS_PUCK: PuckContext = {
  ...PUBLIC_PUCK,
  isEditing: true,
};

function renderText(
  props: TextBlockProps,
  puck: PuckContext = PUBLIC_PUCK,
) {
  return renderToStaticMarkup(
    renderTextBlock({ id: "text", ...props, puck }),
  );
}

describe("getLayoutClassNames", () => {
  it("keeps the current markup when the layout is empty", () => {
    expect(getLayoutClassNames(undefined)).toBe("");
    expect(getLayoutClassNames({})).toBe("");
    expect(getLayoutClassNames({ desktop: {} })).toBe("");
  });

  it("emits a display class only for the breakpoints that authored one", () => {
    expect(
      getLayoutClassNames({ desktop: { display: "flex" } }),
    ).toBe("puck-display puck-display-d");

    expect(
      getLayoutClassNames({ mobile: { display: "none" } }),
    ).toBe("puck-display puck-display-m");

    expect(
      getLayoutClassNames({
        desktop: { display: "flex", justifyContent: "center" },
        tablet: { display: "block" },
      }),
    ).toBe("puck-display puck-display-d puck-display-t");
  });

  it("keeps public display classes in the canvas while the block is visible", () => {
    expect(
      getLayoutClassNames(
        { desktop: { display: "flex" } },
        { editing: true },
      ),
    ).toBe("puck-display puck-display-d");
  });

  it("keeps the authored display rule and adds placeholder markers in the canvas", () => {
    const classes = getLayoutClassNames(
      { mobile: { display: "none" } },
      { editing: true },
    );

    expect(classes).toContain("puck-display");
    expect(classes).toContain("puck-display-m");
    expect(classes).toContain("puck-hidden-placeholder");
    expect(classes).toContain("puck-hidden-at-mobile");
  });

  it("follows the desktop to tablet to mobile cascade for the placeholder", () => {
    const classes = getLayoutClassNames(
      { tablet: { display: "none" } },
      { editing: true },
    );

    expect(classes).toContain("puck-hidden-at-tablet");
    expect(classes).toContain("puck-hidden-at-mobile");
    expect(classes).not.toContain("puck-hidden-at-desktop");
  });
});

describe("Layout on a leaf block", () => {
  it("renders the responsive layout variables", () => {
    const html = renderText({
      text: "Styled",
      layout: {
        desktop: { display: "flex", justifyContent: "space-between" },
        tablet: { display: "block" },
      },
    });

    expect(html).toContain("--disp-d:flex");
    expect(html).toContain("--jc-d:space-between");
    expect(html).toContain("--disp-t:block");
    expect(html).toContain("puck-display");
    expect(html).toContain("puck-display-d");
    expect(html).toContain("puck-display-t");
  });

  it("renders display: none at mobile as a responsive variable and class", () => {
    const html = renderText({
      text: "Hidden on phones",
      layout: { mobile: { display: "none" } },
    });

    expect(html).toContain("--disp-m:none");
    expect(html).toContain("puck-display-m");
  });

  it("adds no display rule when the layout is empty", () => {
    const html = renderText({ text: "Default" });

    expect(html).not.toContain("puck-display");
    expect(html).not.toContain("--disp-");
  });

  it("adds the placeholder class only while editing", () => {
    const layout = { mobile: { display: "none" as const } };
    const canvasHtml = renderText(
      { text: "Hidden on phones", layout },
      CANVAS_PUCK,
    );
    const publicHtml = renderText({ text: "Hidden on phones", layout });

    expect(canvasHtml).toContain("puck-hidden-placeholder");
    expect(canvasHtml).toContain("puck-hidden-at-mobile");

    expect(publicHtml).not.toContain("puck-hidden-placeholder");
    expect(publicHtml).not.toContain("puck-hidden-at-mobile");
    expect(publicHtml).toContain("puck-display-m");
  });
});

describe("Layout field availability", () => {
  it("is exposed on every block that renders content", () => {
    for (const [name, component] of Object.entries(editorComponentConfigs)) {
      const fields = (component.fields ?? {}) as Record<string, unknown>;

      expect(fields, `${name} should expose Layout`).toHaveProperty("layout");
    }
  });

  it("exposes the surface fields on the Root", () => {
    const fields = (RootEditor.fields ?? {}) as Record<string, unknown>;

    expect(fields).toHaveProperty("layout");
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("decoration");
  });
});
