# 06: Responsive collapse and touch behaviour

**What to build:** On a narrow screen the dashboard becomes a single readable column, and on a touch device resizing is unavailable while reordering still works in edit mode.

**Blocked by:** 03

**Status:** ready-for-human

- [x] Below the `md` breakpoint the arrangement collapses to a single column ordered by row then column, with no horizontal scroll.
- [x] The desktop arrangement is not modified by the collapse; returning to a wide viewport shows the saved arrangement.
- [x] On a coarse pointer (touch) resize handles are unavailable and resizing cannot be triggered.
- [x] Reordering by drag remains available on touch in edit mode.
- [x] The `+` library flow and the keyboard layout control still work at the single-column width.

## Comments

Delivered:

- `src/shared/hooks/use-coarse-pointer.ts` — new `useIsCoarsePointer` reading `(pointer: coarse)` through `useSyncExternalStore`, so the server snapshot (and first client render) is `false` and the value resolves on the client without a hydration mismatch or a set-state-in-effect. It sits beside the existing `useIsMobile` hook in `src/shared/hooks`.
- `src/modules/dashboard/ui/components/widget-grid.tsx` — `resizeConfig` is now `{ enabled: editing && !isCoarsePointer }`, so on a touch device the corner handle is not rendered and a resize cannot be started; `dragConfig` stays `{ enabled: editing }`, so reordering by the drag handle remains available wherever the grid renders. The card now gets `showDragHandle={editing && !isMobile}` (below `md` the collapsed list has no grid to drag within). The collapse itself is untouched: it is a render-only ordering by `sortForSingleColumn` (row then column) over the same instances, so shrinking the viewport never commits and widening it shows the saved arrangement, and because the collapsed view stacks full-width cards with no per-column minimum width it cannot introduce horizontal scroll. Because `onLayoutAction` is still passed in edit mode, the keyboard layout menu keeps working at single-column width.
- `src/modules/dashboard/ui/components/widget-card.tsx` — the `editing` prop is replaced by `showDragHandle`, which mounts only the grip handle; the keyboard layout menu now mounts whenever `onLayoutAction` is present (the parent passes it only in edit mode), so it is no longer tied to the handle's presence.

Decisions:

- Per the answered clarification, drag-to-reorder is a **coarse-pointer** concern, not a narrow-width one. The single column below `md` is a read-only rendering of the canonical arrangement (no per-breakpoint layout is stored), so the grip is not mounted there; on touch devices wide enough to render the grid drag still works.

Verified: `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard src/shared/hooks/use-coarse-pointer.ts` clean, full suite `npm run test:run` green (990 tests).

Notes:

- Manual acceptance (single-column collapse with no horizontal scroll, touch resize unavailable, drag on a wide touch device, `+` and keyboard control at single-column width) is covered by ticket 07.
