import { Extension } from "@tiptap/core";
import { Fragment, Slice } from "@tiptap/pm/model";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const DEFAULT_CELL_ATTRS = { colspan: 1, rowspan: 1, colwidth: null };

const normalizeTablePasteKey = new PluginKey("normalizeTablePaste");

type GridCell = {
  node: PMNode;
  colspan: number;
  rowspan: number;
};

const childrenOf = (node: PMNode): PMNode[] => {
  const children: PMNode[] = [];
  for (let i = 0; i < node.childCount; i += 1) {
    children.push(node.child(i));
  }
  return children;
};

const readGrid = (table: PMNode): GridCell[][] =>
  childrenOf(table).map((row) =>
    childrenOf(row).map((cell) => ({
      node: cell,
      colspan: (cell.attrs.colspan as number) || 1,
      rowspan: (cell.attrs.rowspan as number) || 1,
    })),
  );

const needsNormalization = (grid: GridCell[][]): boolean => {
  const columnCount = grid[0]?.length ?? 0;
  return grid.some(
    (row) =>
      row.length !== columnCount ||
      row.some((cell) => cell.colspan !== 1 || cell.rowspan !== 1),
  );
};

const defaultCell = (cell: GridCell): PMNode =>
  cell.node.type.create(DEFAULT_CELL_ATTRS, cell.node.content);

const expandGrid = (table: PMNode, grid: GridCell[][]): PMNode[] => {
  const columnCount = Math.max(
    ...grid.map((row) => row.reduce((width, cell) => width + cell.colspan, 0)),
  );
  const occupied: (GridCell | undefined)[][] = grid.map(() =>
    Array.from({ length: columnCount }),
  );

  grid.forEach((row, rowIndex) => {
    let column = 0;
    for (const cell of row) {
      while (occupied[rowIndex][column]) {
        column += 1;
      }
      for (let rowOffset = 0; rowOffset < cell.rowspan; rowOffset += 1) {
        for (
          let columnOffset = 0;
          columnOffset < cell.colspan;
          columnOffset += 1
        ) {
          occupied[rowIndex + rowOffset][column + columnOffset] = cell;
        }
      }
      column += cell.colspan;
    }
  });

  const anchorCellType = grid[0][0].node.type;
  return childrenOf(table).map((row, rowIndex) => {
    const rowCellType = grid[rowIndex][0]?.node.type ?? anchorCellType;
    return row.type.create(
      null,
      Fragment.from(
        occupied[rowIndex].map((cell) =>
          cell
            ? defaultCell(cell)
            : rowCellType.create(DEFAULT_CELL_ATTRS),
        ),
      ),
    );
  });
};

const normalizeTable = (table: PMNode): PMNode | null => {
  const grid = readGrid(table);
  if (!needsNormalization(grid)) return null;
  return table.type.create(table.attrs, expandGrid(table, grid));
};

const rewriteFragment = (fragment: Fragment): Fragment => {
  let changed = false;
  const children: PMNode[] = [];
  fragment.forEach((child) => {
    if (child.type.spec.tableRole === "table") {
      const rewritten = normalizeTable(child) ?? child;
      if (rewritten !== child) changed = true;
      children.push(rewritten);
      return;
    }
    const inner = rewriteFragment(child.content);
    if (inner !== child.content) {
      changed = true;
      children.push(child.copy(inner));
    } else {
      children.push(child);
    }
  });
  return changed ? Fragment.fromArray(children) : fragment;
};

/**
 * Purely rewrites a pasted slice so every table is rectangular and free of
 * merges: merged or ragged cells are expanded and their content is duplicated
 * across every grid position the cell covered.
 */
export const normalizeTableSlice = (slice: Slice): Slice => {
  const content = rewriteFragment(slice.content);
  if (content === slice.content) return slice;
  return new Slice(content, slice.openStart, slice.openEnd);
};

/**
 * Strips table geometry on paste so the document never holds merged cells or
 * ragged rows.
 */
export const TablePaste = Extension.create({
  name: "tablePasteNormalizer",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: normalizeTablePasteKey,
        props: {
          transformPasted: (slice) => normalizeTableSlice(slice),
        },
      }),
    ];
  },
});