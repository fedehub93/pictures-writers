---
Status: done
Type: task
Blocked by: 03-layout-blocks-inline-roots
---

# Block roots declare their own containing block

## What to build

Puck sets `position: relative` imperatively on the element it owns
(`dist/index.js:10310`), which in the canvas is now the block's own root. The
published page does not, so an absolutely positioned descendant resolves against
a different box: measured dx 0 on the page and dx 40 in the canvas when the
parent has 40px of padding.

Declare `position: relative` on the block root in `puck-base.css`, so both paths
have the same containing block. This is the same declaration the editor already
applies, made explicit for the page as well.

## Acceptance criteria

- [x] Every block root is `position: relative` in the canvas and on the published
      page, asserted on the computed style in the render-pipeline test.
- [x] A block containing an absolutely positioned element (today: insert one by
      hand in a test fixture) resolves it against the same box in both paths.
- [x] No block's existing layout changes: `position: relative` without offsets is
      not a layout change, and no block currently emits `top/left/right/bottom`
      together with a `position`.
- [x] Stacking is unchanged: a block root does not create a new stacking context
      unless it already had one (no `z-index`, no `transform`, no `opacity` added
      by this ticket).
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass. `tsc` and
      `test:run` pass; repo-wide `lint` still exits 1 on the 40 pre-existing
      errors recorded in `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`,
      none in a file this ticket touches (`npx eslint src/puck` reports 0
      errors).

## Notes

- The Dimension field already emits `--top-*`/`--left-*`/`--right-*`/`--bottom-*`
  but no block ever declares `position`, so those values are inert today. Adding
  a Position control is out of scope; this ticket only makes the containing block
  honest for whatever is positioned inside a block.
- Put the declaration where the layout variables live (`.puck-dim`) or on a
  dedicated root class, whichever keeps the block's own CSS readable — but it
  must apply to leaves as well as containers.

## Comments

- 2026-11-11 — Implemented with a dedicated root class instead of `.puck-dim`.
  `puck-base.css` gains section 0d: `.puck-block-root { position: relative; }`.
  The ticket allowed either home for the declaration; a dedicated class is used
  because the empty Form placeholder is a block root that deliberately keeps its
  own `size-full` box and does not take `.puck-dim` (ticket 04). `.puck-dim`
  stays about the dimension contract, and `.puck-block-root` names the
  containing-block contract for every root, leaves and containers alike.
- The class is applied at every place a root is composed: `SlotSurface`
  (Container, Flex, Grid), the Top bar strip, Text, Heading, Link, Image, Icon,
  Separator, Search bar, Navbar, LinkList, Copyright, Brand, and both Form
  roots (the real wrapper and the placeholder). No class is added to the page
  root: the root is not a block, and both paths already render it through the
  same `PageRootContent`.
- `position: relative` with no offsets changes no box and creates no stacking
  context (no `z-index`/`transform`/`opacity` is added). `getDimensionVars`
  still emits no `--top-*`/`--left-*`/`--right-*`/`--bottom-*`, so the inset
  declarations in `.puck-dim` stay inert exactly as before.
- Tests:
  - `render-pipeline.test.tsx` now runs in happy-dom and installs the real
    stylesheet through `helpers/puck-base-css.ts`. It asserts the computed
    `position` of every shared case's root in both the editor and public
    markup. The new absolute-descendant fixture (a slot with a child pinned to
    `top: 0`) walks up from the child and asserts that the block root is its
    nearest positioned ancestor in both paths.
  - `inline-roots.test.tsx` installs the same stylesheet and asserts the
    computed `position` on every registry root, including Icon (whose lazy
    glyph has no static markup for the render-pipeline test) and the Form
    placeholder, plus the `puck-block-root` class on every root.
  - The Brand, Copyright and NavbarBlock public entries are server renderers
    (Installation settings, CMS links), so they stay outside the render-pipeline
    list; their server tests now assert that the published root carries
    `puck-block-root`.
- Verification: `npx tsc --noEmit` clean; `npx eslint src/puck` 0 errors;
  `npm run test:run` 247 files / 2070 tests pass. `npm run lint` still exits 1
  on the 40 pre-existing errors recorded in the sibling upgrade ticket, none in
  a file this ticket touches.
