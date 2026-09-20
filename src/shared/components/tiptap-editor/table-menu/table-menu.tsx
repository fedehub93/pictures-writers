"use client";

import "client-only";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpToLine,
  Columns3,
  PanelTop,
  Plus,
  Rows3,
  Trash2,
} from "lucide-react";

import { Button } from "@/shared/ui/button";

import {
  type TableMenuAction,
  runTableMenuAction,
  tableMenuStateAtCell,
} from "../extensions/table/menu";
import {
  HIDE_DELAY_MS,
  HideScheduler,
  hoverReducer,
  type TableMenuAnchor,
  type HoverSignal,
} from "./hover-controller";

interface TableMenuProps {
  editor: Editor | null;
}

const rectOf = (rect: DOMRect): TableMenuAnchor["cell"] => ({
  top: rect.top,
  right: rect.right,
  bottom: rect.bottom,
  left: rect.left,
  width: rect.width,
});

const cellPosAtPoint = (
  editor: Editor,
  point: { left: number; top: number },
): number | null => {
  const coords = editor.view.posAtCoords(point);
  if (!coords) return null;
  const $pos = editor.state.doc.resolve(coords.pos);
  for (let depth = $pos.depth; depth >= 1; depth -= 1) {
    const role = $pos.node(depth).type.spec.tableRole;
    if (role === "cell" || role === "header_cell") {
      return $pos.before(depth);
    }
  }
  return null;
};

const cellElementAtPos = (
  editor: Editor,
  cellPos: number,
): HTMLElement | null => {
  const at = editor.view.domAtPos(cellPos + 1);
  const node = at?.node ?? null;
  if (!node) return null;
  const element =
    node.nodeType === Node.TEXT_NODE
      ? node.parentElement
      : (node as HTMLElement);
  return element?.closest?.("td, th") ?? null;
};

const tableWrapperAt = (
  cellEl: HTMLElement,
): { tableEl: Element; wrapperEl: Element } | null => {
  const tableEl = cellEl.closest("table");
  const wrapperEl = tableEl?.parentElement ?? null;
  if (!tableEl || !wrapperEl) return null;
  return { tableEl, wrapperEl };
};

export const TableMenu = ({ editor }: TableMenuProps) => {
  const [anchor, setAnchor] = useState<TableMenuAnchor | null>(null);
  const anchorRef = useRef<TableMenuAnchor | null>(null);
  const pointRef = useRef<{ left: number; top: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const applySignalRef = useRef<(signal: HoverSignal) => void>(() => undefined);
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!editor) return;

    const view = editor.view;
    const dom = view.dom;

    const scheduler = new HideScheduler(() => {
      pointRef.current = null;
      anchorRef.current = null;
      setAnchor(null);
    }, HIDE_DELAY_MS);

    const applySignal = (signal: HoverSignal) => {
      const decision = hoverReducer(anchorRef.current, signal);
      anchorRef.current = decision.anchor;
      setAnchor(decision.anchor);
      if (decision.timer === "arm") scheduler.arm();
      else if (decision.timer === "cancel") scheduler.cancel();
    };
    applySignalRef.current = applySignal;

    const showAtCell = (cellEl: HTMLElement) => {
      const wrapper = tableWrapperAt(cellEl);
      if (!wrapper) return false;

      const cellRect = cellEl.getBoundingClientRect();
      const point = {
        left: cellRect.left + cellRect.width / 2,
        top: cellRect.top + cellRect.height / 2,
      };
      const cellPos = cellPosAtPoint(editor, point);
      if (cellPos === null || !tableMenuStateAtCell(editor.state.doc, cellPos)) {
        return false;
      }

      pointRef.current = point;
      applySignal({
        type: "cell",
        anchor: {
          cellPos,
          cell: rectOf(cellRect),
          table: rectOf(wrapper.wrapperEl.getBoundingClientRect()),
        },
      });
      return true;
    };

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const cellEl = target?.closest?.("td, th") as HTMLElement | null;
      if (!cellEl || !dom.contains(cellEl) || !showAtCell(cellEl)) {
        applySignal({ type: "interstitial" });
      }
    };

    const onMouseLeave = (event: MouseEvent) => {
      const related = event.relatedTarget as Node | null;
      applySignal({
        type: "editorLeave",
        towardMenu: overlayRef.current?.contains(related) ?? false,
      });
    };

    const onScroll = () => {
      scheduler.cancel();
      pointRef.current = null;
      anchorRef.current = null;
      setAnchor(null);
    };

    const onTransaction = () => {
      const current = anchorRef.current;
      if (!current) return;
      const cellEl = cellElementAtPos(editor, current.cellPos);
      if (!cellEl || !dom.contains(cellEl)) {
        applySignal({ type: "editorLeave", towardMenu: false });
        return;
      }
      const wrapper = tableWrapperAt(cellEl);
      if (!wrapper) return;
      applySignal({
        type: "cell",
        anchor: {
          cellPos: current.cellPos,
          cell: rectOf(cellEl.getBoundingClientRect()),
          table: rectOf(wrapper.wrapperEl.getBoundingClientRect()),
        },
      });
    };

    dom.addEventListener("mouseover", onMouseOver);
    dom.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("scroll", onScroll, true);
    editor.on("transaction", onTransaction);

    return () => {
      dom.removeEventListener("mouseover", onMouseOver);
      dom.removeEventListener("mouseleave", onMouseLeave);
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", onScroll, true);
      }
      editor.off("transaction", onTransaction);
      scheduler.cancel();
      applySignalRef.current = () => undefined;
    };
  }, [editor]);

  // Measure the toolbar so the menu can be clamped to the viewport: the wide
  // toolbar must never reach outside the table and disappear while the pointer
  // is on an outermost action.
  useLayoutEffect(() => {
    const element = toolbarRef.current;
    if (!element || !anchor) return;
    const { offsetWidth, offsetHeight } = element;
    if (offsetWidth === 0 && offsetHeight === 0) return;
    setMenuSize((current) =>
      current.width === offsetWidth && current.height === offsetHeight
        ? current
        : { width: offsetWidth, height: offsetHeight },
    );
  }, [anchor]);

  const menuState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor || !anchor) return null;
      return tableMenuStateAtCell(editor.state.doc, anchor.cellPos);
    },
  });

  if (!editor || !anchor || !menuState) return null;

  const runAction = (action: TableMenuAction) => {
    if (!editor || !anchor) return;
    if (runTableMenuAction(editor, action, anchor.cellPos)) {
      editor.commands.focus();
    }
  };

  const menuLeft = Math.min(
    Math.max(
      anchor.cell.left + anchor.cell.width / 2,
      16 + menuSize.width / 2,
    ),
    window.innerWidth - 16 - menuSize.width / 2,
  );
  const menuTop =
    anchor.cell.top < 240
      ? Math.min(anchor.cell.bottom + 8, window.innerHeight - menuSize.height - 8)
      : Math.max(anchor.cell.top - menuSize.height - 8, 8);

  const structuralActions: {
    action: TableMenuAction;
    label: string;
    Icon: typeof Rows3;
    disabled?: boolean;
  }[] = [
    { action: "addRowAbove", label: "Insert row above", Icon: ArrowUpToLine },
    { action: "addRowBelow", label: "Insert row below", Icon: ArrowDownToLine },
    {
      action: "addColumnLeft",
      label: "Insert column left",
      Icon: ArrowLeftToLine,
    },
    {
      action: "addColumnRight",
      label: "Insert column right",
      Icon: ArrowRightToLine,
    },
    {
      action: "deleteRow",
      label: "Delete row",
      Icon: Rows3,
      disabled: !menuState.canDeleteRow,
    },
    {
      action: "deleteColumn",
      label: "Delete column",
      Icon: Columns3,
      disabled: !menuState.canDeleteColumn,
    },
  ];

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-40"
      onMouseEnter={() => applySignalRef.current({ type: "menuEnter" })}
      onMouseLeave={() => applySignalRef.current({ type: "menuLeave" })}
      onMouseDown={(event) => event.preventDefault()}
    >
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Table row and column actions"
        className="pointer-events-auto absolute flex -translate-x-1/2 items-center gap-0.5 rounded-md border bg-background p-1 shadow-md"
        style={{ top: menuTop, left: menuLeft }}
      >
        {structuralActions.map(({ action, label, Icon, disabled }) => (
          <Button
            key={action}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={() => runAction(action)}
          >
            <Icon />
          </Button>
        ))}

        <div
          role="separator"
          aria-orientation="vertical"
          className="mx-1 h-6 w-px bg-border"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle header row"
          aria-pressed={menuState.hasHeaderRow}
          title="Toggle header row"
          onClick={() => runAction("toggleHeaderRow")}
        >
          <PanelTop />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Delete table"
          title="Delete table"
          onClick={() => runAction("deleteTable")}
        >
          <Trash2 />
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Add column to the right"
        title="Add column to the right"
        className="pointer-events-auto absolute border bg-background shadow-sm"
        style={{
          top: anchor.table.top + (anchor.table.bottom - anchor.table.top) / 2,
          left: anchor.table.right + 4,
        }}
        onClick={() => runAction("addColumnRight")}
      >
        <Plus />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Add row below"
        title="Add row below"
        className="pointer-events-auto absolute border bg-background shadow-sm"
        style={{
          top: anchor.table.bottom + 4,
          left: anchor.table.left + anchor.table.width / 2,
        }}
        onClick={() => runAction("addRowBelow")}
      >
        <Plus />
      </Button>
    </div>
  );
};