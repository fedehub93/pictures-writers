import type { PuckContext, RichtextField } from "@puckeditor/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { renderHeadingBlock } from "../blocks/Heading/render";
import { config } from "../config";
import { richTextFields } from "../fields/rich-text";
import { richTextFieldConfig } from "../fields/rich-text/extensions";
import { renderComponentConfigs } from "../render-config";

const PUCK: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

const headingField = richTextFields.heading;

describe("shared rich text field", () => {
  it("declares inline editing explicitly instead of relying on Puck's default", () => {
    expect(headingField.type).toBe("richtext");
    expect(headingField.contentEditable).toBe(true);
  });

  it("keeps the built-in link disabled", () => {
    expect(headingField.options).toEqual({ link: false });
  });

  it("defines both the inline menu and the sidebar menu", () => {
    expect(headingField.renderInlineMenu).toBeTypeOf("function");
    expect(headingField.renderMenu).toBeTypeOf("function");
  });

  it("is the descriptor the Heading block mounts", () => {
    expect(config.components.Heading.fields?.text).toBe(headingField);
  });

  it("leaves the public render config on the shared descriptor, without inline editing", () => {
    const publicField = renderComponentConfigs.Heading?.fields
      ?.text as RichtextField;

    expect(publicField).toEqual({ type: "richtext", ...richTextFieldConfig });
    expect(publicField.contentEditable).toBeUndefined();
  });

  it("leaves the Heading block markup unchanged", () => {
    const html = renderToStaticMarkup(
      renderHeadingBlock({ id: "heading", text: "Hello", puck: PUCK }),
    );

    expect(html).toBe(
      '<div class="block puck-dim puck-typo puck-block-root">Hello</div>',
    );
  });
});
