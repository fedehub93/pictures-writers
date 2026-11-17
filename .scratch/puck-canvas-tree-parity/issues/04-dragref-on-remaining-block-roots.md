---
Status: done
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

- [x] Every entry of `editorComponentConfigs` declares `inline: true` and every
      block's render passes `puck.dragRef` to its root element.
- [x] A test renders each block through the editor config with a spy `dragRef`
      and asserts the callback receives the element that also carries the
      block's root classes (`puck-dim` for all of them, `puck-layout` for the
      container blocks). A block that attaches the ref to a child, or not at
      all, fails.
- [x] In the canvas, hovering and selecting every block type outlines the block
      itself, and nested selections still resolve to the innermost block.
- [x] `Link` (a shadcn `Button` with `asChild`) keeps its `ref` composition, and
      the block renders and selects normally.
- [x] `Image`, `Form`, `Navbar`, `Brand`, `LinkList`, `Copyright`, `Search bar`
      and `Separator` render identically to before in the canvas and on the page.
- [x] The rich-text toolbar inside Heading and Text behaves exactly as before:
      opening the editor, its menu, and closing it. Marking a block inline
      touches Puck's `currentRichText.inlineComponentId` bookkeeping, so this is
      the one behaviour to check by hand.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass. `tsc` and
      `test:run` pass; repo-wide `lint` still exits 1 on the 40 pre-existing
      errors recorded in `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`,
      none in a file this ticket touches (`npx eslint src/puck` reports 0
      errors).

## Notes

- Do not attach the ref to a wrapper the block renders for its own layout (the
  Top bar slot, the Navbar's labelled row): the root element is the one carrying
  `puck-dim`/`puck-layout` and the layout variables.
- The block root is also the element Puck sets `data-puck-*`, `position:
  relative` and its event listeners on; keep the ref on the same element that
  owns the layout classes so the two cannot drift.
- `id`-less blocks are fine; Puck keys nodes by `props.id`, which the canvas
  supplies.

## Comments

- 2026-11-11 — Implemented. Every entry of `editorComponentConfigs` now
  declares `inline: true`, and each block's own root receives
  `puck.dragRef`: the `<p>` (Text), the root `<div>` (Heading, Form, Separator,
  Search bar, Navbar, Link list, Copyright, Brand), the `<a>`/`<span>` that
  renders the link (Link, through `InlineSmartLink`), the `<a>`/`<div>` box of
  the image (Image) and the rendered `<svg>` (Icon). Brand, Copyright and
  NavbarBlock read `puck.dragRef` in their editor renderers and thread it
  through `BrandBlockRenderProps` / `CopyrightBlockRenderProps` /
  `NavbarBlockRenderProps`; their types gained an optional `dragRef`, so the
  public server renderers are unchanged. `BlockDragRef` in `src/puck/types.ts`
  now states the rule the whole layer follows (root element, same element as
  `puck-dim`, never a child or a block-rendered layout wrapper).
- The table-driven test in `src/puck/__tests__/inline-roots.test.tsx` covers all
  sixteen blocks, one case per palette (`HEADER`, `FOOTER`, page), and asserts
  four things per case: the config declares `inline`, `dragRef` was called with
  the host's only child, the host has exactly one child (no wrapper) and the
  root carries `puck-dim` plus the block's own root classes. A separate test
  asserts the case list equals the registry keys, so a block added later cannot
  skip the check, and the registry test has no allow-list any more: every entry
  must be `inline`.
- Mutation check: removing `inline: true` from one config fails the per-case
  assertion and the registry test; removing `dragRef={puck?.dragRef}` from one
  render fails the per-case `toHaveBeenCalled`. Both were tested and reverted.
- `Icon` is the one block whose root does not exist on the first render: it
  renders `DynamicIcon`, which returns `null` until its glyph chunk resolves.
  The ref is therefore attached when the `<svg>` mounts, a few milliseconds
  after the block appears. The test drives the real component and waits for the
  callback instead of stubbing the icon, so it also pins that `Icon` forwards the
  ref to the element that carries the block classes. The trade-off is that the
  block has no selectable box during that first tick; before the ticket the
  wrapper covered the gap, and it is not worth keeping a wrapper for it.
- `Separator` needed a small restructure, not just a ref: the dimension used to
  size the *line* (`.puck-dim` on the inner Radix rule) while the root was a
  full-width box, so the block box and the styled element were two different
  elements — exactly the drift this spec removes. The root now carries
  `puck-dim` and the full style-variable map, and the rule fills it
  (`height: 100%`, `min-height: 1px` as the previous `h-[1px]` fallback). The
  defaults (width 100%, height 2px) render the same line as before; authored
  widths now size the block box, and margins/padding sit on the box instead of
  inside the line. `w-full`/`min-w-full` were dropped from the root because
  `min-width: 100%` would have overridden an authored width.
- Deliberate exception: the Form "Select a valid form!" placeholder keeps its
  own `size-full` root and does not take `puck-dim`. That state is public
  markup too (a page whose form was deleted renders it), and `size-full` is the
  behaviour it had; adding `puck-dim` would swap it for an auto-sized box. The
  ref still lands on that element, so the block stays selectable, and the test
  asserts the ref there without the `puck-dim` invariant.
- Known, pre-existing, and unchanged in practice: a block that renders `null`
  has no root to attach the ref to — `Brand` with no name and no logo,
  `NavbarBlock` with no items, `Link` with no link or label. Before this ticket
  the wrapper was 0×0 in the same states, so nothing was selectable by pointer
  either; the Outline still lists them. No markup was invented to fix it here.
- The rich-text toolbar check (Heading and Text) and the canvas hover/selection
  walk are manual: no test in this repo can observe them. They were performed
  and signed off in the comment below.
- Verification: `npx tsc --noEmit` clean; `npx eslint src/puck` 0 errors (only
  the pre-existing warnings); `npm run test:run` 247 files / 2057 tests pass.
  `npm run lint` still exits 1 on the 40 pre-existing errors recorded in the
  sibling ticket, none in a file this ticket touches.
- 2026-11-11 — Manual acceptance done by the maintainer in the Header and Footer
  region editors and on the local published site. Hovering and selecting each
  block type outlines the block's own box (never an inflated wrapper), and a
  nested selection still resolves to the innermost block. The Link block selects
  from the anchor and from the plain-text fallback, and the rich-text toolbar in
  Heading and Text opens, renders its menu and closes exactly as before
  (`currentRichText.inlineComponentId` is unaffected by the inline flag). Image,
  Form, Navbar, Brand, LinkList, Copyright, Search bar and Separator look the
  same as before in the canvas and on the page, the Separator box now following
  its authored width. Ticket closed; the only box left unticked is the
  repo-wide `lint` failure recorded above, accepted as pre-existing and outside
  this ticket.
