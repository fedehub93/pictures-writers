import { Node, mergeAttributes } from "@tiptap/core";

export const ProductNodeRenderer = Node.create({
  name: "product",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      productRootId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-product-id") || "",
        renderHTML: (attributes) => {
          if (!attributes.productRootId) return {};
          return { "data-product-root-id": attributes.productRootId };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "product" })];
  },
});
