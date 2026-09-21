import { TableView } from "@tiptap/extension-table";
import type { Node } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

const DRAG_HANDLE_CLASS = "table-block-drag-handle";
const SCROLL_LAYER_CLASS = "table-scroll-layer";

/**
 * Non-React node view for a resizable table. Renders the same wrapper as
 * Tiptap's TableView plus a draggable handle, so the whole grid can be
 * repositioned like the other custom blocks. The handle sits outside the
 * content DOM, so the inherited ignoreMutation already ignores everything it
 * produces and the document never sees it as content.
 *
 * The grid itself is wrapped in an internal scroll layer: a wide table
 * scrolls horizontally inside the wrapper instead of overflowing it, while
 * the handle (positioned on the wrapper's left edge) stays reachable.
 */
export class TableBlockView extends TableView {
  constructor(
    node: Node,
    cellMinWidth: number,
    view: EditorView,
    htmlAttributes: Record<string, unknown> = {},
  ) {
    super(node, cellMinWidth, view, htmlAttributes);

    const scrollLayer = document.createElement("div");
    scrollLayer.className = SCROLL_LAYER_CLASS;
    scrollLayer.appendChild(this.table);
    this.dom.appendChild(scrollLayer);

    const handle = document.createElement("div");
    handle.className = DRAG_HANDLE_CLASS;
    handle.setAttribute("data-table-drag-handle", "");
    handle.setAttribute("draggable", "true");
    handle.setAttribute("aria-label", "Drag to move the table");
    handle.setAttribute("contenteditable", "false");
    handle.addEventListener("mousedown", (event) => {
      // Keep the caret and the selection out of the way: the drag itself is
      // started by the browser and handled by prosemirror-view on the root.
      event.preventDefault();
      event.stopPropagation();
    });
    handle.addEventListener("dragstart", (event) => {
      // Ghost the whole table (not the small handle) while dragging, like
      // the other drag-repositionable blocks.
      const transfer = (event as DragEvent).dataTransfer;
      if (!transfer) return;
      const tableRect = this.table.getBoundingClientRect();
      const handleRect = handle.getBoundingClientRect();
      transfer.setDragImage(
        this.table,
        handleRect.left - tableRect.left + handleRect.width / 2,
        handleRect.top - tableRect.top + handleRect.height / 2,
      );
    });

    this.dom.appendChild(handle);
  }
}