import type { Editor } from "@tiptap/react";

export const insertInfoBox = (
  editor: Editor,
  data: { icon: "💡" } = { icon: "💡" }
) => {
  editor
    .chain()
    .focus()
    .insertInfoBox({ ...data });
};
