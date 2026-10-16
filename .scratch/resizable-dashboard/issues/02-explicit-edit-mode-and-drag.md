# 02: Explicit edit mode with drag-to-move

**What to build:** A backoffice user enters an explicit edit mode from a single low-key control in the dashboard header, sees the grid, and drags widgets to new cells; leaving the mode returns the dashboard to a clean read surface. Moves are auto-saved. Renaming a widget and opening its config stay available outside edit mode.

**Blocked by:** 01

**Status:** ready-for-human

- [x] A ghost Modifica/Fine control in the dashboard header toggles edit mode; it shows a pencil glyph and turns primary as "Fine" while editing.
- [x] Outside edit mode the dashboard has no spatial controls and no visible grid; widget bodies stay fully interactive.
- [x] Inside edit mode the grid is visible and widgets can be dragged to new cells; movement snaps to cells and compacts upward.
- [x] A move is persisted with the existing auto-save debounce and the saving/saved indicator; there is no Save/Cancel.
- [x] Renaming a widget's title and opening its config gear work in both modes.
- [x] Reloading the page shows the arrangement the user last moved.

## Comments

Delivered:

- `src/modules/dashboard/lib/edit-layout.ts` — new pure `applyGridLayout(instances, items)` that reads a drag's reported arrangement back into the instances: every instance on the grid takes its item's placement, an instance the grid does not hold keeps its stored placement, and an unmoved instance keeps its identity. New `GridPlacementItem` (extends `WidgetGridPlacement` with the grid's `i`). Unit-tested in `lib/__tests__/edit-layout.test.ts` (5 cases).
- `src/modules/dashboard/ui/views/dashboard-view.tsx` — holds the `editing` presentation flag; a header ghost/`Modifica` button (pencil glyph) flips to primary/`Fine` while editing. `onMove` commits `applyGridLayout` through the existing auto-save hook, so a move persists with the debounce and the shared save indicator and there is no Save/Cancel.
- `src/modules/dashboard/ui/components/widget-grid.tsx` — drag is enabled only in edit mode, scoped to the per-card `widget-drag-handle` selector; `onDragStop` reports the compacted layout to `onMove`. The twelve-column cell grid is drawn (inline background, `--color-border`) only in edit mode. `onRemove` is passed only in edit mode.
- `src/modules/dashboard/ui/components/widget-card.tsx` — mounts the grip drag handle only when `editing`; rename and the config gear stay mounted in both modes.
- Verified: `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard` clean, full suite `npm run test:run` green (961 tests).
- Manual acceptance (drag/snap/compact, edit entry/exit, reload) is covered by ticket 07.

Notes:

- The remove control is gated to edit mode here because the parent spec lists it among the gated spatial controls; the `+` library flow and retiring the trailing `+` tile remain in ticket 04.
- A drag on mobile uses the same handle but reordering below `md` is completed in ticket 06.
