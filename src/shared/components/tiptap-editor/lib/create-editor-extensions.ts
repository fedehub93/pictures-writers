import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { type Node } from "@tiptap/pm/model";

import { CustomBold } from "../extensions/bold";
import { CustomLink } from "../extensions/link";
import { CustomImage } from "../extensions/image";
import { ProductNode } from "../extensions/product";
import { InfoBoxNode } from "../extensions/info-box";
import { TableContentNode } from "../extensions/table-content";
import { SlashMenuExtension } from "../slash-menu/slash-menu-extension";
import type { SlashCommandModalService } from "../slash-menu/types";

export const TIPTAP_PLACEHOLDER = "Start writing or type '/' for commands";

/**
 * Node-aware placeholder text. The Placeholder extension only evaluates
 * this for empty textblock nodes, so an empty heading shows "Heading 2"
 * instead of the generic writing prompt.
 */
export const placeholderForEmptyNode = ({ node }: { node: Node }) => {
  if (node.type.name === "heading") {
    return `Heading ${node.attrs.level}`;
  }
  return TIPTAP_PLACEHOLDER;
};

/**
 * Factory for the Tiptap extension set used in production editors.
 *
 * Keeping this list in one place guarantees that tests, the public renderer
 * and every admin editing surface share the same document semantics.
 */
export const createProductionExtensions = (
  modalService?: SlashCommandModalService,
) => [
  StarterKit.configure({
    bold: false,
    heading: {
      levels: [1, 2, 3, 4],
    },
    link: false,
    blockquote: {
      HTMLAttributes: {
        class: "not-prose",
      },
    },
  }),
  CustomBold,
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  CustomLink.configure({ openOnClick: false }),
  CustomImage,
  Youtube.configure({
    nocookie: true,
  }),
  ProductNode,
  InfoBoxNode,
  TableContentNode,
  SlashMenuExtension.configure({
    modalService,
  }),
  Placeholder.configure({
    // The extension only evaluates the placeholder for empty textblock
    // nodes, and the node is passed along, so we can tailor the prompt
    // to the current node type (e.g. "Heading 2" on an empty h2).
    placeholder: placeholderForEmptyNode,
    showOnlyWhenEditable: true,
    // Show the prompt on the empty paragraph that currently holds the
    // cursor, instead of decorating every empty node at once.
    showOnlyCurrent: true,
    emptyEditorClass: "is-editor-empty",
  }),
];
