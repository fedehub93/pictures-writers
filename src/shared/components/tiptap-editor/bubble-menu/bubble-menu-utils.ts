import type { Editor } from "@tiptap/core";
import { NodeSelection, TextSelection, type EditorState } from "@tiptap/pm/state";

export const shouldShowBubbleMenu = ({
  editor,
  state,
}: {
  editor: Editor;
  state: EditorState;
  from: number;
  to: number;
}): boolean => {
  if (!editor.isEditable) return false;
  if (state.selection.empty) return false;
  if (state.selection instanceof NodeSelection) return false;
  if (!(state.selection instanceof TextSelection)) return false;

  return true;
};
