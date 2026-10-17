import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import StarterKit from "@tiptap/starter-kit";

/**
 * A trimmed extension set for the reply composer: inline formatting, lists,
 * alignment and links only. It intentionally omits the heavier editor blocks
 * (headings, images, tables, embeds, slash menu) that a one-to-one reply does
 * not need.
 */
export const createComposerExtensions = (
  placeholder = "Write your reply…",
) => [
  StarterKit.configure({
    heading: false,
    codeBlock: false,
    blockquote: false,
    horizontalRule: false,
    link: {
      openOnClick: false,
      autolink: true,
      HTMLAttributes: {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      },
    },
  }),
  TextAlign.configure({ types: ["paragraph"] }),
  Placeholder.configure({
    placeholder,
    showOnlyWhenEditable: true,
    showOnlyCurrent: true,
    emptyEditorClass: "is-editor-empty",
  }),
];
