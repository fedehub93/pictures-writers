---
Status: ready-for-human
Type: task
---

# Editor root entry points

## Goal

Make the Editor root reachable from the editor chrome — a fixed header above the properties panel — so an author does not depend on the padding strip outside Puck's root drop zone, and always knows which document the fields belong to.

## Acceptance criteria

- [x] Above `<Puck.Fields />` the panel shows `${rootLabel} settings` as a heading while the root is active, and `Page › Heading` while a block is selected, where the document part is a button that deselects the current block.
- [x] Clicking the document part while the root is already active is a no-op.
- [x] The selected block label comes from the block config's `label`; a block without one falls back to its component key.
- [x] The deselect is Puck's own `setUi: { itemSelector: null }` with `recordHistory: false`; no new selection state is introduced and undo/redo history is not polluted by a deselection.
- [x] The label comes from a `rootLabel` prop on `PuckEditor` (default `"Page"`), forwarded to the panel header; the region editors pass `SITE_REGION_LABELS[region.key]`.
- [ ] The affordance works in all three editors (Page, Header, Footer) and in interactive preview mode, where it stays visible and active.
- [ ] Entering interactive preview, selecting a block, saving, publishing and the existing viewport/zoom controls behave exactly as before.
- [x] The Outline tab and the canvas are left untouched: no root row, overlay, ring or action bar is added.
- [x] Tests: the pure helpers and the presentational component are covered; `npx tsc --noEmit`, targeted ESLint, `npm run test:run` and `npm run build` pass.
- [ ] Manual check: on an empty page, with a block selected in a nested Container, and in a Header/Footer editor, the root fields are reachable in one click from the header.

## Implementation notes

- **Pure helpers.** `src/puck/editor/lib/editor-root-entry.ts`:
  - `isEditorRootActive(itemSelector: ItemSelector | null | undefined): boolean` → `itemSelector == null`.
  - `editorRootSettingsLabel(rootLabel: string): string` → `` `${rootLabel} settings` ``.
  - `getSelectedBlockLabel(config: Config, type: string | undefined): string | null` → `config.components[type]?.label ?? type`, `null` when `type` is missing.
  - `getEditorRootBreadcrumb({ rootLabel, selectedLabel })` → the document part plus the optional selected label, so the component and the tests share one composition.
- **Presentational component.** `src/puck/editor/ui/components/editor-root-entry.tsx`, props `{ rootLabel, selectedLabel, isActive, onSelectRoot }`. Small `h2` with the settings label when active; otherwise the document `button`, a `›` separator and the selected label as text with `aria-current`.
- **Wiring.** `src/puck/editor/ui/view/editor.tsx`: render the header at the top of the right column, outside `<Puck.Fields />` and outside the scrolling area, so it does not scroll away. Read `appState.ui.itemSelector`, `selectedItem`, `config` and `dispatch` through the `use-editor-root-entry.ts` hook, which also owns the deselect guard.
- **Shell prop.** `PuckEditorProps` (`src/puck/editor-shell.tsx`) gains `rootLabel?: string` defaulting to `"Page"`, passed to `Editor` (`src/puck/editor/ui/view/editor.tsx`) and then to the panel header. Do not derive it from `header.title`.
- **Region editor.** `src/modules/site-regions/ui/views/site-region-editor-view.tsx` passes `rootLabel={SITE_REGION_LABELS[region.key]}`. `PageBuilderView` passes nothing.
- **Dispatch.** Reuse Puck's action exactly as the canvas deselect does: `dispatch({ type: "setUi", ui: { itemSelector: null }, recordHistory: false })`. Do not add a store, a Zustand slice or a context.
- **Why the header is not a `fields` override.** The override is coupled to Puck's field internals (`items`, `fields`, `isLoading`, tabs in 0.24) and disappears as a seam on upgrade; the fixed header in the shell is a plain element and stays put across versions.
- **Outline left alone.** An earlier revision also added a pinned root row above `<Puck.Outline />`. The maintainer dropped it after seeing the result: the breadcrumb header is enough, and the outline stays exactly Puck's own.

## Verification

- Tests in `src/puck/__tests__/editor-root-entry.test.tsx` (`// @vitest-environment happy-dom` for the component, following `navbar-appearance.test.tsx`): active/inactive detection, settings label composition, block-label fallback, breadcrumb composition, rendered header content, `aria-current`, and click → `onSelectRoot`.
- `npx tsc --noEmit`, targeted ESLint on the touched files, `npm run test:run`, `npm run build`.
- Manual: empty page; block selected inside a nested Container; page with the Site layout preview on and off; Header and Footer editors; interactive preview on.

## Out of scope

- The Esc shortcut, the full ancestor chain in the breadcrumb, any root row inside Puck's outline tree, and any canvas highlight for the root.
- Any change to the root fields, the saved document shape, the public render, the palettes or the Outline tab.
- The 0.24 upgrade itself (ticket 01).

## Comments

- 2026-11-10 — Implemented in `feat(puck): add editor root entry points`. Helpers live in `src/puck/editor/lib/editor-root-entry.ts`, the presentational `EditorRootEntry` in `src/puck/editor/ui/components/editor-root-entry.tsx`, and the Puck wiring in `use-editor-root-entry.ts`. The hook dispatches `{ type: "setUi", ui: { itemSelector: null }, recordHistory: false }` and returns early while the root is already active. `PuckEditor` gained optional `rootLabel` (default `"Page"`); the region editor passes `SITE_REGION_LABELS[region.key]`. The panel header sits outside the fields scrolling area.
- 2026-11-10 — Verification: `npx tsc --noEmit` clean; targeted ESLint on all touched files clean; `npm run test:run` 243 files / 1993 tests pass; `npm run build` succeeds. Repo-wide `npm run lint` still reports the same 40 pre-existing errors recorded in ticket 01, none in a file this change touches.
- 2026-11-10 — Code review (Standards + Spec) run over the diff. Applied: added the `"use client"` / `client-only` boundary to the new hook, dropped the unused `rootLabel` pass-through from the hook, and removed the dead many-segment generality from the panel breadcrumb render. Kept deliberately: the `rootLabel` prop name (the ticket mandates it and CONTEXT.md defines "Editor root" as the domain term) and the Puck-wrapping helper one-liners.
- 2026-11-10 — Maintainer feedback after the first implementation: the root row above the Outline reads badly, so it was removed. Only the breadcrumb/settings header above the properties panel remains; `ElementsPanel` is back to its previous shape and the outline tab is untouched. The component lost its `row`/`header` variant and the outline-specific tests were dropped. Re-verified with `tsc`, targeted ESLint, `test:run` and `build` after the change.
- Status moved to `ready-for-human` for the browser smoke test (empty page, block nested in a Container, Site layout preview on/off, Header and Footer editors, interactive preview). The remaining boxes are that smoke test and the "behaves exactly as before" checks.
