---
Status: ready-for-human
Type: task
Blocked by: none
---

# 01: Link base width

**What to build:** A Link dropped inside a flex or grid column is as wide as its
label again, in the canvas and on the published page, without any stored document
changing. *Fill* stays the way an author asks for a full-width button, an authored
width at any breakpoint still wins, and the Width panel names the width *Auto*
resolves to for this block instead of claiming there is none.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

## Acceptance criteria

- [ ] A Link with no authored width inside a flex column that authors no
      `align-items` measures its label width in the canvas and on the published
      page, and the two measurements match.
- [ ] The same document published before the change renders with the new width
      without being migrated: its stored props are untouched.
- [x] An authored width wins over the block default at the breakpoint that
      authors it, including a number with unit, a percentage, `fit-content`, and
      the explicit `auto` keyword inherited from a wider breakpoint.
- [x] A Link that authors a maximum width and no width hugs up to the cap instead
      of filling the container.
- [x] The Width panel's *Auto* row reads `block default (fit-content)` for a Link,
      still reads `inherits <value>` when a wider breakpoint authored a width, and
      still reads `no width` for a block without a base width.
- [x] Clearing the field returns the box to the block default; *Fill* still stores
      `100%` and *Fit content* still stores `fit-content`.
- [x] Blocks without a base width (Container, Flex, Grid, Image, Heading, Text and
      the region blocks) emit exactly the variables they emit today, implied fill
      included.
- [x] Tests pin the emitted variables, the panel sentence and the block root
      markup. No test asserts a computed layout.
- [x] The render-pipeline parity test still reports identical canvas and public
      markup for the Link block.
- [x] ADR-0040 records the consequence (a text-level block root needs a natural
      width once it is a flex/grid item, and that width outranks the implied
      fill), and `CONTEXT.md` gains the term **Block base width**.

## Notes

- The base width is emitted on the desktop rung so the responsive ladder inherits
  it; it is not a stored document value, so there is no migration and no schema
  change.
- Precedence: authored width (own or inherited, `auto` included) → block base
  width → implied fill from a max width. The implied fill exists because a
  content area that caps its width collapses without one; a block with a natural
  width has nothing to compensate.
- The Dimension field has to become a factory so a block can declare its base
  width, and the Link's render must read the same constant. The panel and the box
  reading one value is the point of the ticket.
- Rejected in the spec: a document default (Puck's shallow merge drops a nested
  default as soon as the document authored the dimension object, which nearly
  every existing Link did), a one-off migration (rewrites published documents and
  shrinks deliberate CTAs), and exposing `align-self` on leaves (only meaningful
  in a flex parent, and the width field already expresses it in both).

## Comments

- 2026-11-11 — Ticket written from the grilling session that followed the canvas
  tree parity work. The defect was found on real documents, not hypothesised: a
  flex-column Container on the Policy page with `align-items` authored only at
  tablet, holding a Link with a background and padding.
- 2026-11-11 — Implemented in `b11f56a2`. `getDimensionVars` takes an options
  object with `baseWidth` and resolves width as authored (own or inherited,
  `auto` included) → block base width → implied fill; the base is emitted on the
  desktop rung, so the ladder inherits it, and a block with one never gets the
  implied fill. The Dimension field is now `createDimensionField({ baseWidth })`
  (`DimensionField` stays the no-base default), and its *Auto* row names the
  base. `LINK_BASE_WIDTH = "fit-content"`
  (`src/puck/blocks/Link/constants.ts`) is imported by both the Link field and
  the Link render, so the panel and the box read one value. No schema change, no
  migration, no stored document touched.
- Files: `src/puck/utils/get-style-vars.ts`,
  `src/puck/fields/dimension/{index,presets}.ts`,
  `src/puck/fields/dimension/ui/view/dimension-view.tsx`,
  `src/puck/blocks/Link/{constants,index,render}.ts*`, `CONTEXT.md`, ADR-0040,
  plus `dimension-width-vars.test.ts`, `dimension-width-field.test.tsx`,
  `link-block.test.tsx` and `render-pipeline.test.tsx`.
- Verification: `npx tsc --noEmit` clean; `npx eslint` on the touched files 0
  errors; `npm run test:run` 248 files / 2097 tests pass. The emitted variables,
  the panel sentence and the Link root markup are pinned by tests; the authored
  `fit-content` case is proven against a base of `10rem`, so it cannot pass by
  coincidence, and a dedicated parity case covers a Link that caps its natural
  width.
- Remaining for the maintainer: the two browser measurements — a Link with no
  authored width inside a flex column that authors no `align-items`, measured in
  the canvas and on the published page, and an already-published Link document
  re-rendering with the new width. `fit-content` resolution is a browser
  behaviour, so no unit test asserts it. The status stays `ready-for-human` for
  that check only; everything else is closed.
