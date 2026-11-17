// @vitest-environment happy-dom
import { Render, type PuckContext } from "@puckeditor/core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { config } from "../config";
import { renderTextBlock } from "../blocks/Text/render";
import type { TextBlockProps } from "../blocks/Text/types";
import { richTextFields } from "../fields/rich-text";
import {
  RICH_TEXT_PLACEHOLDERS,
  richTextDescriptors,
} from "../fields/rich-text/presets";
import { pageRenderConfig } from "../render-config";

import { declarations, readPuckBaseRules } from "./helpers/css-rules";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const renderText = (props: TextBlockProps = {}) =>
  renderToStaticMarkup(renderTextBlock({ id: "text", puck: PUCK, ...props }));

let root: Root | null = null;
let host: HTMLDivElement | null = null;

afterEach(() => {
  if (root) act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

/**
 * Render the stored value through the public Puck config, the way the page
 * does: the rich text field resolves the string into content, so a plain value
 * becomes a paragraph instead of raw text. happy-dom gives the client render
 * the DOM Tiptap needs; the editor canvas path is Puck's own component.
 */
async function renderPublicContainer(text: string) {
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);

  await act(async () => {
    root!.render(
      <Render
        config={pageRenderConfig}
        data={{
          root: { props: {} },
          content: [{ type: "Text", props: { id: "text", text } }],
        }}
      />,
    );
  });
  await act(async () => {});

  const container = host.querySelector(".puck-rich-text");

  if (!container) throw new Error("public render has no rich text container");

  return container;
}

async function renderPublicText(text: string) {
  const container = await renderPublicContainer(text);
  const richText = container.querySelector(".rich-text");

  if (!richText) throw new Error("public render resolved no rich text value");

  return richText.innerHTML;
}

describe("Text block", () => {
  it("renders a div root with the rich text container classes", () => {
    const html = renderText({ text: "Hello" });

    expect(html.startsWith("<div ")).toBe(true);
    expect(html).toContain("</div>");
    expect(html).toContain("block puck-dim puck-typo puck-block-root puck-rich-text");
  });

  it("drops the textarea-era whitespace-pre-line", () => {
    const html = renderText({ text: "Hello\nWorld" });

    expect(html).not.toContain("whitespace-pre-line");
    expect(html).toContain("Hello\nWorld");
  });

  it("renders the container even when the text is empty", () => {
    const html = renderText({});

    expect(html).toBe(
      '<div class="block puck-dim puck-typo puck-block-root puck-rich-text"></div>',
    );
  });

  it("renders typography as responsive CSS custom properties", () => {
    const html = renderText({
      text: "Styled",
      typography: {
        desktop: {
          fontSize: "18px",
          textAlign: "center",
          color: "var(--primary)",
        },
        tablet: { fontSize: "16px" },
      },
    });

    expect(html).toContain("--fs-d:18px");
    expect(html).toContain("--fs-t:16px");
    expect(html).toContain("--ta-d:center");
    expect(html).toContain("--tc-d:var(--primary)");
  });

  it("renders size and spacing as responsive CSS custom properties", () => {
    const html = renderText({
      text: "Spaced",
      size: { desktop: { width: "100%", height: "50vh" } },
      spacing: {
        desktop: { marginTop: "12px" },
        tablet: { paddingBottom: "8px" },
      },
    });

    expect(html).toContain("--w-d:100%");
    expect(html).toContain("--h-d:50vh");
    expect(html).toContain("--mt-d:12px");
    expect(html).toContain("--pb-t:8px");
  });

  it("leaves the default look untouched when no typography is configured", () => {
    const html = renderText({ text: "Default" });

    expect(html).toContain(">Default</div>");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("color:");
    expect(html).not.toContain("text-align:");
  });

  it("publishes a plain value as a paragraph", async () => {
    expect(await renderPublicText("Hello")).toBe("<p>Hello</p>");
  });

  it("publishes an empty block without the canvas hint", async () => {
    // Puck skips the rich text wrapper for a falsy value, so an entirely empty
    // block publishes the container and nothing inside it.
    const container = await renderPublicContainer("");

    expect(container.innerHTML).toBe("");
    expect(container.innerHTML).not.toContain(RICH_TEXT_PLACEHOLDERS.text);
    expect(container.innerHTML).not.toContain("data-placeholder");
  });

  it("publishes an empty paragraph without the canvas hint", async () => {
    // The canvas keeps the caret's empty text block as an element; the
    // placeholder is a decoration on it, so the serialized page has neither
    // the hint nor its attributes.
    const innerHtml = await renderPublicText("<p></p>");

    expect(innerHtml).toBe("<p></p>");
    expect(innerHtml).not.toContain(RICH_TEXT_PLACEHOLDERS.text);
    expect(innerHtml).not.toContain("data-placeholder");
  });

  it("publishes stored formatting: bold and links survive", async () => {
    const innerHtml = await renderPublicText(
      '<p>Hello <strong>bold</strong> <a href="/blog/">link</a></p>',
    );

    expect(innerHtml).toBe(
      '<p>Hello <strong>bold</strong> <a href="/blog/">link</a></p>',
    );
  });

  it("exposes the shared rich text field, size, spacing and typography", () => {
    const fields = config.components.Text.fields ?? {};

    expect(fields).toHaveProperty("text");
    expect(fields).toHaveProperty("size");
    expect(fields).toHaveProperty("spacing");
    expect(fields).toHaveProperty("typography");
    expect(fields).not.toHaveProperty("align");
    expect(fields).not.toHaveProperty("color");
    expect(fields.text).toBe(richTextFields.text);
  });

  it("shares the schema with the public render config", () => {
    expect(pageRenderConfig.components.Text?.fields?.text).toBe(
      richTextDescriptors.text,
    );
  });

  it("is registered in the page editor config", () => {
    expect(Object.keys(config.components)).toContain("Text");
  });
});

describe("rich text container stylesheet", () => {
  const rules = readPuckBaseRules();

  const rulesFor = (selector: string) =>
    rules.filter(
      (candidate) =>
        !candidate.media &&
        candidate.selector
          .split(",")
          .map((part) => part.trim())
          .includes(selector),
    );

  const declaration = (selector: string, property: string) => {
    for (const rule of rulesFor(selector)) {
      const value = declarations(rule).get(property);

      if (value !== undefined) return value;
    }

    throw new Error(`${selector} has no ${property} in puck-base.css`);
  };

  it("restores the list markers Tailwind's preflight removes", () => {
    expect(declaration(".puck-rich-text ul", "list-style-type")).toBe("disc");
    expect(declaration(".puck-rich-text ol", "list-style-type")).toBe(
      "decimal",
    );
  });

  it("restores the list indent and gives lists the paragraph rhythm", () => {
    expect(declaration(".puck-rich-text ul", "padding-inline-start")).toBe(
      "1.5em",
    );
    expect(declaration(".puck-rich-text ul", "margin-top")).toBe("1em");
    // The indent and rhythm come from one rule shared by both list types.
    expect(
      rulesFor(".puck-rich-text ul").some((rule) =>
        rule.selector.includes(".puck-rich-text ol"),
      ),
    ).toBe(true);
  });

  it("gives a paragraph after a list the same gap it had before it", () => {
    // The paragraph rhythm covers p + p only; without this the paragraph
    // after a list sits flush against the last item.
    expect(declaration(".puck-rich-text ul + p", "margin-top")).toBe("1em");
    expect(declaration(".puck-rich-text ol + p", "margin-top")).toBe("1em");
  });

  it.each([
    ["h1", "2em"],
    ["h2", "1.5em"],
    ["h3", "1.25em"],
    ["h4", "1.125em"],
    ["h5", "1em"],
    ["h6", "0.875em"],
  ])("scales %s in em on the block's font", (tag, size) => {
    expect(declaration(`.puck-rich-text ${tag}`, "font-size")).toBe(size);
  });
});
