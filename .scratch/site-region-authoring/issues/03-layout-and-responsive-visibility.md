---
Status: done
Type: task
Blocked by: 02
---

# Layout and responsive visibility on every block

## Goal

Let an editor hide or reflow any block per viewport, using the viewport switcher the editor already has, without wrapping the block in a container.

## Acceptance criteria

- [x] Every block that renders content exposes the Layout field, except blocks whose render is wholly owned by another surface (Root keeps its Dimension-only field).
- [x] The field edits the viewport selected in the toolbar, exactly like Dimension and Typography; tablet inherits desktop and mobile inherits tablet.
- [x] On blocks without children, the panel shows the display control only; flex and grid controls appear only for Container, Flex, Grid and the blocks with a slot (Top bar).
- [x] `display: none` at a breakpoint hides the block on the public site and makes it occupy no space.
- [x] The display rule applies only when a value was authored: a block with an empty `layout` keeps its current markup (important for Brand, whose root is `flex` through Tailwind classes).
- [x] In the canvas, a block hidden at the selected viewport is drawn as an editor-only placeholder: dashed outline, reduced opacity, label naming the hidden breakpoint. It stays selectable and editable.
- [x] The placeholder never appears in the public render.
- [x] The fields panel states when the block is hidden at the current viewport.
- [x] Tests: layout vars on a leaf block; hidden-at-mobile renders `--disp-m:none`; no display rule when layout is empty; the editor adds the placeholder class only when editing; the public render never adds it.

## Implementation notes

- **Two field variants.** `LayoutField` keeps the full display + flex/grid controls for Container, Flex, Grid and the Top bar. `DisplayOnlyLayoutField` is the same accordion with `showContainerControls: false`, so leaf blocks expose responsive visibility without dead controls. Root is unchanged.
- **Display classes are opt-in per authored breakpoint.** `getLayoutClassNames` emits `puck-display` plus `puck-display-d/t/m` only for breakpoints that authored `display`. `.puck-display` resets the `--disp-*` variables locally so a parent cannot leak its display into an unrelated block, and a leaf with an empty layout keeps its existing markup.
- **Public hiding.** `.puck-display-d`/`-t`/`-m` are ordered desktop → tablet → mobile, so the existing cascade applies: tablet inherits desktop, mobile inherits tablet. Hidden blocks are removed from layout by the browser (`display: none`), no wrapper is added.
- **Editor placeholder.** The block renders the same classes in the canvas, and adds `puck-hidden-placeholder` plus `puck-hidden-at-*` whenever the cascade hides it. `puck-base.css` scopes those markers with the same media queries as the responsive ladder: the canvas is an iframe whose width is exactly the selected bucket, so the query already names the viewport being edited (an attribute on the editor shell outside the iframe proved unreachable). The ghost is drawn on Puck's existing component wrapper: dashed outline, faded content and an absolutely positioned `Hidden on …` label. Only the hidden breakpoint gets `display: block !important`, so visible breakpoints keep their authored display and the block stays selectable.
- **One viewport source.** `src/puck/utils/breakpoints.ts` is the only ladder: the stylesheet, the viewport selector and the NavbarBlock collapse point all read it, and `breakpoints.test.ts` fails if the CSS drifts. The block-side visibility logic stays a pure helper because render functions are shared with the server and cannot use hooks.
- **Fields panel.** Layout shows a status note when the cascaded display at the current viewport is `none`.

## Verification

- `npx tsc --noEmit` clean.
- `npm run test:run -- src/puck`: 20 files / 146 tests pass.
- Full `npm run test:run`: 226 files / 1884 tests pass.
- ESLint on the changed files reports only pre-existing warnings.

## Notes

- The existing `.puck-layout` class sets `display: var(--disp-d)`, and an unauthored value resolves to `initial` (inline). Leaf blocks need a display-only class applied only when the block carries a display value; containers keep `.puck-layout`.
- Implement the placeholder in one place. The block render functions are shared by the canvas and the public site and cannot use hooks; a client wrapper that reads the current viewport, or a Puck override, is preferable to repeating editor logic in every block.
- The ghost is chrome: it must not affect layout measurement the editor uses for drag and drop.
- Do not add a mobile/tablet/desktop toggle row: the viewport switcher is the authoring model (see ADR-0038).
