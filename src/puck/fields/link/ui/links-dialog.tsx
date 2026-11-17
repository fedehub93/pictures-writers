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

import {
  createLinkListItem,
  getLinkListItemLabel,
  EMPTY_LINK,
} from "../lib/links";
import {
  SMART_LINK_TYPE_LABELS,
  normalizeLinkProps,
  getSmartLinkType,
  type LinkListItem,
  type LinkProps,
} from "../types";
import { LinkView } from "./view/link-view";

const EMPTY_SELECTION_COPY = "Choose a link from the list or add a new one.";

/**
 * A draft entry carries a stable key.
 *
 * Reordering must not remount the focused button, otherwise a keyboard user
 * would lose focus mid-move. The key is local to the dialog and never saved.
 */
type DraftLink = {
  key: string;
  value: LinkListItem;
};

let draftKey = 0;

function createDraftLink(value: LinkListItem): DraftLink {
  draftKey += 1;
  return { key: `link-item-${draftKey}`, value };
}

function toLinkProps(item: LinkListItem | undefined): LinkProps {
  return normalizeLinkProps(item?.link) ?? EMPTY_LINK;
}

/** What a row and the detail header both show before the link is opened. */
function describeLink(item: LinkListItem) {
  return {
    label: getLinkListItemLabel(item),
    type: SMART_LINK_TYPE_LABELS[getSmartLinkType(toLinkProps(item))],
  };
}

function moveDraft(
  items: DraftLink[],
  index: number,
  direction: -1 | 1,
): DraftLink[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  const current = next[index];
  const swap = next[target];
  if (!current || !swap) return items;

  next[index] = swap;
  next[target] = current;
  return next;
}

interface LinksDialogProps {
  open: boolean;
  links: LinkListItem[];
  onOpenChange: (open: boolean) => void;
  onSave: (links: LinkListItem[]) => void;
}

/**
 * Two-pane editor for a flat list of Smart links.
 *
 * The draft lives here, not in the block: "Save" commits it to the Puck field,
 * while "Cancel", Escape, the overlay and the close button all discard it. The
 * next opening copies the saved links again, so the dialog always starts from
 * what the document actually contains.
 *
 * It shares the navigation dialog's chrome, not its model: the footer blocks
 * hold an ordered list of links with no columns, cards or calls to action.
 */
export const LinksDialog = ({
  open,
  links,
  onOpenChange,
  onSave,
}: LinksDialogProps) => (
  <SidebarDialog
    open={open}
    onOpenChange={onOpenChange}
    title="Links"
    description="Edit the links."
  >
    {open ? (
      <LinksDraft
        links={links}
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
 * Mounting is the discard: it exists only while the dialog is open, so every
 * opening copies the saved links and every way of closing drops the draft.
 * The selection is a key, not an index, so a reorder carries it along without
 * arithmetic on either side.
 */
const LinksDraft = ({
  links,
  onCancel,
  onSave,
}: {
  links: LinkListItem[];
  onCancel: () => void;
  onSave: (links: LinkListItem[]) => void;
}) => {
  const [draft, setDraft] = useState<DraftLink[]>(() =>
    links.map(createDraftLink),
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(
    () => draft[0]?.key ?? null,
  );

  const selected = draft.find((item) => item.key === selectedKey);

  const addLink = () => {
    const added = createDraftLink(createLinkListItem());
    setDraft([...draft, added]);
    setSelectedKey(added.key);
  };

  const removeLink = (index: number) => {
    const removed = draft[index];
    const next = draft.filter((_, itemIndex) => itemIndex !== index);

    setDraft(next);

    if (removed?.key === selectedKey) {
      setSelectedKey(next[Math.min(index, next.length - 1)]?.key ?? null);
    }
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    setDraft(moveDraft(draft, index, direction));
  };

  const updateSelected = (link: LinkProps) => {
    setDraft(
      draft.map((item) =>
        item.key === selectedKey ? { ...item, value: { link } } : item,
      ),
    );
  };

  return (
    <div className="flex max-h-[90dvh] flex-col overflow-hidden sm:h-144 sm:flex-row">
      <aside className="flex max-h-64 w-full shrink-0 flex-col border-b bg-muted/40 sm:max-h-none sm:w-72 sm:border-b-0 sm:border-r">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">Links</h2>
          <span className="text-xs text-muted-foreground">
            {draft.length}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 border-b p-3">
          <Button type="button" size="xs" variant="outline" onClick={addLink}>
            <PlusIcon data-icon="inline-start" />
            Add link
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {draft.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">
              Add a link to build the list.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {draft.map((item, index) => {
                const isSelected = item.key === selectedKey;
                const { label, type } = describeLink(item.value);

                return (
                  <li
                    key={item.key}
                    className={
                      isSelected
                        ? "flex items-center gap-1 rounded-md bg-accent"
                        : "flex items-center gap-1 rounded-md hover:bg-accent/50"
                    }
                  >
                    <button
                      type="button"
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() => setSelectedKey(item.key)}
                      className="flex min-w-0 flex-1 flex-col items-start gap-0.5 px-2 py-1.5 text-left"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {type}
                      </span>
                      <span className="w-full truncate text-sm">{label}</span>
                    </button>

                    <div className="flex shrink-0 items-center">
                      {/*
                        An edge control is inert, not disabled: disabling the
                        button that holds the focus drops a keyboard user to the
                        body, and the next move then needs a hunt.
                      */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Move link up"
                        aria-disabled={index === 0}
                        className="aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                        onClick={() => moveLink(index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Move link down"
                        aria-disabled={index === draft.length - 1}
                        className="aria-disabled:opacity-50 aria-disabled:pointer-events-none"
                        onClick={() => moveLink(index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Remove link"
                        onClick={() => removeLink(index)}
                      >
                        <Trash2Icon />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="hidden items-center justify-between border-b px-6 py-4 sm:flex">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight">
              {selected
                ? describeLink(selected.value).label
                : "No link selected"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selected
                ? describeLink(selected.value).type
                : EMPTY_SELECTION_COPY}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {selected ? (
            <LinkView
              idPrefix="dialog-link-"
              state={toLinkProps(selected.value)}
              onUpdate={updateSelected}
            />
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
