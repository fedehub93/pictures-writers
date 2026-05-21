import type { Editor } from "@tiptap/react";

export const insertTableContent = (editor: Editor) => {
  editor.chain().focus().insertTableContent();
};

export const deleteToC = (editor: Editor, position: number) => {
  if (position) {
    editor.commands.setNodeSelection(position);
    editor.commands.deleteSelection();
  }
};
