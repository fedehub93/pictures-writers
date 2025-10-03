import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

import { EmbeddedProductView } from "./ui/EmbeddedProductView";

export interface ProductAttrs {
  productRootId: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    product: {
      insertProduct: (attrs: ProductAttrs) => ReturnType;
    };
  }
}

export const ProductNode = Node.create({
  name: "product",
  group: "block",
  atom: true,
  draggable: true,

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

  parseHTML() {
    return [
      {
        tag: "div[data-product-root-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "product" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbeddedProductView);
  },

  addCommands() {
    return {
      insertProduct:
        (attrs: ProductAttrs) =>
        ({ editor }) => {
          return editor.commands.insertContent({
            type: this.name,
            attrs,
          });
        },
    };
  },
});
