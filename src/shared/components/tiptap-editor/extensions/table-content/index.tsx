import { Node as TiptapNode, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { TableContentBlock } from "./ui/table-content-node";

export interface TableContentAttrs {}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableContent: {
      insertTableContent: () => ReturnType;
    };
  }
}

export const TableContentNode = TiptapNode.create({
  name: "tablecontent",
  group: "block",
  draggable: true,
  content: "block+",

  parseHTML() {
    return [
      {
        tag: "div[data-type='tablecontent']",
        contentElement: (element) => {
          const el = element.cloneNode(true) as HTMLElement;
          const title = el.querySelector(
            ".mb-4.font-bold, div:first-child",
          );
          if (title) title.remove();
          return el;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "tablecontent" }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableContentBlock);
  },

  addCommands() {
    return {
      // insertTableContent:
      //   () =>
      //   ({ editor }) => {
      //     return editor.commands.insertContent({
      //       type: this.name,
      //       content: [
      //         {
      //           type: "paragraph",
      //           content: [{ type: "text", text: "Type here..." }],
      //         },
      //       ],
      //     });
      //   },
      insertTableContent:
        () =>
        ({ commands, editor }) => {
          const items: any[] = [];

          editor.state.doc.descendants((node) => {
            if (node.type.name === "heading" && node.attrs.level === 2) {
              const text = node.textContent;
              const id = text
                .toLowerCase()
                .replace(/\s+/g, "_")
                .replace(/[^\w_]/g, "");
              items.push({
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text,
                        marks: [
                          {
                            type: "link",
                            attrs: {
                              href: `#${id}`,
                            },
                          },
                        ],
                      },
                    ],
                  },
                ],
                attrs: { id },
              });
            }
          });

          return editor.commands.insertContent({
            type: "tablecontent",
            content: [
              {
                type: "orderedList",
                content: items,
              },
            ],
          });
        },
    };
  },
});
