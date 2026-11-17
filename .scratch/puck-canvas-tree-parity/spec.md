# Puck canvas tree parity: same element tree in the canvas and on the page

## Problem Statement

The canvas and the published page draw different element trees, so a layout can
be right in one and wrong in the other with no authored value out of place.

Two editor-only elements are responsible:

- Puck wraps every block in an unstyled `<div data-puck-component>` while
  editing. On the published page the block is the direct child of its parent.
  The wrapper becomes the flex/grid item, so the block is no longer the thing
  its parent lays out.
- Puck also renders the document's root content into its own zone element, a
  block-level `div` that has no counterpart on the published page. The top-level
  blocks are therefore children of a block box in the canvas and children of the
  root in production.

Measured on the real Header region document (identical stored props, Chrome,
desktop breakpoint):

| Case | Published | Canvas |
| --- | --- | --- |
| Container with `max-width: 72rem`, `margin: 0 auto`, no width, in a flex-column root | 934px (shrink to fit) | 1152px (fills) |
| `align-self: center` on a block in a column | applies | inert |
| `height: 50%` of a 400px parent | 200px | 10px |
| `width: 100%` inside a flex row | fills the row | content-sized |
| `position: absolute` child of a block, parent with 40px padding | dx 0 | dx 40 |

The first row is the reported defect: the author sees `space-between` working in
the editor and the same blocks bunched on the live site. The remaining rows are
the same defect in other properties and would surface next.

Because the canvas is the authoring surface, every mismatch forces a
publish → look → fix loop, and it silently teaches the wrong mental model: the
canvas is not a preview of the page, it is a different layout engine.

## Solution

Draw the same tree in both paths. Not a compiler and not a wrapper in
production: the block's own element becomes the node the editor selects, drags
and outlines, the way Elementor, Webflow and Framer work.

- **No per-block wrapper.** Every component declares `inline: true` and attaches
  Puck's `dragRef` to its own root element. For slot blocks the root *is* the
  slot, so the ref goes to `<Items>`. Puck then treats the block's element as its
  drag handle, selection anchor and overlay source.
- **No root-zone difference.** The editor's root zone carries the same layout
  contract as the root it sits in. The layout variables are inherited, so the
  zone only declares the container half (display, direction, wrap, justify,
  align, content, items, gaps, grid tracks) at all three breakpoints.
- **One containing-block rule.** A block root is `position: relative` in both
  paths. The canvas gets it from Puck today; the published page declares it, so
  an absolutely positioned descendant resolves against the same box.
- **Width states become explicit.** `auto` stays the default and now means
  exactly what CSS means in both paths. Setting a `max-width` without a width
  emits a full width, because a box that caps its width is a centered content
  area, not a shrink-to-fit label. The field gains explicit *Fill* and
  *Fit content* choices so the intent is visible instead of implied.

`align-self` stays in the vocabulary: with the wrapper gone, the block really is
a flex item in the canvas, so it behaves the same in both paths.

## User Stories

1. As a backoffice editor, I want a Container with a max width and auto margins
   to look the same in the canvas and on the page, so that `space-between` does
   not work only while I am editing.
2. As a backoffice editor, I want a block that fills its stack in the canvas to
   fill it on the page too, so that I do not have to publish to discover the
   real width.
3. As a backoffice editor, I want `align-self` to do something in the canvas, so
   that aligning one child inside a row is authorable.
4. As a backoffice editor, I want percentage heights and widths to resolve the
   same way in both paths, so that a full-height panel is not a guess.
5. As a backoffice editor, I want an absolutely positioned block to be placed
   against the same box in both paths, so that overlays and badges land where I
   put them.
6. As a backoffice editor, I want the root of the document to lay out its
   top-level blocks the same way in both paths, so that a column root that works
   in the canvas also works live.
7. As a backoffice editor, I want the Width field to say *Fill* or *Fit content*
   instead of leaving "auto" ambiguous, so that I can predict the result.
8. As a backoffice editor, I want setting a max width to be enough to get a
   centered content area, so that I do not have to know to add "width: 100%".
9. As a backoffice editor, I want the blocks hidden at a breakpoint to keep
   their ghost placeholder after this change, so that I can still select them.
10. As a backoffice editor, I want selection, hover, drag, drop, reorder and
    insertion to keep working on every block, including nested Containers.
11. As a backoffice editor, I want the rich-text toolbar inside Heading and Text
    to behave exactly as before, so that making blocks inline does not change
    text editing.
12. As a developer, I want a test that fails when a block stops being inline or
    stops attaching the drag ref to its root, so that adding a block cannot
    quietly reintroduce the wrapper.
13. As a developer, I want the render-pipeline parity test to cover the block
    root with a drag ref supplied, so that both paths are compared on the same
    element tree.
14. As a maintainer, I want no database change and no document migration, so
    that this ships as a normal deploy.
15. As a maintainer, I want the reason for `inline: true`, and the fact that
    Puck documents it for rich-text nodes, written down, so that a Puck upgrade
    is checked against it.

## Implementation Decisions

- **`inline: true` is the mechanism.** In `@puckeditor/core` 0.24 the only branch
  that skips the wrapper is `componentConfig.inline` (the component then receives
  `puck.dragRef` and must attach it to its root). Overrides expose no wrapper
  key, and `display: contents` on the wrapper was rejected: it removes the box
  Puck needs for overlay positioning and drag collision, so selection would
  break.
- **The ref goes on the block's root box.** The element that carries
  `puck-dim`/`puck-layout` is the element that receives `dragRef`, in the same
  expression, so the two cannot drift. For Container, Flex, Grid and Top bar the
  root is the slot, so the ref is forwarded to `<Items>`; DropZone and Slot
  forward a `ref` to their element in this Puck version.
- **Root zone contract.** `puck-base.css` targets
  `[data-puck-dropzone="root:default-zone"]` (Puck's `rootDroppableId`) and
  declares the container half of the layout contract, desktop-first, with the
  same media queries as `.puck-layout`. Editor-only by construction: the
  attribute exists only in the canvas. `align-self` is deliberately excluded.
- **Containing block parity.** Block roots declare `position: relative` in
  `puck-base.css`. Puck sets it imperatively on the node it owns, so declaring it
  for both paths is what removes the difference rather than creating one.
- **Width semantics.** `getDimensionVars` emits `--w-*: 100%` when `maxWidth` is
  authored and `width` is not. Because both paths share this function, the rule
  cannot diverge. Percentages keep working; *Fill* emits `100%`, *Fit content*
  emits `fit-content`, and the empty state keeps meaning "unset".
- **Centering stays CSS.** Auto margins keep centering. No "align in parent"
  abstraction is introduced, because with parity auto margins are already
  understood by the author the same way in both paths.
- **Rejected: publishing the wrapper.** It would guarantee parity but put an
  editor artefact in every published page and permanently remove the block's
  ability to be a flex/grid item.
- **Rejected: a context-aware sizing layer.** Making `auto` resolve from the
  parent's declared context fixes the default only, leaves `align-self`,
  percentages and containing blocks permanently misrepresented, and turns the
  style layer into a compiler that must classify every future property.
- **No data changes.** No schema change, no migration, no backfill. Documents
  keep their stored props; the only stored-value change is the author choosing a
  width state.
- **Puck upgrade risk.** `inline` is documented for rich-text inline nodes. The
  behaviour relied on is narrow (skip the wrapper, hand over `dragRef`), and the
  registry test plus the interactive checklist are the tripwires.

## Testing Decisions

- **Good tests here assert the contract, not the pixels.** The seam that matters
  is "which element is the block root and does it receive the drag ref", because
  that is what the wrapper used to steal.
- **Registry invariant.** Every entry in `editorComponentConfigs` declares
  `inline: true`. A block added without it fails the test instead of silently
  reintroducing the wrapper.
- **Per-block root ref.** Rendering a block through the editor config with a spy
  `dragRef` calls it with the element that also carries the component's root
  classes (`puck-dim` for every block, `puck-layout` for the container blocks).
  This covers the plumbing for all blocks in one table-driven test.
- **Render pipeline parity.** The existing consolidated test that renders every
  shared block through both configs is extended to pass a drag ref and to assert
  that the editor output has no wrapper element around the block root.
- **Stylesheet tripwire.** An assertion that `puck-base.css` still carries the
  root-zone selector, so a Puck upgrade that renames `rootDroppableId` fails
  loudly instead of silently restoring the divergence.
- **Manual acceptance.** Drag out of and into a nested Container, reorder inside
  a slot, insert from the drawer, open the rich-text toolbar in a Heading, and
  select a block hidden at the current viewport. These are interaction
  behaviours that no unit test in this repo can observe.

## Out of Scope

- Redesigning the Layout, Typography or Decoration fields.
- A visual "boxed container" block: `max-width` + auto margins + the width rule
  cover it.
- The properties panel layout, the Outline, the site layout preview chrome.
- Changing block markup for semantics (headings, nav, lists).
- Migrating stored documents.
- Pixel fidelity for third-party content inside Form and NavbarBlock.

## Further Notes

- This is the continuation of `.scratch/puck-slot-layout-parity/`, which aligned
  the *slot* element between the two paths (Top bar layout, public defaults). It
  stopped at the slot; this spec removes the elements around it.
- The diagnostic that established the numbers: the published header measured at
  a 1900px viewport, the same document measured inside the editor iframe, and a
  DOM harness comparing both shapes with and without a wrapper element.
- `CONTEXT.md` rewrites *Slot wrapper parity* as *Block root* and adds *Root
  zone*, because the discrepancy it documented is gone and the block root is now
  the selection node.
- The decision is recorded in
  `docs/adr/0040-one-element-tree-in-canvas-and-page.md`.
- The spike route was never committed: `src/app/(spike)/` existed only in the
  working tree during the diagnosis, so the cleanup was a no-op and no `SPIKE`
  marker or comment is left in `HEAD`.

## Tickets

| # | Ticket | Status | Depends on |
| - | ------ | ------ | ---------- |
| 01 | Width intent in the Dimension field | done | — |
| 02 | Root zone carries the root layout contract | done | — |
| 03 | Layout blocks render without the editor wrapper | done | 01, 02 |
| 04 | Every remaining block attaches the drag ref to its root | done | 03 |
| 05 | Block roots declare their own containing block | done | 03 |
| 06 | Hidden-block ghost without the wrapper | done | 04 |
| 07 | Docs, ADR and spike cleanup | done | 01–06 |

No follow-up tickets were opened during implementation. Two limitations were
confirmed and accepted rather than ticketed: a block that renders `null`
(`Brand` without name or logo, `NavbarBlock` without items, `Link` without a
link or label) has no root to attach the ref to, and `Icon` has no box until its
glyph chunk resolves; neither was pointer-selectable before the wrapper was
removed. The repo-wide `npm run lint` still exits 1 on the 40 pre-existing errors
recorded in `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`; every
file this effort touched lints clean.

## Verification

Manual acceptance in the Header region editor and on a local published site, at
desktop, tablet and mobile:

- The Header bar Container (max width 72rem, auto margins, no authored width)
  measures the same in the canvas and in production, and `space-between`
  distributes its children in both.
- A block with `align-self: center` inside a flex row is centered in both.
- A `width: 100%` child of a flex row fills the row in both.
- A `height: 50%` child of a block with an explicit height measures the same in
  both.
- A block hidden at the current viewport is still selectable as a ghost.
- Selection outlines the block exactly; hover, drag, drop, reorder and drawer
  insertion work on every block, including nested Containers.
- The rich-text toolbar inside Heading and Text behaves as before.
- `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass.
