import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";

import { CustomBold } from "../extensions/bold";
import { CustomLink } from "../extensions/link";
import { CustomImage } from "../extensions/image";
import { ProductNode } from "../extensions/product";
import { InfoBoxNode } from "../extensions/info-box";
import { TableContentNode } from "../extensions/table-content";

export const TIPTAP_PLACEHOLDER = "Start writing or type '/' for commands";

/**
 * Factory for the Tiptap extension set used in production editors.
 *
 * Keeping this list in one place guarantees that tests, the public renderer
 * and every admin editing surface share the same document semantics.
 * `TableContentNode` stays registered so existing persisted content keeps
 * loading and rendering, but it is intentionally omitted from new insertion
 * surfaces such as the toolbar or any future slash menu.
 */
export const createProductionExtensions = () => [
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
  Placeholder.configure({
    placeholder: ({ editor }) => {
      if (editor.isEmpty) {
        return TIPTAP_PLACEHOLDER;
      }
      return "";
    },
    showOnlyWhenEditable: true,
    showOnlyCurrent: false,
    emptyEditorClass: "is-editor-empty",
  }),
];
