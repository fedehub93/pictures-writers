import { Extension, type Editor } from "@tiptap/core";
import type { ResolvedPos } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import {
  cellAround,
  cellNear,
  findTable,
  isInTable,
  nextCell,
} from "@tiptap/pm/tables";

const cellAtCursor = (editor: Editor): ResolvedPos | null | undefined => {
  const { selection } = editor.state;
  if (!isInTable(editor.state)) return null;
  return cellAround(selection.$head) ?? cellNear(selection.$head);
};

/**
 * Enter moves the caret to the cell below and adds a row when the caret is on
 * the last row, matching Notion's grid behaviour.
 */
export const TableNavigationKeymap = Extension.create({
  name: "tableNavigationKeymap",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const editor = this.editor;
        const $cell = cellAtCursor(editor);
        if (!$cell) return false;

        const below = nextCell($cell, "vert", 1);
        if (below) {
          return editor.commands.setTextSelection(below.pos + 2);
        }

        if (!editor.commands.addRowAfter()) return true;
        const $moved = cellAtCursor(editor);
        const target = $moved ? nextCell($moved, "vert", 1) : null;
        return target ? editor.commands.setTextSelection(target.pos + 2) : true;
      },
      Escape: () => {
        const editor = this.editor;
        const table = findTable(editor.state.selection.$head);
        if (!table) return false;

        const tableEnd = table.pos + table.node.nodeSize;
        const $end = editor.state.doc.resolve(tableEnd);
        if (!$end.nodeAfter) {
          return editor.commands.setNodeSelection(table.pos);
        }
        const tr = editor.state.tr.setSelection(
          Selection.near(editor.state.doc.resolve(tableEnd)),
        );
        editor.view.dispatch(tr);
        return true;
      },
    };
  },
});