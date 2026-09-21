import type { Editor } from "@tiptap/core";
import type { Node } from "@tiptap/pm/model";
import { cellAround, cellNear, isInTable, nextCell } from "@tiptap/pm/tables";

export type TableMenuAction =
  | "addRowAbove"
  | "addRowBelow"
  | "addColumnLeft"
  | "addColumnRight"
  | "deleteRow"
  | "deleteColumn"
  | "toggleHeaderRow"
  | "deleteTable";

export interface TableMenuState {
  rows: number;
  columns: number;
  canDeleteRow: boolean;
  canDeleteColumn: boolean;
  hasHeaderRow: boolean;
}

const parentTableAt = (doc: Node, pos: number): Node | null => {
  const safePos = Math.max(1, Math.min(pos, doc.content.size));
  const $pos = doc.resolve(safePos);
  for (let depth = $pos.depth; depth >= 0; depth -= 1) {
    const node = $pos.node(depth);
    if (node.type.spec.tableRole === "table") return node;
  }
  return null;
};

/**
 * Describes the grid hosting the given cell position, so the hover menu can
 * expose the structural operations with the correct disabled states. Works
 * against the document only: the hovered cell is what matters, not the caret.
 */
export const tableMenuStateAtCell = (
  doc: Node,
  cellPos: number,
): TableMenuState | null => {
  const table = parentTableAt(doc, cellPos);
  if (!table) return null;

  const firstRow = table.firstChild;
  const columns = firstRow?.childCount ?? 0;
  const rows = table.childCount;

  let hasHeaderRow = false;
  if (firstRow) {
    for (let column = 0; column < firstRow.childCount; column += 1) {
      if (firstRow.child(column).type.spec.tableRole === "header_cell") {
        hasHeaderRow = true;
        break;
      }
    }
  }

  return {
    rows,
    columns,
    canDeleteRow: rows > 1,
    canDeleteColumn: columns > 1,
    hasHeaderRow,
  };
};

const TABLE_MENU_COMMANDS: Record<
  TableMenuAction,
  (editor: Editor) => boolean
> = {
  addRowAbove: (editor) => editor.commands.addRowBefore(),
  addRowBelow: (editor) => editor.commands.addRowAfter(),
  addColumnLeft: (editor) => editor.commands.addColumnBefore(),
  addColumnRight: (editor) => editor.commands.addColumnAfter(),
  deleteRow: (editor) => editor.commands.deleteRow(),
  deleteColumn: (editor) => editor.commands.deleteColumn(),
  toggleHeaderRow: (editor) => editor.commands.toggleHeaderRow(),
  deleteTable: (editor) => editor.commands.deleteTable(),
};

/**
 * The cell the caret lands in after each structural insertion, expressed as a
 * move from the hovered cell: rows keep the column, columns keep the row.
 * This mirrors the keyboard behaviour (Tab/Enter land in the new row/column),
 * so inserting from the menu or the "+" knobs selects the created cell.
 */
const INSERT_NEXT_CELL: Partial<
  Record<TableMenuAction, { dir: 1 | -1; axis: "horiz" | "vert" }>
> = {
  addRowAbove: { axis: "vert", dir: -1 },
  addRowBelow: { axis: "vert", dir: 1 },
  addColumnLeft: { axis: "horiz", dir: -1 },
  addColumnRight: { axis: "horiz", dir: 1 },
};

/**
 * Applies one of the structural operations relative to the hovered cell,
 * placing the caret into that cell first so the action targets it even when
 * the cursor lives elsewhere (e.g. another cell, or outside the table).
 * Inserting a row/column then moves the caret into the cell that was created,
 * matching the keyboard behaviour; deletions leave the caret where the grid
 * maps it.
 */
export const runTableMenuAction = (
  editor: Editor,
  action: TableMenuAction,
  cellPos: number,
): boolean => {
  const doc = editor.state.doc;
  const safePos = Math.max(1, Math.min(cellPos, doc.content.size));
  const state = tableMenuStateAtCell(doc, safePos);
  if (!state) return false;
  if (action === "deleteRow" && !state.canDeleteRow) return false;
  if (action === "deleteColumn" && !state.canDeleteColumn) return false;

  const $pos = doc.resolve(safePos);
  let selectionPos = safePos + 2;
  for (let depth = $pos.depth; depth >= 1; depth -= 1) {
    const role = $pos.node(depth).type.spec.tableRole;
    if (role === "cell" || role === "header_cell") {
      selectionPos = $pos.before(depth) + 2;
      break;
    }
  }

  editor.commands.setTextSelection(selectionPos);
  const applied = TABLE_MENU_COMMANDS[action](editor);

  const move = INSERT_NEXT_CELL[action];
  if (applied && move && isInTable(editor.state)) {
    const $cell =
      cellAround(editor.state.selection.$head) ??
      cellNear(editor.state.selection.$head);
    const target = $cell ? nextCell($cell, move.axis, move.dir) : null;
    if (target) editor.commands.setTextSelection(target.pos + 2);
  }

  return applied;
};