"use client";
import "client-only";

import { useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { SidebarDialog } from "@/shared/components/sidebar-dialog";
import { Button } from "@/shared/ui/button";
import { DialogFooter } from "@/shared/ui/dialog";

import { createNavItem, moveNavItem } from "../lib/menu";
import {
  NAV_ITEM_TYPES,
  NAV_ITEM_TYPE_LABELS,
  type NavItem,
  type NavItemType,
} from "../types";
import { MenuItemEditor } from "./menu-item-editor";

const EMPTY_SELECTION_COPY = "Choose an item from the list or add a new one.";

/** Sentence-case label for the "add" controls. */
function addLabel(type: NavItemType): string {
  return type === "cta"
    ? "Add CTA"
    : `Add ${NAV_ITEM_TYPE_LABELS[type].toLowerCase()}`;
}

/**
 * A draft entry carries a stable key.
 *
 * Reordering must not remount the focused button, otherwise a keyboard user
 * would lose focus mid-move. The key is local to the dialog and never persisted.
 */
type DraftItem = {
  key: string;
  value: NavItem;
};

let draftKey = 0;

function createDraftItem(value: NavItem): DraftItem {
  draftKey += 1;
  return { key: `menu-item-${draftKey}`, value };
}

interface MenuItemsDialogProps {
  open: boolean;
  items: NavItem[];
  onOpenChange: (open: boolean) => void;
  onSave: (items: NavItem[]) => void;
}

/**
 * Two-pane editor for the typed navbar tree.
 *
 * The draft lives here, not in the block: "Save" commits it to the Puck field,
 * while "Cancel", Escape, the overlay and the close button all discard it. The
 * next opening copies the saved items again, so the dialog always starts from
 * what the document actually contains.
 */
export const MenuItemsDialog = ({
  open,
  items,
  onOpenChange,
  onSave,
}: MenuItemsDialogProps) => (
  <SidebarDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Navigation"
    description="Edit the menu items."
  >
    {open ? (
      <MenuItemsDraft
        items={items}
        onCancel={() => onOpenChange(false)}
        onSave={(next) => {
          onSave(next);
          onOpenChange(false);
        }}
      />
    ) : null}
  </SidebarDialog>
);

/**
 * The draft editor.
 *
 * It mounts only while the dialog is open, so every opening copies the saved
 * items again and Cancel, Escape, the overlay and the close button all discard
 * the previous draft by unmounting it.
 */
const MenuItemsDraft = ({
  items,
  onCancel,
  onSave,
}: {
  items: NavItem[];
  onCancel: () => void;
  onSave: (items: NavItem[]) => void;
}) => {
  const [draft, setDraft] = useState<DraftItem[]>(() =>
    items.map(createDraftItem),
  );
  const [selectedIndex, setSelectedIndex] = useState(
    items.length > 0 ? 0 : -1,
  );

  const selected = draft[selectedIndex]?.value;

  const addItem = (type: NavItemType) => {
    const next = [...draft, createDraftItem(createNavItem(type))];
    setDraft(next);
    setSelectedIndex(next.length - 1);
  };

  const removeItem = (index: number) => {
    const next = draft.filter((_, itemIndex) => itemIndex !== index);
    setDraft(next);

    if (next.length === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex > index) {
      setSelectedIndex(selectedIndex - 1);
    } else if (selectedIndex === index) {
      setSelectedIndex(Math.min(index, next.length - 1));
    }
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const next = moveNavItem(draft, index, direction);
    if (next === draft) return;

    setDraft(next);

    if (selectedIndex === index) {
      setSelectedIndex(index + direction);
    } else if (selectedIndex === index + direction) {
      setSelectedIndex(index);
    }
  };

  const updateSelected = (nextItem: NavItem) => {
    setDraft(
      draft.map((item, itemIndex) =>
        itemIndex === selectedIndex
          ? { ...item, value: nextItem }
          : item,
      ),
    );
  };

  return (
    <div className="flex max-h-[90dvh] flex-col overflow-hidden sm:h-144 sm:flex-row">
      <aside className="flex max-h-64 w-full shrink-0 flex-col border-b bg-muted/40 sm:max-h-none sm:w-72 sm:border-b-0 sm:border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Menu items</h2>
          <span className="text-xs text-muted-foreground">
            {draft.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 border-b p-3">
          {NAV_ITEM_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="xs"
              variant="outline"
              onClick={() => addItem(type)}
            >
              <PlusIcon data-icon="inline-start" />
              {addLabel(type)}
            </Button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {draft.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">
              Add a link, column, card or call to action to build the menu.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {draft.map((item, index) => (
                <li
                  key={item.key}
                  className={
                    index === selectedIndex
                      ? "flex items-center gap-1 rounded-md bg-accent"
                      : "flex items-center gap-1 rounded-md hover:bg-accent/50"
                  }
                >
                  <button
                    type="button"
                    aria-current={index === selectedIndex ? "true" : undefined}
                    onClick={() => setSelectedIndex(index)}
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 py-1.5 text-left"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {NAV_ITEM_TYPE_LABELS[item.value.type]}
                    </span>
                    <span className="w-full truncate text-sm">
                      {item.value.label || "Untitled"}
                    </span>
                  </button>

                  <div className="flex shrink-0 items-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Move item up"
                      disabled={index === 0}
                      onClick={() => moveItem(index, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Move item down"
                      disabled={index === draft.length - 1}
                      onClick={() => moveItem(index, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Remove item"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2Icon />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="hidden items-center justify-between border-b px-6 py-4 sm:flex">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {selected ? selected.label || "Untitled" : "No item selected"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selected
                ? NAV_ITEM_TYPE_LABELS[selected.type]
                : EMPTY_SELECTION_COPY}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {selected ? (
            <MenuItemEditor item={selected} onChange={updateSelected} />
          ) : (
            <p className="text-sm text-muted-foreground">
              {EMPTY_SELECTION_COPY}
            </p>
          )}
        </div>

        <DialogFooter className="flex w-full flex-row justify-between gap-4 border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onSave(draft.map((item) => item.value))}
          >
            Save
          </Button>
        </DialogFooter>
      </section>
    </div>
  );
};
