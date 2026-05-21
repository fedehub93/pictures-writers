import { Node, mergeAttributes } from "@tiptap/core";

export const InfoBoxNodeRenderer = Node.create({
  name: "infobox",
  content: "block+",
  group: "block",

  addAttributes() {
    return {
      icon: {
        default: "💡",
        parseHTML: (element) => element.getAttribute("data-icon") || "💡",
        renderHTML: (attributes) => ({
          "data-icon": attributes.icon,
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "infobox" }),
      0,
    ];
  },
});
