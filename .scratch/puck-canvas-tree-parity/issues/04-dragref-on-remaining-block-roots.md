---
Status: ready-for-agent
Type: task
Blocked by: 03-layout-blocks-inline-roots
---

# Every remaining block attaches the drag ref to its root

## What to build

After ticket 03 the container blocks have no editor wrapper, but the leaves and
the region blocks still do. Bring the rest over: Text, Heading, Link, Image,
Icon, Form, Separator, Brand, LinkList, Copyright, Search bar and Navbar — and
any block registered later — must declare `inline: true` and pass
`puck.dragRef` to the element that carries their root classes.

One table-driven test covers all of them at once, so the plumbing cannot be
forgotten for a block.

## Acceptance criteria

- [ ] Every entry of `editorComponentConfigs` declares `inline: true` and every
      block's render passes `puck.dragRef` to its root element.
- [ ] A test renders each block through the editor config with a spy `dragRef`
      and asserts the callback receives the element that also carries the
      block's root classes (`puck-dim` for all of them, `puck-layout` for the
      container blocks). A block that attaches the ref to a child, or not at
      all, fails.
- [ ] In the canvas, hovering and selecting every block type outlines the block
      itself, and nested selections still resolve to the innermost block.
- [ ] `Link` (a shadcn `Button` with `asChild`) keeps its `ref` composition, and
      the block renders and selects normally.
- [ ] `Image`, `Form`, `Navbar`, `Brand`, `LinkList`, `Copyright`, `Search bar`
      and `Separator` render identically to before in the canvas and on the page.
- [ ] The rich-text toolbar inside Heading and Text behaves exactly as before:
      opening the editor, its menu, and closing it. Marking a block inline
      touches Puck's `currentRichText.inlineComponentId` bookkeeping, so this is
      the one behaviour to check by hand.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass.

## Notes

- Do not attach the ref to a wrapper the block renders for its own layout (the
  Top bar slot, the Navbar's labelled row): the root element is the one carrying
  `puck-dim`/`puck-layout` and the layout variables.
- The block root is also the element Puck sets `data-puck-*`, `position:
  relative` and its event listeners on; keep the ref on the same element that
  owns the layout classes so the two cannot drift.
- `id`-less blocks are fine; Puck keys nodes by `props.id`, which the canvas
  supplies.
