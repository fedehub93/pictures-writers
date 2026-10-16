# 03: In-place edit mode (reorder, hide, library, save)

**What to build:** A user can enter an edit mode and tailor their dashboard: reorder widgets by dragging, hide widgets, and add widgets from a permission-filtered library. Changes are persisted explicitly with Salva, or discarded with Annulla.

**Blocked by:** 01

**Status:** resolved

- [x] A Modifica/Fine toggle enters and leaves edit mode.
- [x] Widgets can be reordered by dragging with `@dnd-kit/react`; the order persists per user.
- [x] Each card can be hidden with an X; hidden instances remain re-addable from the library.
- [x] A `+` tile opens a permission-filtered widget library; selecting an entry adds an instance.
- [x] Widgets keep rendering real data, but their interactions are disabled while editing.
- [x] Salva persists the layout for the current user; Annulla discards the changes.
- [x] Saving requires `dashboard.read` and affects only the current user's layout.
- [x] After save, the computed layout reflects the user's order and hidden set.

## Comments

Delivered:

- `src/modules/dashboard/lib/edit-layout.ts` — pure draft-edit helpers: `hideInstance`, `addInstance` (re-shows the first hidden instance of a definition, otherwise appends a new one), `moveInstance` (reorders visible instances across the slots they occupy, leaving hidden instances at their absolute position), and `createInstanceKey`.
- `src/modules/dashboard/ui/views/dashboard-view.tsx` — holds the edit state: a `draft` (pending changes) plus an `editing` chrome flag. `Modifica` / `Fine` toggles the chrome (Fine keeps the draft and shows a "Modifiche non salvate" hint); `Salva` persists via `dashboard.saveLayout` and seeds the query cache with the returned widgets; `Annulla` discards the draft. The rendered instances fall back to the computed server layout whenever not editing.
- `src/modules/dashboard/ui/components/widget-grid.tsx` — the responsive grid, wrapped in `DragDropProvider` only while editing; handles the sortable `onDragEnd` and renders the static cells otherwise. The `+` tile is appended at the end of the grid while editing.
- `src/modules/dashboard/ui/components/sortable-widget.tsx` — a `useSortable` cell (group `dashboard`) with a drag handle; only mounted while editing so the sortable hooks never run outside edit mode.
- `src/modules/dashboard/ui/components/widget-library.tsx` — the `+` tile and a `Dialog` library listing the permitted definitions; picking one adds an instance.
- `src/modules/dashboard/ui/components/widget-card.tsx` — edit-mode chrome (drag handle + X to hide) and the body wrapped in `inert` while editing, so widgets keep rendering real data with their interactions disabled.
- `src/modules/dashboard/ui/components/widget-slot.tsx` — the shared `Suspense`/`ErrorBoundary`/`WidgetCard` wrapper used by both the static and sortable cells.
- Persistence needs no procedure change: `dashboard.saveLayout` already requires `dashboard.read` (via `getProcedurePermissions`) and writes only the current user's `DashboardLayout`.
- Coverage: `lib/__tests__/edit-layout.test.ts` (10) for the draft helpers; `server/__tests__/procedures.test.ts` gains a round-trip test proving the computed layout reflects saved order, a new default, and the hidden set.
- Verified: full suite (861 tests) green, `npx tsc --noEmit` clean, scoped eslint clean, `npm run build` green.

Notes:

- "Fine" keeps the pending draft so the user can step out of the chrome without losing work; an idle "Modifiche non salvate" hint makes that explicit. "Annulla" is the discard path the checklist calls for.
