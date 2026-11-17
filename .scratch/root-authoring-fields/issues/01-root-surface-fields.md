---
Status: done
Type: task
---

# Root surface fields

## Goal

Give the document root the same authoring surface as a Container — layout, dimension, decoration — on its existing wrapper element, without changing how documents saved before this change render.

## Acceptance criteria

- [x] `RootEditor` exposes **Layout**, **Dimension** and **Decoration** for Pages, Headers and Footers, in that order; the Header root still adds **Sticky**.
- [x] The root Layout control offers Block / Flex / Grid only: the `None` option is not rendered and no display value of `none` can be authored from the root panel.
- [x] Changing flex direction, justification, alignment, gaps or grid tracks on the root affects its children at the selected Breakpoint; tablet inherits desktop and mobile inherits tablet.
- [x] Decoration on the root paints the region/page surface (background, borders, radius, opacity) at each Breakpoint on the root element itself.
- [x] The public render adds **no new DOM element**: the root keeps the single wrapper it has today, with the new classes/variables on it.
- [x] A document with `root: {}`, or a document saved before this change, renders with the same markup and the same computed display (`block`) as today — never `inline`.
- [x] The public render path does not import editor field modules; `renderRoot` keeps its current import boundary.
- [x] Tests: authored layout variables and decoration variables reach the root wrapper; unauthored root emits no layout/decoration classes and defaults to block; the root Layout field has no `None`/hidden option; the fields are present on page, header and footer roots; `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build` pass.

## Implementation notes

- **Styles.** `renderRoot` (`src/puck/root/render.tsx`) spreads `getLayoutVars(layout)` and `getDecorationVars(decoration)` into the existing `styleVars`, and composes the classes on `RootBlockUi` (`src/puck/root/ui/root.tsx`): `puck-dim puck-layout` always, plus `puck-deco` only when `decoration` is authored.
- **Block default.** Emit `--disp-d: "block"` before spreading `getLayoutVars(layout)` so an unauthored display stays block. Do **not** rely on `getLayoutClassNames` on the root: the root needs `.puck-layout` unconditionally (that is where the flex/grid CSS properties live), and the block default is what keeps it safe.
- **Field variant.** `createLayoutField` (`src/puck/fields/layout/index.tsx`) already has `showContainerControls`. Add an option to filter the display options (or a `allowHidden?: boolean` flag passed down to `LayoutView`, which owns `displayOptions` in `src/puck/fields/layout/ui/view/layout.tsx`). Export a `RootLayoutField` with container controls and no `None`; leave `LayoutField` and `DisplayOnlyLayoutField` unchanged for blocks.
- **Compatibility.** `getLayoutVars` emits a variable per authored breakpoint only, and `.puck-dim`/`.puck-deco` reset their own variables, so no value leaks from a parent. The only regression risk is the display default described above.
- **Root config.** Add `layout` and `decoration` to `RootProps` (`src/puck/root/types.ts`) and to `RootEditor.fields`; `HeaderRootEditor` inherits them through `...RootEditor.fields`.
- **Preview/render config.** `rootRenderConfig` (`src/puck/render-config.tsx`) needs no fields for the new props; Puck passes them to the render function from the stored document.

## Verification

- Implemented in commit `d60be549`.
- `npx tsc --noEmit`, targeted ESLint, full `npm run test:run` (239 files, 1978 tests) and `npm run build` pass.
- Tests live in `src/puck/__tests__/root-surface-fields.test.tsx`, with the root field expectations updated in `layout-visibility.test.tsx` and the root wrapper class in `page-editor-root.test.tsx`.

## Out of scope

- Root Typography, root responsive visibility, ADR changes (the "Root is Dimension-only" note is superseded here, and the new behaviour is recorded in this spec).
- Migrating existing documents that use a Container as a surface.
