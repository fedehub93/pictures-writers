import Heading from "@tiptap/extension-heading";
import { mergeAttributes } from "@tiptap/core";

export const CustomHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: element => element.getAttribute("id"),
        renderHTML: attributes => {
          if (!attributes.id) return {};
          return { id: attributes.id };
        },
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const textContent = node.textContent || "";
    const generatedId =
      HTMLAttributes.id ||
      textContent
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^\w_]/g, ""); // rimuove simboli

    return [
      `h${node.attrs.level}`,
      mergeAttributes(HTMLAttributes, { id: generatedId }),
      0,
    ];
  },
});
