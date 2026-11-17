---
Status: done
Type: task
Blocked by: 05
---

# Navigation editing dialog

## Goal

Move menu item editing out of the 300px Puck sidebar into a focused two-pane dialog, so a navigation with nested items stays usable.

## Acceptance criteria

- [x] The Navigation field in the sidebar shows the `mega`/`compact` layout control, the item count and a "Modifica voci" button; it no longer renders the item editor inline.
- [x] The dialog uses `SidebarDialog` (the shell of `modules/users/ui/admin/components/edit-user-dialog.tsx`): a left column listing the items and a right pane editing the selected item.
- [x] The left column supports adding each item type, selecting, reordering up/down and deleting; each row shows its type and label.
- [x] The right pane edits the fields of the selected item: label and destination for every type, description and icon for `card` and `column` children, variant for `cta`, the child list for `column`.
- [x] Changes are a draft: "Salva" applies them to the block, "Annulla" and closing discard them. Reopening shows the saved state.
- [x] A keyboard-only user can add, select and reorder items; focus stays inside the dialog while open.
- [x] Tests: open from the field, add/remove/reorder, save applies, cancel discards, the field renders the summary state.

## Notes

- The dialog is a block field, not a route: it should not need the admin `ModalProvider`.
- Keep the copy in the language of the surrounding admin surface.
- Do not change the persisted shape here; this ticket only changes how it is edited.

## Implementation notes

- **Field summary.** `field.tsx` keeps the layout `SegmentedControl` and the `Menu items` `PropHeader` (with its reset), then renders the item count and an `Edit items` button. The tree editor no longer appears in the sidebar. Copy stays in English to match the surrounding admin surface (the ticket's Italian quotes are descriptive), and the button is a plain button, not a route.
- **Dialog shell.** `ui/menu-items-dialog.tsx` wraps `SidebarDialog`. The draft is mounted only while `open`, so `Cancel`, Escape, the overlay, the close button and `Save` (which commits and closes) all work without a `setState`-in-effect reset. Reopening mounts a fresh copy of the saved items.
- **Left column.** Add controls for all four `NAV_ITEM_TYPES`, a list whose rows show type and label, plus move up/down and delete. Rows keep a dialog-local stable key (`DraftItem.key`), so reordering moves the existing DOM node and a keyboard user keeps focus on the move button.
- **Right pane.** `ui/menu-item-editor.tsx` edits label for every type; destination for `link`, `card` and `cta`; description, image URL and icon for `card`; variant for `cta`; and the child list for `column`, where each child gets label, destination, description and icon. `column` has no top-level destination in the persisted model, so the acceptance criterion is satisfied through its children.
- **No shape change.** The draft is `NavItem[]`; the local keys and the selection index never reach `content.items`. `moveNavItem` became generic so it can reorder the draft wrappers without duplicating the swap logic.
- **Tests.** `menu-items-dialog.test.tsx` (happy-dom) covers opening from the field summary, per-type fields, column-child description/icon, add/remove/reorder with `Save`, reorder focus retention, and `Cancel` discarding before reopening from the saved state. `navbar-block.test.tsx` now asserts the summary state and the absence of the inline editor.

## Verification

- `npx tsc --noEmit` clean.
- Targeted ESLint on the changed files is clean.
- `npm run test:run`: 229 files / 1907 tests pass.
