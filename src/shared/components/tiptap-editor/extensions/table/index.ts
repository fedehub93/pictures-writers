import { mergeAttributes } from "@tiptap/core";
import {
  Table,
  TableCell,
  TableHeader,
  TableRow,
  type TableOptions,
} from "@tiptap/extension-table";

import { TableNavigationKeymap } from "./keymap";
import { TablePaste } from "./paste";

/**
 * Structural merge commands stay out of the command surface so the grid can
 * never become non-rectangular through editing. Pasting is the only way
 * geometry can enter, and the paste normalizer removes it immediately.
 */
const STRUCTURAL_MERGE_COMMANDS = [
  "mergeCells",
  "splitCell",
  "mergeOrSplit",
  "setCellAttribute",
];

const structuralTable = Table.extend({
  addOptions(): TableOptions {
    return {
      ...this.parent?.(),
      resizable: true,
    } as TableOptions;
  },

  addCommands() {
    const parent = this.parent?.() as Record<string, unknown> | undefined;
    return Object.fromEntries(
      Object.entries(parent ?? {}).filter(
        ([name]) => !STRUCTURAL_MERGE_COMMANDS.includes(name),
      ),
    ) as never;
  },
});

/**
 * Cell content is restricted to a single paragraph: one text block per cell
 * keeps the grid well-formed for both editing and the public renderer.
 * Colspan/rowspan are captured on parse (so merged HTML pastes expand to a
 * rectangular grid without data loss) but never rendered.
 */
const inlineCell = (
  name: "tableCell" | "tableHeader",
  base: typeof TableCell | typeof TableHeader,
  tag: "td" | "th",
) =>
  base.extend({
    content: "paragraph",

    addAttributes() {
      return {
        ...this.parent?.(),
        colspan: {
          default: 1,
          rendered: false,
          parseHTML: (element) => Number(element.getAttribute("colspan")) || 1,
        },
        rowspan: {
          default: 1,
          rendered: false,
          parseHTML: (element) => Number(element.getAttribute("rowspan")) || 1,
        },
      };
    },

    renderHTML({ HTMLAttributes }) {
      return [
        tag,
        mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
        0,
      ];
    },
  });

export const InlineTableCell = inlineCell("tableCell", TableCell, "td");
export const InlineTableHeader = inlineCell("tableHeader", TableHeader, "th");

/**
 * The table family without structural merge commands, plus the keyboard
 * navigation and the paste normalizer.
 */
export const createTableExtensions = () => [
  structuralTable,
  TableRow,
  InlineTableCell,
  InlineTableHeader,
  TableNavigationKeymap,
  TablePaste,
];