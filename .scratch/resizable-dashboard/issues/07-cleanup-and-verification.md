# 07: Cleanup and verification

**What to build:** The old one-dimensional grid model is fully removed and the feature is verified end to end: no dead code or unused utilities remain, the touched tests are updated, and the pipeline is green.

**Blocked by:** 03, 04, 05, 06

**Status:** ready-for-human

- [x] The row-packing helper and its test are deleted, along with the fixed column-span utilities and helpers the new model replaced.
- [x] The size menu is gone, replaced by the keyboard layout control, and no import references the old grid utilities.
- [x] No dead code remains from the discrete-size model or the legacy hidden branch.
- [x] The dashboard module's tests (pure helpers, layout filter, procedures, registry) reflect the positioned model and pass.
- [x] `npm run lint`, `tsc --noEmit`, `npm run test:run`, and `npm run build` are all green.
- [ ] Manual acceptance confirms drag, resize, compaction, edit-mode entry/exit, add/remove, single-column collapse, touch behaviour, and the keyboard layout control.

## Comments

Delivered:

- Confirmed the old one-dimensional model is fully gone: `lib/widget-rows.ts` (+ its test), `lib/widget-size.ts` (the fixed column-span utilities), `ui/components/sortable-widget.tsx`, and `ui/components/widget-size-menu.tsx` are all deleted, and no source references `widget-rows`, `widget-size`, `sortable-widget`, `columnSpan`/`sizeToSpan`, or a legacy `hidden` branch. The `widget-size-menu` labels live on as the keyboard layout menu's width/height stops (`widget-layout-menu.tsx`).
- Removed the empty leftover `src/modules/dashboard/ui/components/__tests__/` directory (its `widget-states.test.tsx` had already moved to `src/shared/dashboard/ui/__tests__/`).
- Cleaned the last stale reference to the discrete-size model: the `WIDGET_SIZES` doc comment in `src/shared/dashboard/types.ts` no longer claims the deleted size menu and the persistence schema derive from it — only the `WidgetSize` type and the keyboard resize stops do.
- `src/modules/dashboard/lib/keyboard-layout.ts` — the `stopsFor` axis clamp now reuses the imported `clamp` helper instead of re-inlining `Math.min(Math.max(...))`; behaviour unchanged.
- Touched tests: `grid-layout`, `edit-layout`, `keyboard-layout`, `layout-announcement`, `widget-library`, `config`, `metric-selection`, `widget-title` (pure helpers), `server/layout` (positioned filter), `server/procedures` (`saveLayout` round-trips a placement), `__tests__/registry` (every definition resolves a valid size preset + bounds), plus the shared `config`/`widget-states` tests. All assert the positioned model (`grid: { x, y, w, h }`) and pass.

Verified: `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard src/shared/dashboard` clean, full suite `npm run test:run` green (990 tests, 124 files), `npm run build` compiled successfully. The repo-wide `npm run lint` still reports 48 errors, but every one is in a file untouched by this feature (they predate the merge-base with `master`); the dashboard and shared-dashboard files lint clean.

Remaining: the manual acceptance checklist item above is the one check no unit test reaches — it needs a human at a browser (drag, resize, compaction, edit-mode entry/exit, add/remove, single-column collapse, touch behaviour, keyboard layout control).
