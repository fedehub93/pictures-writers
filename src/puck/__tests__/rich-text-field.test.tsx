import type { RichtextField } from "@puckeditor/core";
import { describe, expect, it } from "vitest";

import { config } from "../config";
import { richTextFields } from "../fields/rich-text";
import { richTextDescriptors } from "../fields/rich-text/presets";
import { renderComponentConfigs } from "../render-config";

const headingField = richTextFields.heading;

describe("shared rich text field", () => {
  it("declares inline editing explicitly instead of relying on Puck's default", () => {
    expect(headingField.type).toBe("richtext");
    expect(headingField.contentEditable).toBe(true);
  });

  it("disables the extensions a Heading must not contain", () => {
    expect(headingField.options).toMatchObject({
      link: false,
      heading: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      code: false,
      codeBlock: false,
      strike: false,
      horizontalRule: false,
      textAlign: false,
    });
    // The paragraph is not optional in Puck's editor: a preset must not try to
    // disable it.
    expect(headingField.options?.paragraph).toBeUndefined();
  });

  it("defines both the inline menu and the sidebar menu", () => {
    expect(headingField.renderInlineMenu).toBeTypeOf("function");
    expect(headingField.renderMenu).toBeTypeOf("function");
  });

  it("is the descriptor the Heading block mounts", () => {
    expect(config.components.Heading.fields?.text).toBe(headingField);
  });

  it("shares the schema with the public render config, without inline editing", () => {
    const publicField = renderComponentConfigs.Heading?.fields
      ?.text as RichtextField;
    const descriptor = richTextDescriptors.heading;

    // Identity, not equality: the editor field is built from the same schema
    // object the public render config reads, so the two cannot drift.
    expect(publicField).toBe(descriptor);
    expect(headingField.options).toBe(descriptor.options);
    expect(headingField.tiptap).toBe(descriptor.tiptap);
    expect(publicField.contentEditable).toBeUndefined();
  });
});
