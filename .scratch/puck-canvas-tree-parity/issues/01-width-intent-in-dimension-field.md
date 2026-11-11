---
Status: ready-for-human
Type: task
---

# Width intent in the Dimension field

## What to build

A box that caps its width and centers itself is a content area, not a label.
Today the author has to know that, because `max-width` + `margin: 0 auto` with an
unset width shrinks to fit, and nothing in the panel says so.

Two changes in the shared style layer:

1. **Max width implies fill.** When a breakpoint authors `maxWidth` and no
   `width`, `getDimensionVars` emits `width: 100%` for that breakpoint. Both
   render paths call the same function, so the rule cannot diverge between the
   canvas and the page.
2. **The Width control says what it means.** The empty value stops being the
   only representation of "auto": the field offers explicit *Fill* (`100%`) and
   *Fit content* (`fit-content`) choices next to the existing numeric + unit
   input. The stored prop keeps its current shape (`width?: string`), so no
   document migration and no schema change.

## Acceptance criteria

- [ ] A Container with `max-width: 72rem`, `margin: 0 auto` and no authored
      width measures 1152px in the canvas and on the published page at a
      viewport wider than 72rem. *(browser check still open)*
- [ ] The same box at a viewport narrower than 72rem fills the viewport in both
      paths. *(browser check still open)*
- [x] An authored `width` (rem, px or `%`) still wins over the implied fill at
      every breakpoint, and a `width` authored on one breakpoint still cascades
      the way the other dimension values do.
- [x] The Width control can produce `auto` (unset), `100%`, `fit-content`, a
      number with a unit, and clears back to unset; the panel shows which state
      is active without opening a tooltip.
- [x] A block that authors `fit-content` keeps its natural size in both paths.
- [x] Tests cover the emitted variables for: max-width without width, width with
      max-width, width without max-width, and the per-breakpoint cascade.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass. `tsc` and
      `test:run` pass; repo-wide `lint` still exits 1 on the 40 pre-existing
      errors recorded in `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`,
      none in a file this ticket touches (`npx eslint src/puck` reports 0
      errors).

## Notes

- The rule belongs in `getDimensionVars` (`src/puck/utils/get-style-vars.ts`),
  not in a block, so Container, Flex, Grid, Image and the region blocks all
  inherit it.
- Do not special-case the parent's display. With the tree parity of tickets 02
  and 03 the two paths run the same CSS, so a rule that is wrong for a box inside
  a flex row is at least wrong identically in both — and the fix there is Grid,
  not a hidden branch.
- `fit-content` must survive the unit parser; check
  `src/puck/components/value-unit-input/` before choosing the representation.
- This ticket can ship alone: it also repairs the reported header on the live
  site before any tree change lands.

## Comments

- 2026-11-11 — Implemented in three commits: `f85c535d` (the style rule),
  `ee2c91ed` (the control) and `94dbb706` (menu width + inheritance wording).
  Files: `src/puck/utils/get-style-vars.ts`,
  `src/puck/fields/dimension/presets.ts`,
  `src/puck/fields/dimension/ui/view/dimension-view.tsx`,
  `src/puck/components/value-unit-input/ui/index.tsx`, plus
  `src/puck/__tests__/dimension-width-vars.test.ts` and
  `src/puck/__tests__/dimension-width-field.test.tsx`.
- The implied fill is resolved along the same cascade the stylesheet uses, so a
  width authored on a wider breakpoint still wins at a narrower one that only
  adds a max width. Emitting `100%` per breakpoint from `data[bp]` alone would
  have silently promoted a desktop `50%` box to full width on tablet.
- An empty value means "nothing decided here", so the breakpoint inherits the
  width authored above it; a stored `auto` is the explicit CSS keyword and is
  authored, so it cancels an inherited width. The two are different on purpose.
- The control is the existing value/unit input's preset menu (the Font Size
  pattern), not a new three-state row: the Width field keeps its cell in the 2x2
  grid and the panel layout is untouched. *Fill* stores `100%`, *Fit content*
  stores `fit-content`, *Auto* stores nothing. The active state is readable in
  the closed field (the stored value) and marked in the menu, so no tooltip is
  needed. Because Auto writes nothing, its description names what it inherits
  (`Auto (inherits fit-content)`) instead of reading as a document-wide reset.
- `fit-content` is passed to the value/unit input as an allowed keyword, so it
  survives a re-commit instead of becoming an opaque `f(x)` value. The shared
  input's preset preview now hides the `-` unit, because a keyword has no unit
  to show.
- The preset popover went from `w-52` to `w-64` and the description truncates
  before the value does: the old width produced a horizontal scrollbar on the
  `Fit content` row. The change is in the shared input, so Font Size inherits it.
- Verification: `npx tsc --noEmit` clean; `npx eslint src/puck` 0 errors;
  `npm run test:run` 245 files / 2031 tests pass. `npm run lint` still exits 1 on
  the 40 pre-existing errors recorded in the sibling ticket, none in a file this
  ticket touches.
- Open: the two viewport measurements and the Header region look are browser
  checks. Expected: the bar Container (max width 72rem, auto margins, no authored
  width) measures 1152px above 72rem and fills below it, in the canvas and on the
  published page, with `space-between` distributing its children at desktop and
  tablet. Status moved to `ready-for-human` for those; it becomes `done` once
  they are confirmed.
