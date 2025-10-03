import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InfoBoxBlock } from "./ui/InfoBoxNode";

export interface InfoBoxAttrs {
  icon: string;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    infoBox: {
      insertInfoBox: (attrs: InfoBoxAttrs) => ReturnType;
    };
  }
}

export const InfoBoxNode = Node.create({
  name: "infobox",
  group: "block",
  draggable: true,
  content: "block+",

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

  parseHTML() {
    return [
      {
        tag: "div[data-type='infobox']",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "infobox" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InfoBoxBlock);
  },

  addCommands() {
    return {
      insertInfoBox:
        (attrs) =>
        ({ editor }) => {
          return editor.commands.insertContent({
            type: this.name,
            attrs,
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Type here..." }],
              },
            ],
          });
        },
    };
  },
});
