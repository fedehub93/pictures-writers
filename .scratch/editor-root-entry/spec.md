---
Status: ready-for-agent
Type: spec
---

# Editor root entry points

## Problem Statement

The Editor root (`CONTEXT.md`: the document-wide settings an editor sets when no block is selected) is editable but effectively unreachable.

Puck already renders the root fields when nothing is selected: `FieldsInternal` registers the `"root"` node when `selectedItem` is `undefined` (`@puckeditor/core@0.23.0`, `dist/index.js:12535` → `3182`), and `createOnChange` writes through `replaceRoot` (`12449-12458`). The missing piece is the way back to that state.

- **Deselect depends on a fragile click target.** Puck clears the selection only when the click target has neither `data-puck-component` nor `data-puck-dropzone` (`16368-16372`, `18834-18842`). The page root drop zone carries `data-puck-dropzone` (`11010`) and covers the document area, so clicking anywhere inside the page keeps the previous block selected. The only working strip is the root wrapper padding outside the drop zone — observed in practice as a thin band immediately below the Site layout preview.
- **The outline cannot select the root.** `Puck.Outline` builds its trees from the root zones only (`17765-17777`) and the root is not a row; `overrides.outline` is a `RenderFunc` without props, so reimplementing the tree would mean rewriting the internal `LayerTree`, drag & drop included. Verified unchanged in `v0.24.0`.
- **The properties panel has no heading.** The right column renders `<Puck.Fields />` inside a bare `div` (`src/puck/editor/ui/view/editor.tsx:42-44`), so when the root fields are visible there is no indication that they belong to the page and not to a block.

The result is that page-level layout, dimension and decoration are authorable only by accident, and the same is true for the Header and Footer region roots, which share the shell.

## Solution

Give the editor two explicit ways to select the Editor root, and one place that states which document the fields belong to.

- A pinned **document row** at the top of the Outline tab ("Page", "Header", "Footer"), always visible, highlighted while the root is active, which deselects the current block.
- A fixed **panel header** above the properties panel: `${rootLabel} settings` when the root is active, `Page › Heading` when a block is selected, with the document part acting as the same deselect control.
- Both affordances dispatch Puck's own deselect (`setUi: { itemSelector: null }`, no history entry). No parallel selection state, no fork of Puck's outline.
- The label comes from an explicit `rootLabel` prop on the shell; the page editor defaults to "Page" and the region editors pass their existing region label.
- Upgrade `@puckeditor/core` to 0.24 first, as an isolated commit, so the feature is built on the current release.

## User Stories

1. As a backoffice editor, I want a permanent way back to the page settings, so that I do not have to hunt for the thin strip of padding that still deselects.
2. As a backoffice editor, I want to reach the page settings from the outline, because that is where I look for the structure of the document.
3. As a backoffice editor, I want the properties panel to say which document it is showing, so that I know whether I am editing layout on the page or on a block.
4. As a backoffice editor, I want a one-click path from a selected block back to the page, so that I do not lose my place after editing a deeply nested block.
5. As a Header or Footer author, I want the same affordances labelled with the region I am editing, so that "settings" always means the document I have open.
6. As a backoffice editor, I want the entry to work on an empty page too, so that the only page-level controls are not hidden behind a click that no longer deselects.
7. As a backoffice editor, I want the entry to keep working in interactive preview, so that switching preview does not strand me inside a block.
8. As a maintainer, I want the outline row and the panel header to share one presentational component and one label helper, so that the two affordances cannot drift.
9. As a maintainer, I want the entry point to reuse Puck's deselect action rather than introducing an editor-root selection state, so that selection stays a single source of truth.
10. As a maintainer, I want no dependency on Puck's internal outline tree, so that a Puck upgrade cannot break the entry point.
11. As a maintainer, I want the component tested without mounting Puck, so that the suite keeps protecting the label and the action without a new harness.
12. As a maintainer, I want the 0.24 upgrade in its own commit, so that a regression there is bisectable and unrelated to this feature.

## Implementation Decisions

- **Two entry points, one component.** `src/puck/editor/ui/components/editor-root-entry.tsx` renders both variants from the same props: `rootLabel`, `selectedLabel`, `isActive`, `onSelectRoot`, `variant: "row" | "header"`. The row variant is a full-width button at indent zero with a document icon; the header variant renders a heading with `${rootLabel} settings` when active, otherwise a `rootLabel` button, a separator and the selected block label.
- **Root active = no selection.** `isActive` is `appState.ui.itemSelector == null`. No new state is stored anywhere.
- **Deselect action.** `dispatch({ type: "setUi", ui: { itemSelector: null }, recordHistory: false })`, matching Puck's own deselect (`18834-18842`). Deselecting must not pollute undo history.
- **Placement in the outline.** The row sits above `<Puck.Outline />` inside the existing outline tab of `src/puck/editor/ui/view/sidebar.tsx`, outside the outline's own scroll container, so it stays visible on long documents. It is not part of Puck's tree and is not draggable. The existing outline header is left untouched.
- **Placement in the panel.** The header is rendered in `src/puck/editor/ui/view/editor.tsx` above `<Puck.Fields />`, in the fixed right column rather than through Puck's `fields` override. This keeps the affordance independent of Puck's field internals and out of the scrolling field list.
- **Label source.** `PuckEditorProps` gains `rootLabel?: string`, default `"Page"`, forwarded to `Editor` and from there to the sidebar and panel header. `PageBuilderView` passes nothing; `SiteRegionEditorView` passes `SITE_REGION_LABELS[region.key]`. The label is not derived from `header.title`, which is the page title or the region title and means something else.
- **Selected block label.** Resolved from `config.components[type].label`, falling back to the component key. One level only: no ancestor chain, because the outline already shows the hierarchy.
- **No canvas feedback.** No ring or overlay around the root: Puck has no root overlay and a ring would read as a block selection.
- **Preview mode.** The row and the header stay visible and active while `previewMode` is `"interactive"`; the only effect is clearing a selection that is already inert.
- **Accessibility.** The row is a `button` with `aria-current` set while the root is active; the header's document part is a `button` with an accessible name that includes the label. The active block label is plain text marked `aria-current`.
- **Upgrade first.** `@puckeditor/core` moves from `^0.23.0` to `^0.24.0` in a separate commit. 0.24 has no breaking changes; its only migration note concerns `fields` overrides that rearrange `React.Children`, which the project does not have. This feature deliberately does not use the new `fields` override API, so the upgrade does not change its design.
- **No ADR, no CONTEXT change.** The change is reversible UI with no data, render or deployment consequence. The pseudo-row is the surprising part, and it is justified here: Puck's outline has no root row (verified on 0.23 and 0.24) and `overrides.outline` cannot reproduce it without rewriting the internal tree. `CONTEXT.md` already defines "Editor root"; the row and the header are affordances, not new domain vocabulary.

## Testing Decisions

A good test asserts what an editor can observe: which label appears, which affordance is marked current, and that activating it asks Puck to deselect.

- **Seam: pure helpers.** `src/puck/editor/lib/editor-root-entry.ts` exports `isEditorRootActive(itemSelector)`, `editorRootSettingsLabel(rootLabel)`, `getSelectedBlockLabel(config, type)` and `getEditorRootBreadcrumb({ rootLabel, selectedLabel })`. Tested in `src/puck/__tests__/editor-root-entry.test.tsx`: null and undefined selectors are active, a selector is not; the settings label composes; a component without a `label` falls back to its key; the breadcrumb carries the selected label when present and the settings label when not.
- **Seam: rendered affordance.** The same file opts into `// @vitest-environment happy-dom` and renders the presentational component with `createRoot` + `act`, following `navbar-appearance.test.tsx`. Assert the row shows the label and is marked current only when active, that the header shows the settings label when active and `Page › Heading` when not, and that clicking either control invokes `onSelectRoot`.
- **Not tested.** No Puck mount test, no test of the `usePuck` wiring, no browser or E2E test: the project has no Puck mount harness and adding one is out of scope here. The real deselect is verified manually.
- **Verification.** `npx tsc --noEmit`, targeted ESLint on the touched files, `npm run test:run`, `npm run build`, and a manual pass on the page editor, the Header editor and the Footer editor, with and without a selected block.

## Out of Scope

- A keyboard shortcut (Esc) to deselect. Decided against for now: it would need guards for inputs, contentEditable and menus/dialogs that already consume Esc.
- A root row inside Puck's own outline tree, or a custom `overrides.outline` implementation.
- The full ancestor chain in the breadcrumb (`Page › Container › Heading`).
- Any canvas highlight or action bar for the root.
- Changes to the root fields themselves, to the saved document shape, or to the public render.
- Adopting the other 0.24 features (field groups, field tabs, checkbox field, drag handles).
- Promoting the header/footer blocks or changing any palette.

## Further Notes

- Canonical vocabulary: `CONTEXT.md` → "Editor root" (with `_Avoid_: page props`), "Site region", "Site layout preview".
- Governing decisions: none. The root fields themselves were specified in `.scratch/root-authoring-fields/`; the shared editor shell and its header in `.scratch/puck-editor-polish/`.
- Prior investigations that assumed the root was reachable "when nothing is selected" (`.scratch/header-sticky-and-navbar-style/spec.md`) were correct about the mechanism and silent about the entry point; this effort closes that gap.
- Puck facts used here were read from the installed `0.23.0` bundle and the `v0.24.0` sources of `components/Puck/components/Outline/index.tsx` and `.../Fields/index.tsx`.

## Tickets

| # | Ticket | Depends on |
| - | ------ | ---------- |
| 01 | Upgrade `@puckeditor/core` to 0.24 | — |
| 02 | Editor root entry points | 01 |
