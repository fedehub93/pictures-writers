import type { Editor } from "@tiptap/react";

export const setImage = (
  editor: Editor,
  position: number,
  values: Record<string, string>
) => {
  if (position) {
    editor.commands.setNodeSelection(position);
    editor.commands.updateAttributes("image", values);
  }
};

export const unsetImage = (editor: Editor, position: number) => {
  if (position) {
    editor.commands.setNodeSelection(position);
    editor.commands.deleteSelection();
  }
};
