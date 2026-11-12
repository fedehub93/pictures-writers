import type { RichtextField } from "@puckeditor/core";
import { describe, expect, it } from "vitest";

import { config } from "../config";
import { richTextFields } from "../fields/rich-text";
import {
  RICH_TEXT_PLACEHOLDERS,
  richTextDescriptors,
} from "../fields/rich-text/presets";
import { renderComponentConfigs } from "../render-config";

import { declarations, readPuckBaseRules } from "./helpers/css-rules";

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

/** The `placeholder` extension of a field, if the preset registers one. */
const placeholderExtensionOf = (field: RichtextField) =>
  field.tiptap?.extensions?.find(
    (extension) => extension.name === "placeholder",
  );

const placeholderTextOf = (field: RichtextField) =>
  (
    placeholderExtensionOf(field) as
      | { options?: { placeholder?: string } }
      | undefined
  )?.options?.placeholder;

describe("empty block placeholder", () => {
  it("gives each block its own hint", () => {
    expect(placeholderTextOf(richTextDescriptors.heading)).toBe(
      RICH_TEXT_PLACEHOLDERS.heading,
    );
    expect(placeholderTextOf(richTextDescriptors.text)).toBe(
      RICH_TEXT_PLACEHOLDERS.text,
    );
    expect(RICH_TEXT_PLACEHOLDERS.heading).not.toBe(
      RICH_TEXT_PLACEHOLDERS.text,
    );
  });

  it("registers the hint in the shared descriptor, not only in the editor field", () => {
    // The placeholder is a decoration, not part of the schema, so the public
    // render can build the same extension list without publishing it.
    expect(placeholderTextOf(richTextFields.heading)).toBe(
      RICH_TEXT_PLACEHOLDERS.heading,
    );
    expect(placeholderExtensionOf(richTextFields.text)).toBe(
      placeholderExtensionOf(richTextDescriptors.text),
    );
  });
});

describe("empty block placeholder stylesheet", () => {
  it("draws the hint from the editor decoration, out of the text flow", () => {
    const selector = ".puck-rich-text .is-empty[data-placeholder]::before";
    const rule = readPuckBaseRules().find(
      (candidate) => candidate.selector === selector && !candidate.media,
    );

    if (!rule) throw new Error(`puck-base.css has no rule for ${selector}`);

    const properties = declarations(rule);

    expect(properties.get("content")).toBe("attr(data-placeholder)");
    // The hint must not take part in layout: an empty block still collapses
    // to zero height on the page and the canvas keeps its root selectable.
    expect(properties.get("float")).toBe("left");
    expect(properties.get("height")).toBe("0");
    expect(properties.get("pointer-events")).toBe("none");
  });

  it("removes the line Puck reserves for an empty paragraph on the page", () => {
    // Puck adds a non-breaking space through `p:empty::before` so the canvas
    // caret has a line. On the page that leaves a blank 24px line where the
    // ticket asks for nothing visible.
    const selector =
      ".puck-rich-text .rich-text p:empty:only-child:not([data-placeholder])::before";
    const rule = readPuckBaseRules().find(
      (candidate) => candidate.selector === selector && !candidate.media,
    );

    if (!rule) throw new Error(`puck-base.css has no rule for ${selector}`);

    expect(declarations(rule).get("content")).toBe("none");
  });
});
