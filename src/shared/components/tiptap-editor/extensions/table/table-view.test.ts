// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { Editor } from "@tiptap/core";
import type { EditorView } from "@tiptap/pm/view";

import { createProductionExtensions } from "../../lib/create-editor-extensions";
import { TableBlockView } from "./table-view";

const createTableNode = () => {
  const editor = new Editor({
    extensions: createProductionExtensions(),
    content: { type: "doc", content: [] },
  });
  editor.commands.insertTable({ rows: 2, cols: 3, withHeaderRow: true });
  const table = editor.state.doc.firstChild;
  editor.destroy();
  if (!table) throw new Error("No table inserted");
  return table;
};

describe("TableBlockView (editor scroll layer)", () => {
  it("wraps the grid in an internal scroll layer while keeping the handle on the wrapper", () => {
    const view = new TableBlockView(createTableNode(), 25, {} as EditorView);

    expect(view.dom.className).toContain("tableWrapper");

    const scrollLayer = view.dom.querySelector(".table-scroll-layer");
    expect(scrollLayer).not.toBeNull();
    expect(scrollLayer?.contains(view.table)).toBe(true);
    expect(scrollLayer?.contains(view.contentDOM)).toBe(true);

    const handle = view.dom.querySelector(".table-block-drag-handle");
    expect(handle).not.toBeNull();
    expect(scrollLayer?.contains(handle)).toBe(false);
    expect(view.dom.contains(handle)).toBe(true);
  });
});