---
Status: ready-for-agent
Type: task
---

# Editor root entry points

## Goal

Make the Editor root reachable from the editor chrome — a pinned document row in the outline and a fixed header above the properties panel — so an author does not depend on the padding strip outside Puck's root drop zone, and always knows which document the fields belong to.

## Acceptance criteria

- [ ] The Outline tab shows a pinned row above `<Puck.Outline />`, always visible even when the document has no blocks, labelled with the document name ("Page", "Header", "Footer") and marked current while the root is active.
- [ ] Clicking that row deselects the current block and the properties panel shows the root fields; clicking it while already active is a no-op.
- [ ] Above `<Puck.Fields />` the panel shows `${rootLabel} settings` as a heading while the root is active, and `Page › Heading` while a block is selected, where the document part is a button that performs the same deselect.
- [ ] The selected block label comes from the block config's `label`; a block without one falls back to its component key.
- [ ] The deselect is Puck's own `setUi: { itemSelector: null }` with `recordHistory: false`; no new selection state is introduced and undo/redo history is not polluted by a deselection.
- [ ] The label comes from a `rootLabel` prop on `PuckEditor` (default `"Page"`), forwarded to the sidebar and the panel header; the region editors pass `SITE_REGION_LABELS[region.key]`.
- [ ] Both affordances work in all three editors (Page, Header, Footer) and in interactive preview mode, where they stay visible and active.
- [ ] Entering interactive preview, selecting a block, saving, publishing and the existing viewport/zoom controls behave exactly as before.
- [ ] No canvas overlay, ring or action bar is added for the root.
- [ ] Tests: the pure helpers and the presentational component are covered; `npx tsc --noEmit`, targeted ESLint, `npm run test:run` and `npm run build` pass.
- [ ] Manual check: on an empty page, with a block selected in a nested Container, and in a Header/Footer editor, the root fields are reachable in one click from both entry points.

## Implementation notes

- **Pure helpers.** `src/puck/editor/lib/editor-root-entry.ts`:
  - `isEditorRootActive(itemSelector: ItemSelector | null | undefined): boolean` → `itemSelector == null`.
  - `editorRootSettingsLabel(rootLabel: string): string` → `` `${rootLabel} settings` ``.
  - `getSelectedBlockLabel(config: Config, type: string | undefined): string | null` → `config.components[type]?.label ?? type`, `null` when `type` is missing.
  - `getEditorRootBreadcrumb({ rootLabel, selectedLabel })` → the document part plus the optional selected label, so the component and the tests share one composition.
- **Presentational component.** `src/puck/editor/ui/components/editor-root-entry.tsx`, props `{ rootLabel, selectedLabel, isActive, onSelectRoot, variant: "row" | "header" }`. Row: full-width `button`, indent zero, document icon (lucide `FileTextIcon` or the shared element icon), same type scale as the outline rows, `aria-current` while active. Header: small `h2` with the settings label when active; otherwise the document `button`, a `›` separator and the selected label as text with `aria-current`.
- **Wiring — outline.** `src/puck/editor/ui/view/sidebar.tsx`: inside the existing outline `TabsContent`, a flex column with the row (`shrink-0`) above `<Puck.Outline />`. `ElementsPanel` already has `createUsePuck<Config>()`; read `appState.ui.itemSelector`, `selectedItem`, `config` and `dispatch` from it. Leave Puck's own outline header untouched.
- **Wiring — panel.** `src/puck/editor/ui/view/editor.tsx`: render the header variant at the top of the right column, outside `<Puck.Fields />` and outside the scrolling area, so it does not scroll away. The right column currently owns `overflow-y-auto`; the new header must not be inside that scrolling element.
- **Shell prop.** `PuckEditorProps` (`src/puck/editor-shell.tsx`) gains `rootLabel?: string` defaulting to `"Page"`, passed to `Editor` (`src/puck/editor/ui/view/editor.tsx`) and then to both call sites. Do not derive it from `header.title`.
- **Region editor.** `src/modules/site-regions/ui/views/site-region-editor-view.tsx` passes `rootLabel={SITE_REGION_LABELS[region.key]}`. `PageBuilderView` passes nothing.
- **Dispatch.** Reuse Puck's action exactly as the canvas deselect does: `dispatch({ type: "setUi", ui: { itemSelector: null }, recordHistory: false })`. Do not add a store, a Zustand slice or a context.
- **Why a pseudo-row.** `Puck.Outline` builds its tree from root zones only and `overrides.outline` receives no props (`RenderFunc`), so a root row inside the tree would mean reimplementing the internal `LayerTree` and its drag & drop. Verified on 0.23.0 and 0.24.0.
- **Why the header is not a `fields` override.** The override is coupled to Puck's field internals (`items`, `fields`, `isLoading`, tabs in 0.24) and disappears as a seam on upgrade; the fixed header in the shell is a plain element and stays put across versions.

## Verification

- Tests in `src/puck/__tests__/editor-root-entry.test.tsx` (`// @vitest-environment happy-dom` for the component, following `navbar-appearance.test.tsx`): active/inactive detection, settings label composition, block-label fallback, breadcrumb composition, rendered row/header content, `aria-current`, and click → `onSelectRoot`.
- `npx tsc --noEmit`, targeted ESLint on the touched files, `npm run test:run`, `npm run build`.
- Manual: empty page; block selected inside a nested Container; page with the Site layout preview on and off; Header and Footer editors; interactive preview on.

## Out of scope

- The Esc shortcut, the full ancestor chain in the breadcrumb, a root row inside Puck's outline tree, and any canvas highlight for the root.
- Any change to the root fields, the saved document shape, the public render, or the palettes.
- The 0.24 upgrade itself (ticket 01).
