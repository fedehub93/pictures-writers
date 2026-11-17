import type { RichtextField } from "@puckeditor/core";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Color, TextStyle } from "@tiptap/extension-text-style";

import { RichTextLinkMark } from "./link";

/**
 * Extensions shared by every rich text field.
 *
 * Both consumers of a descriptor must declare the same list: Puck resolves
 * rich text through the field descriptor at render time, so an extension
 * missing from the public config would make the canvas and the published page
 * disagree.
 */
export const richTextExtensions = [TextStyle, Color, RichTextLinkMark];

/**
 * One block's extension list: the shared schema plus its empty-state hint.
 *
 * The placeholder is editor text, not document content. Tiptap draws it as a
 * ProseMirror decoration on the empty block at the caret, so it never enters
 * the stored value and `generateHTML` serializes the same schema without it.
 * Registering it in the descriptor (rather than only in the editor field) keeps
 * the canvas and the render config on one extension list; the hint differs per
 * block, which is why this is a factory.
 */
export const createRichTextExtensions = (placeholder: string) => [
  ...richTextExtensions,
  Placeholder.configure({ placeholder }),
];

/**
 * Field descriptor shared by the editor field and the public render config.
 *
 * The link mark is registered explicitly by `richTextExtensions`; disabling
 * Puck's built-in one keeps a single `link` mark in the schema. Keeping the
 * whole descriptor in one object means the editor and the public site cannot
 * drift when the rich text capabilities change.
 */
export const richTextFieldConfig = {
  options: {
    link: false,
  },
  tiptap: {
    extensions: richTextExtensions,
  },
} satisfies Pick<RichtextField, "options" | "tiptap">;
