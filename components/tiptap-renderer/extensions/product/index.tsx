import { Node, mergeAttributes } from "@tiptap/core";

export const ProductNodeRenderer = Node.create({
  name: "product",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      productId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-product-id") || "",
        renderHTML: (attributes) => {
          if (!attributes.productId) return {};
          return { "data-product-id": attributes.productId };
        },
      },
      productTitle: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-product-title") || "",
        renderHTML: (attributes) => {
          if (!attributes.productTitle) return {};
          return { "data-product-title": attributes.productTitle };
        },
      },
      productImageUrl: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-product-image-url") || "",
        renderHTML: (attributes) => {
          if (!attributes.productImageUrl) return {};
          return { "data-product-image-url": attributes.productImageUrl };
        },
      },
      productMetadata: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-product-metadata") || "",
        renderHTML: (attributes) => {
          if (!attributes.metadata) return {};
          return { "data-product-metadata": attributes.metadata };
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "product" })];
  },
});
