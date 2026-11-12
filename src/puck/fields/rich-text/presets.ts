import type { RichtextField } from "@puckeditor/core";

import { createRichTextExtensions, richTextFieldConfig } from "./extensions";

/**
 * The parts of a rich text field both render paths need.
 *
 * Editor-only members (`contentEditable`, the menus) are deliberately absent:
 * the public render config imports this module, and it must not pull the
 * canvas editor into the published bundle.
 */
export type RichTextFieldDescriptor = Pick<
  RichtextField,
  "type" | "options" | "tiptap"
>;

/**
 * The hint the canvas shows on an empty block, one per block kind.
 *
 * It is editor text, not content: the placeholder never enters the stored
 * document and the published page never shows it. The two strings differ so a
 * cleared block says what it is.
 */
export const RICH_TEXT_PLACEHOLDERS = {
  heading: "Add a heading",
  text: "Start writing",
} as const;

/**
 * Per-block descriptors, shared by the editor field and the render config.
 *
 * The two consumers resolve the same stored HTML with the same schema, so
 * `options` cannot differ between the canvas and the page.
 */
export const richTextDescriptors = {
  heading: {
    type: "richtext",
    ...richTextFieldConfig,
    options: {
      ...richTextFieldConfig.options,
      // A Heading block is one heading: nested headings, lists, quotes, code
      // and alignment would put block structure inside an <hN>. Paragraphs
      // stay, because Puck's editor always wraps content in them.
      heading: false,
      bulletList: false,
      orderedList: false,
      blockquote: false,
      code: false,
      codeBlock: false,
      strike: false,
      horizontalRule: false,
      textAlign: false,
      // The shared mark is the only link mark: a descriptor cannot re-enable
      // Puck's built-in one and put two link marks in the same schema.
      link: false,
    },
    tiptap: {
      ...richTextFieldConfig.tiptap,
      extensions: createRichTextExtensions(RICH_TEXT_PLACEHOLDERS.heading),
    },
  },
  text: {
    type: "richtext",
    ...richTextFieldConfig,
    options: {
      ...richTextFieldConfig.options,
      // A Text block carries whole passages: headings and lists are content,
      // while quotes, code, strike, rules and alignment are out of scope for
      // the block. Turning them off disables their keyboard shortcuts too.
      blockquote: false,
      code: false,
      codeBlock: false,
      strike: false,
      horizontalRule: false,
      textAlign: false,
      link: false,
    },
    tiptap: {
      ...richTextFieldConfig.tiptap,
      extensions: createRichTextExtensions(RICH_TEXT_PLACEHOLDERS.text),
    },
  },
} satisfies Record<string, RichTextFieldDescriptor>;
