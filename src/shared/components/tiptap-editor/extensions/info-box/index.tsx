import { Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { InfoBoxBlock } from "./ui/InfoBoxNode";

export const DEFAULT_INFO_BOX_ICON = "💡";

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

export const InfoBoxNode = TiptapNode.create({
  name: "infobox",
  group: "block",
  draggable: true,
  content: "block+",

  addAttributes() {
    return {
      icon: {
        default: DEFAULT_INFO_BOX_ICON,
        parseHTML: (element) =>
          element.getAttribute("data-icon") || DEFAULT_INFO_BOX_ICON,
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
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const iconEl = el.querySelector<HTMLElement>("[data-icon]");
          if (iconEl) return { icon: iconEl.getAttribute("data-icon") };
          return {};
        },
        contentElement: (element) => {
          const el = element.cloneNode(true) as HTMLElement;
          const iconEl = el.querySelector<HTMLElement>(
            ".post__info-box-icon, [data-icon]",
          );
          if (iconEl) iconEl.remove();
          return el;
        },
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
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: "Type here..." }],
                },
              ],
            })
            .run();
        },
    };
  },
});
