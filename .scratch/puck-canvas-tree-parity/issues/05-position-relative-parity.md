---
Status: ready-for-agent
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

- [ ] Every block root is `position: relative` in the canvas and on the published
      page, asserted on the computed style in the render-pipeline test.
- [ ] A block containing an absolutely positioned element (today: insert one by
      hand in a test fixture) resolves it against the same box in both paths.
- [ ] No block's existing layout changes: `position: relative` without offsets is
      not a layout change, and no block currently emits `top/left/right/bottom`
      together with a `position`.
- [ ] Stacking is unchanged: a block root does not create a new stacking context
      unless it already had one (no `z-index`, no `transform`, no `opacity` added
      by this ticket).
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass.

## Notes

- The Dimension field already emits `--top-*`/`--left-*`/`--right-*`/`--bottom-*`
  but no block ever declares `position`, so those values are inert today. Adding
  a Position control is out of scope; this ticket only makes the containing block
  honest for whatever is positioned inside a block.
- Put the declaration where the layout variables live (`.puck-dim`) or on a
  dedicated root class, whichever keeps the block's own CSS readable — but it
  must apply to leaves as well as containers.
