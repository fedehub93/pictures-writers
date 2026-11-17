# 05: The footer's links are edited in a dialog

**What to build:** Link list and Copyright open a dialog for their links, with the
same chrome as the navigation dialog: two panes, a local draft, Save, and Cancel,
Escape and the overlay all discarding. Inside it the author adds, removes,
reorders and edits the flat list of Smart links those blocks hold; reordering
keeps the selection and does not remount the focused control. The properties
panel keeps a section header, its reset and a summary of the list, and no link
controls. The inline editor is deleted.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The dialog opens from the panel with the saved links as its draft, lists
      them by label and type, and edits the selected one on the right.
- [x] Add, remove and reorder live in the dialog; reordering keeps the selection
      and does not remount the control holding the focus.
- [x] Cancel, Escape, the overlay and the close button discard every change of
      the session; Save commits the whole list as one update.
- [x] An empty list opens on an empty state with Add available, and the panel's
      summary reads zero.
- [x] The panel shows the section header, the reset and a count of the links, and
      nothing else.
- [x] Both footer blocks use the dialog and the inline editor no longer exists.
- [x] The dialog is covered by tests: draft discarded on cancel, committed on
      save, selection kept across a reorder, empty state.
- [x] The item model stays flat: no columns, cards or calls to action.
- [x] Typecheck, lint and the full test suite pass.

## Comments

**2026-11-16 — 17b42155**

`LinksSection` (`src/puck/fields/link/ui/links-section.tsx`) is now the panel's
whole surface for the list: the shared `PropHeader` and its reset, a count
("2 links", "0 links") and the entry point. `LinksDialog`
(`src/puck/fields/link/ui/links-dialog.tsx`) is the two-pane editor. It copies
the navigation dialog's chrome — `SidebarDialog`, the list beside the detail
pane, the `DialogFooter` with Cancel and Save — and not its model: the draft is
the flat `LinkListItem[]`, so there are no columns, cards or calls to action.

The draft lives inside the component that only mounts while the dialog is open,
so every way of closing drops it: Cancel, the close button, Escape and a click
on the overlay all reach `onOpenChange(false)` from the shared shell, and Save
calls `onSave` once with the whole array. Each draft row carries a stable key,
and the selection is that key rather than an index, so a reorder moves the
mounted row, the focus stays on the same button and the right pane keeps
editing the same link without index arithmetic. The edge controls are inert
(`aria-disabled` plus a no-op move) rather than `disabled`: disabling the
button that holds the focus drops a keyboard user to the body, and the second
move would need a hunt.

The type names moved beside the type list: `SMART_LINK_TYPE_LABELS` in
`src/puck/fields/link/types.ts` is now the one source the picker in `LinkView`
and the dialog's rows and detail header both read, so a type is named once.
`src/puck/fields/link/lib/links.ts` keeps `createLinkListItem` (each new row
gets its own link object) and `getLinkListItemLabel` (legacy `{ label, href }`
rows read through the same normalizer the dialog uses). `links-editor.tsx` is
deleted, and with it the three pure row operations it alone called: the dialog
owns the draft, and the add, remove, reorder and update behaviour is now
asserted through the UI instead of through helpers no production path ran.

`src/puck/__tests__/links-dialog.test.tsx` drives both content fields through
their props with the real `LinkView` (only the tRPC hook is stubbed): opening
from the panel with the saved links, rows read by label and type, one editor for
the selection rather than one per row, a typed edit and an added row held in the
draft until Save commits the array once, a removal, a reorder that keeps the
selection, the focus and the edge control's `aria-disabled`, Cancel, the close
button and the Escape key and the overlay each discarding the draft, the empty
list reading "0 links" on an empty state with Add available, and a legacy stored
row reading `/legacy/`. The deleted `links-editor.test.tsx` also asserted unique
control ids across rows, which no longer applies.

Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
pre-existing warnings); `npm run test:run` 268 files, 2382 tests passed. No
browser probe ran: the change is panel editing, and the diff adds no markup to
any page — the footer render paths and their suites are untouched.
