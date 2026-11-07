---
Status: done
Type: task
---

# Sticky header switch

## Goal

Let an editor pin the Header region while the page scrolls, as a versioned setting of the region, without changing the header's flow when the switch is off.

## Acceptance criteria

- [x] The Header region editor exposes a **Stick header on scroll** switch in its root properties (visible with nothing selected, or with the root selected in the Outline). The page editor and the Footer region editor do **not** expose it.
- [x] The value is stored in the region version's `root.props` and survives Save/Publish; absent, `false` and non-boolean values all mean "normal flow".
- [x] On the public site — including the `(home)` draft preview, which shares the same layout — a sticky header renders `<header>` with `sticky top-0 z-40`; a non-sticky header renders no positioning class.
- [x] The switch adds no background, border, shadow, offset or `main` padding. The author is responsible for painting the surface on the blocks or on a Container.
- [x] The field shows a short hint that the canvas renders the header in normal flow and the effect is visible on the published site.
- [x] Reading a cached published document with no root props (`root: {}`), or a document from before this change, never throws and renders as non-sticky.
- [x] Tests cover the pure helper (`isHeaderSticky`, class composition), the field's presence on the Header root only, and the absence of the field on the page/footer root.
- [x] `npx tsc --noEmit`, targeted ESLint, `npm run test:run` and `npm run build` pass.

## Implementation notes

- **Header-only root config.** `HeaderRootEditor` (`src/puck/root/header.tsx`) extends `RootEditor` with the `sticky` field; `editorConfigForRegion` maps `HEADER` to it and keeps `RootEditor` for pages and the footer.
- **Pure read.** `isHeaderSticky` (`src/modules/site-regions/lib/header-sticky.ts`) treats a missing, `false` or non-boolean value as normal flow. The public layout applies `sticky top-0 z-40` to the `<header>` only when it returns true.
- **No surface.** The switch adds positioning alone; background, border and offset stay on the authored blocks or Container. The canvas never pins the header.
- **Tests.** `header-sticky-root.test.ts` covers the field placement, and the header/layout tests cover the class composition and the legacy `root: {}` document.

## Verification

- Implemented in commit `7455ad17`.
- `npx tsc --noEmit`, targeted ESLint, full `npm run test:run` and `npm run build` pass.

## Hints

- `RootEditor` (`src/puck/root/index.tsx`) is shared by pages and both regions. Add a **header-specific** root config next to it, e.g. `HeaderRootEditor` in `src/puck/root/`, with `fields: { ...RootEditor.fields, sticky: HeaderStickyField }` and `render: renderRoot`. Do not add `sticky` to `RootEditor`.
- `editorConfigForRegion` (`src/puck/region/editor-config.tsx`) currently injects `RootEditor` in `buildEditorConfig`. Give the builder a `root` parameter and map `HEADER → HeaderRootEditor`, `FOOTER → RootEditor`.
- `renderConfigForRegion` can keep `rootRenderConfig`: the render function ignores `sticky`, and Puck does not need a render field to pass the prop through.
- Put the read/class logic in a pure module under `src/modules/site-regions/lib/` (e.g. `header-sticky.ts`) exporting something like `isHeaderSticky(data: Data): boolean` and a class-composition helper, so `(home)/layout.tsx` stays dumb and both are unit-testable. `headerPuckData` is already available in that layout.
- The field is a small custom field: `SwitchInput` plus a muted `text-xs` hint. A root field is not an accordion by default; follow `DimensionField`'s custom-field shape rather than the block accordion.
- Do not try to pin the header inside the canvas. The canvas renders the region data only and never the layout's `<header>` wrapper, so there is nothing to disable there.
- Check that no ancestor of `<header>` sets `overflow` other than `visible`; sticky would silently stop working. None does today.

## Out of scope

- Auto-hide on scroll, responsive per-breakpoint sticky, root decoration and anchor offsets (see the spec's follow-ups).
