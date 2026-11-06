import type { PuckContext } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { config } from "../config";
import { renderTextBlock } from "../blocks/Text/render";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

describe("Text block", () => {
  it("renders a semantic paragraph and preserves typed line breaks", () => {
    const html = renderToStaticMarkup(
      renderTextBlock({ id: "text", text: "Hello\nWorld", puck: PUCK }),
    );

    expect(html).toContain("<p");
    expect(html).toContain("puck-dim puck-typo");
    expect(html).toContain("Hello\nWorld");
    expect(html).toContain("whitespace-pre-line");
  });

  it("renders typography as responsive CSS custom properties", () => {
    const html = renderToStaticMarkup(
      renderTextBlock({
        id: "text",
        text: "Styled",
        typography: {
          desktop: {
            fontSize: "18px",
            textAlign: "center",
            color: "var(--primary)",
          },
          tablet: { fontSize: "16px" },
        },
        puck: PUCK,
      }),
    );

    expect(html).toContain("--fs-d:18px");
    expect(html).toContain("--fs-t:16px");
    expect(html).toContain("--ta-d:center");
    expect(html).toContain("--tc-d:var(--primary)");
  });

  it("renders dimension as responsive CSS custom properties", () => {
    const html = renderToStaticMarkup(
      renderTextBlock({
        id: "text",
        text: "Spaced",
        dimension: {
          desktop: { width: "100%", height: "50vh", marginTop: "12px" },
          tablet: { paddingBottom: "8px" },
        },
        puck: PUCK,
      }),
    );

    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--h-d:50vh");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--pb-t:8px");
  });

  it("leaves the default look untouched when no typography is configured", () => {
    const html = renderToStaticMarkup(
      renderTextBlock({ id: "text", text: "Default", puck: PUCK }),
    );

    expect(html).toContain(">Default</p>");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("color:");
    expect(html).not.toContain("text-align:");
  });

  it("exposes text, dimension and typography fields instead of align and color", () => {
    const fields = config.components.Text.fields ?? {};

    expect(fields).toHaveProperty("text");
    expect(fields).toHaveProperty("dimension");
    expect(fields).toHaveProperty("typography");
    expect(fields).not.toHaveProperty("align");
    expect(fields).not.toHaveProperty("color");
  });

  it("is registered in the page editor config", () => {
    expect(Object.keys(config.components)).toContain("Text");
  });
});
