import type { RichtextField } from "@puckeditor/core";
import { Color, TextStyle } from "@tiptap/extension-text-style";

import { RichTextLinkMark } from "./link";

/**
 * Extensions shared by the rich text editor field and the public render
 * config.
 *
 * Both consumers must declare the same list: Puck resolves rich text through
 * the field descriptor at render time, so an extension missing from the public
 * config would make the canvas and the published page disagree.
 */
export const richTextExtensions = [TextStyle, Color, RichTextLinkMark];

/**
 * Field descriptor shared by the editor field and the `Heading` render config.
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
