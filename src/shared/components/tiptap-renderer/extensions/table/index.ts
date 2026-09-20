import { Node, mergeAttributes } from "@tiptap/core";
import { createColGroup } from "@tiptap/extension-table";

const TABLE_CLASSNAME = "post__table";
const TABLE_CELL_MIN_WIDTH = 25;

const cellAttributes = () => ({
  colspan: { default: 1, rendered: false },
  rowspan: { default: 1, rendered: false },
  colwidth: { default: null, rendered: false },
  align: {
    default: null,
    renderHTML: (attributes: Record<string, string | null>) =>
      attributes.align ? { style: `text-align: ${attributes.align}` } : {},
  },
});

export const TableNodeRenderer = Node.create({
  name: "table",
  group: "block",
  content: "tableRow+",
  isolating: true,
  tableRole: "table",

  renderHTML({ node, HTMLAttributes }) {
    const colGroup = createColGroup(node, TABLE_CELL_MIN_WIDTH);
    const hasColumns = "colgroup" in colGroup;
    const tableStyle = hasColumns
      ? colGroup.tableWidth
        ? `width: ${colGroup.tableWidth}`
        : `min-width: ${colGroup.tableMinWidth}`
      : "";
    const attrs = mergeAttributes(HTMLAttributes, {
      class: TABLE_CLASSNAME,
      ...(tableStyle ? { style: tableStyle } : {}),
    });

    return hasColumns
      ? ["table", attrs, colGroup.colgroup, ["tbody", 0]]
      : ["table", attrs, ["tbody", 0]];
  },
});

export const TableRowNodeRenderer = Node.create({
  name: "tableRow",
  content: "(tableCell | tableHeader)*",
  tableRole: "row",

  renderHTML({ HTMLAttributes }) {
    return ["tr", mergeAttributes(HTMLAttributes), 0];
  },
});

export const TableCellNodeRenderer = Node.create({
  name: "tableCell",
  content: "paragraph",
  isolating: true,
  tableRole: "cell",

  addAttributes() {
    return cellAttributes();
  },

  renderHTML({ HTMLAttributes }) {
    return ["td", mergeAttributes(HTMLAttributes), 0];
  },
});

export const TableHeaderNodeRenderer = Node.create({
  name: "tableHeader",
  content: "paragraph",
  isolating: true,
  tableRole: "header_cell",

  addAttributes() {
    return cellAttributes();
  },

  renderHTML({ HTMLAttributes }) {
    return ["th", mergeAttributes(HTMLAttributes), 0];
  },
});