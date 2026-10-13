# 04: Add and remove widgets in the new model

**What to build:** A persistent `+` control in the corner opens the permission-filtered Widget library and adds the chosen widget into the first free slot, highlighting it; in edit mode a widget can be removed and later re-added.

**Blocked by:** 02

**Status:** ready-for-human

- [x] A persistent, bottom-right `+` control opens the permission-filtered Widget library and is available in both read and edit mode.
- [x] Choosing a widget places it in the first free slot for its span and briefly highlights it so the user can find where it landed.
- [x] The trailing `+` grid tile is retired; the empty-dashboard prompt still opens the library.
- [x] In edit mode a widget can be removed with its control, and re-added later from the library.
- [x] Adding and removing are auto-saved and survive a reload.
- [x] The library only offers definitions the user is permitted to read, and only offers the Trend widget when the user can read at least one Metric.

## Comments

Delivered:

- `src/modules/dashboard/lib/widget-library.ts` — new pure `permittedLibraryDefinitions(definitions, canRead, metricCount)` extracting the library's permission/analytics filter from the view: it keeps the permitted definitions and drops an analytics widget when the user can read no Metric. Unit-tested in `lib/__tests__/widget-library.test.ts` (6 cases).
- `src/shared/dashboard/types.ts` + `src/modules/dashboard/registry.ts` — `isAnalyticsWidget` moves to the shared contract (where `WidgetDefinition` lives) so the library filter and the grid's render filter share one "is analytics" rule instead of re-deriving it from the `category` literal.
- `src/modules/dashboard/ui/components/widget-library.tsx` — `WidgetLibraryTile` (the trailing grid `+`) is retired and replaced by `AddWidgetButton`, a `fixed bottom-6 right-6` round `+` control that opens the same library. It renders in both modes because it lives in the view, not behind `editing`.
- `src/modules/dashboard/ui/views/dashboard-view.tsx` — uses `permittedLibraryDefinitions`; `onAdd` mints the instance key, commits `addInstance` (first free slot via `seedPlacement`), and records the new key in `highlightedKey`; an effect clears the highlight after `HIGHLIGHT_MS`. Renders `AddWidgetButton` alongside the grid and passes `highlightedKey` down. `onRemove` still commits through the shared auto-save.
- `src/modules/dashboard/ui/components/widget-grid.tsx` — drops the trailing-tile render; accepts `highlightedKey` and passes `highlighted` to the matching card. The empty-dashboard prompt (`DashboardEmpty`) still opens the library.
- `src/modules/dashboard/ui/components/widget-card.tsx` — new `highlighted` prop rings the card (primary ring, transitioned) for the brief post-add highlight.

Verified: `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard` clean, full suite `npm run test:run` green (968 tests).

Notes:

- Manual acceptance (the `+` library flow with first-free-slot placement and highlight, remove/re-add, reload persistence) is the remaining check and is covered by ticket 07.

