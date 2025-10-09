import { Node, mergeAttributes } from "@tiptap/core";

export const AdBlockNodeRenderer = Node.create({
  name: "adBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      blockId: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-block-id") || "",
        renderHTML: (attributes) => {
          if (!attributes.blockId) return {};
          return { "data-block-id": attributes.blockId };
        },
      },
      layout: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-layout") || "",
        renderHTML: (attributes) => {
          if (!attributes.layout) return {};
          return { "data-layout": attributes.layout };
        },
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-title") || "",
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return { "data-title": attributes.title };
        },
      },
      description: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-description") || "",
        renderHTML: (attributes) => {
          if (!attributes.description) return {};
          return { "data-description": attributes.description };
        },
      },
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("src") || "",
        renderHTML: (attributes) => {
          if (!attributes.src) return {};
          return { src: attributes.src };
        },
      },
      url: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-url") || "",
        renderHTML: (attributes) => {
          if (!attributes.url) return {};
          return { "data-url": attributes.url };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="adBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Restituisci una struttura self-contained valida
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "adBlock" }),
      0, // <-- necessario per dire a Tiptap che può avere figli (anche se atom)
    ];
  },
});
