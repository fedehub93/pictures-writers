# 05: Keyboard layout control and announcements

**What to build:** A keyboard user can change a widget's size and move it without a pointer, and layout changes are announced to assistive technology, so arranging is not mouse-only.

**Blocked by:** 03

**Status:** ready-for-human

- [x] In edit mode each widget exposes a keyboard-accessible layout control that can change its width and height and move it up or down.
- [x] The control steps through the widget's size presets as width/height stops and respects the definition's minimum and maximum bounds.
- [x] Activating a stop updates the layout exactly as a pointer move/resize would, and persists through auto-save.
- [x] Layout changes (move and resize) are announced through an `aria-live` region using the widget's effective title and its new position/size.
- [x] The control is reachable and operable by keyboard alone, with sensible focus order in edit mode.

## Comments

Delivered:

- `src/modules/dashboard/lib/keyboard-layout.ts` — new pure module. `widthStops`/`heightStops` derive the widget's size-preset seeds as ascending, de-duplicated stops clamped into the definition's resolved bounds; `resizeWidth`/`resizeHeight` apply a stop (width nudges the origin left so the span stays on the grid); `moveInstance` swaps origins with the neighbouring widget in the dashboard's reading order (row, then column) while each widget keeps its own size; `canMoveInstance` reports whether a neighbour exists in a direction; `applyLayoutAction` is the single entry point that resizes to a stop or moves, clamping to the definition's floor and ceiling. Unit-tested in `lib/__tests__/keyboard-layout.test.ts`.
- `src/modules/dashboard/lib/layout-announcement.ts` — new pure `describePlacement`/`layoutChangeAnnouncement` that name a widget's effective title and its one-based position and size for the live region. Unit-tested in `lib/__tests__/layout-announcement.test.ts`.
- `src/modules/dashboard/ui/components/widget-layout-menu.tsx` — new `WidgetLayoutMenu`, the generalization of the retired size menu (its `Small`/`Medium`/`Full` labels are kept as the width and height stops). A `Maximize2` ghost button opens a Radix dropdown — keyboard-openable and arrow-navigable — with a Width radio group, a Height radio group, and Move up / Move down items, each move disabled when there is no reading-order neighbour to swap with in that direction.
- `src/modules/dashboard/ui/components/widget-card.tsx` — mounts `WidgetLayoutMenu` in the header cluster only in edit mode, reading the definition's resolved bounds and the move availability; adds `onLayoutAction`, `canMoveUp`, and `canMoveDown` props.
- `src/modules/dashboard/ui/components/widget-grid.tsx` — applies a keyboard action to the instances, then runs the whole arrangement through `verticalCompactor.compact`, so the keyboard path commits and auto-saves exactly the layout a pointer move/resize would. `onLayoutChange` now takes the changed widget's key; `onDragStop`/`onResizeStop` supply it from their `newItem`.
- `src/modules/dashboard/ui/views/dashboard-view.tsx` — a visually hidden `aria-live="polite"` status region announces each layout change (keyboard or pointer) using the widget's effective title (`resolveWidgetTitle`) and its new placement; a sequence counter re-announces a repeat placement.

Verified: `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard` clean, full suite `npm run test:run` green (987 tests).

Notes:

- `react-grid-layout` offers no keyboard move/resize, so the menu swaps the widget with its reading-order neighbour rather than stepping a row: under vertical compaction a one-row step is a no-op. The swap is the pointer-free equivalent of dragging a widget past a neighbour.
- Touch behaviour (resize unavailable on a coarse pointer) remains in ticket 06; the manual acceptance of the keyboard control is covered by ticket 07.
