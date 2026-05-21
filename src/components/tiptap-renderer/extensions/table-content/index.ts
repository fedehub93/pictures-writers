import { Node, mergeAttributes } from "@tiptap/core";

export const TableContentNodeRenderer = Node.create({
  name: "tablecontent",
  content: "block+",
  group: "block",

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "tablecontent" }),
      0,
    ];
  },
});
