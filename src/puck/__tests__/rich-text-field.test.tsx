import type { RichtextField } from "@puckeditor/core";
import { describe, expect, it } from "vitest";

import { config } from "../config";
import { richTextFields } from "../fields/rich-text";
import { richTextDescriptors } from "../fields/rich-text/presets";
import { renderComponentConfigs } from "../render-config";

const headingField = richTextFields.heading;
const textField = richTextFields.text;

describe("shared rich text field", () => {
  it("declares inline editing explicitly instead of relying on Puck's default", () => {
    for (const field of [headingField, textField]) {
      expect(field.type).toBe("richtext");
      expect(field.contentEditable).toBe(true);
    }
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

  it("keeps headings and lists for Text and disables the rest", () => {
    expect(textField.options).toMatchObject({
      link: false,
      blockquote: false,
      code: false,
      codeBlock: false,
      strike: false,
      horizontalRule: false,
      textAlign: false,
    });
    // Heading and list nodes are the block's content: they stay enabled and
    // their controls appear in the inline toolbar.
    expect(textField.options?.heading).toBeUndefined();
    expect(textField.options?.bulletList).toBeUndefined();
    expect(textField.options?.orderedList).toBeUndefined();
    expect(textField.options?.paragraph).toBeUndefined();
  });

  it("hides the content field from the sidebar without removing it from the schema", () => {
    for (const field of [headingField, textField]) {
      expect(field.visible).toBe(false);
      // The canvas transform reads the raw descriptor, so the field must stay
      // declared even though the sidebar no longer draws it.
      expect(field.type).toBe("richtext");
    }
  });

  it("defines only the inline menu, because the field is not drawn in the sidebar", () => {
    for (const field of [headingField, textField]) {
      expect(field.renderInlineMenu).toBeTypeOf("function");
      expect(field.renderMenu).toBeUndefined();
    }
  });

  it("gives Text its own inline toolbar, so Heading keeps the reduced one", () => {
    expect(textField.renderInlineMenu).not.toBe(headingField.renderInlineMenu);
  });

  it("is the descriptor each text block mounts", () => {
    expect(config.components.Heading.fields?.text).toBe(headingField);
    expect(config.components.Text.fields?.text).toBe(textField);
  });

  it("shares the schema with the public render config, without inline editing", () => {
    const headingPublic = renderComponentConfigs.Heading?.fields
      ?.text as RichtextField;
    const textPublic = renderComponentConfigs.Text?.fields
      ?.text as RichtextField;

    // Identity, not equality: the editor field is built from the same schema
    // object the public render config reads, so the two cannot drift.
    expect(headingPublic).toBe(richTextDescriptors.heading);
    expect(headingField.options).toBe(richTextDescriptors.heading.options);
    expect(headingField.tiptap).toBe(richTextDescriptors.heading.tiptap);

    expect(textPublic).toBe(richTextDescriptors.text);
    expect(textField.options).toBe(richTextDescriptors.text.options);
    expect(textField.tiptap).toBe(richTextDescriptors.text.tiptap);

    expect(headingPublic.contentEditable).toBeUndefined();
    expect(textPublic.contentEditable).toBeUndefined();
    // Hiding is an editor concern: the render path still gets the descriptor
    // exactly as the schema defines it.
    expect(headingPublic.visible).toBeUndefined();
    expect(textPublic.visible).toBeUndefined();
  });
});
