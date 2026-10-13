# 03: Resize with bounds and persistence

**What to build:** In edit mode a backoffice user resizes a widget by its corner, snapping to cells and staying between the widget's minimum and maximum bounds, and the new size is auto-saved.

**Blocked by:** 02

**Status:** ready-for-human

- [x] In edit mode a widget shows a resize handle at its corner; dragging it resizes the widget along the grid.
- [x] Resizing snaps to cells and respects the definition's minimum and maximum placement; a widget can never be resized below its legibility floor or above its maximum.
- [x] A widget with no explicit maximum can grow to the full grid width.
- [x] The resized placement is persisted by the existing auto-save and survives a reload.
- [x] Resizing does not distort neighbouring widgets; they compact around the changed span without leaving a vertical hole.

## Comments

Delivered:

- `src/modules/dashboard/ui/components/widget-grid.tsx` — `resizeConfig` is now `{ enabled: editing }`, so the default south-east (`se`) corner handle is live only in edit mode; it is styled by the `react-grid-layout`/`react-resizable` stylesheets the admin layout already imports. `onResizeStop` reports the compacted arrangement through the same commit path as `onDragStop` (both wired directly to the renamed `onLayoutChange` prop).
- Bounds were already on each grid item: `toGridItems` attaches the definition's resolved `minW`/`minH`/`maxW`/`maxH`, so `react-grid-layout`'s `minMaxSize` constraint holds the legibility floor and ceiling, and a definition with no `maxGrid` resolves `maxW` to the full twelve-column grid. Vertical compaction is the existing `verticalCompactor`, so neighbours float up with no vertical hole.
- `src/modules/dashboard/ui/views/dashboard-view.tsx` — the layout callback is renamed `onLayoutChange` and documented as the single entry for a completed move or resize; it still auto-saves through `commit(applyGridLayout(...))`.
- `src/modules/dashboard/lib/__tests__/edit-layout.test.ts` — new case reads a resize plus the compaction it triggers back into the instances.

Verified: `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard` clean, full suite `npm run test:run` green (962 tests).

Notes:

- Pointer-only resize is built here; making it unavailable on a coarse pointer is ticket 06.
- Manual acceptance (drag-resize a corner, snap, floor/ceiling, compaction, reload) is covered by ticket 07.
