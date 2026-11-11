---
Status: ready-for-agent
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
      viewport wider than 72rem.
- [ ] The same box at a viewport narrower than 72rem fills the viewport in both
      paths.
- [ ] An authored `width` (rem, px or `%`) still wins over the implied fill at
      every breakpoint, and a `width` authored on one breakpoint still cascades
      the way the other dimension values do.
- [ ] The Width control can produce `auto` (unset), `100%`, `fit-content`, a
      number with a unit, and clears back to unset; the panel shows which state
      is active without opening a tooltip.
- [ ] A block that authors `fit-content` keeps its natural size in both paths.
- [ ] Tests cover the emitted variables for: max-width without width, width with
      max-width, width without max-width, and the per-breakpoint cascade.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass.

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

Implemented in `src/puck/utils/get-style-vars.ts`,
`src/puck/fields/dimension/ui/view/width-control.tsx` (+ `SegmentedControl`
gained an optional short label and a `className`) and the two new test files
`src/puck/__tests__/dimension-width-vars.test.ts` and
`src/puck/__tests__/dimension-width-control.test.tsx`.

Two details settled during implementation:

- The implied fill is resolved along the same cascade the stylesheet uses, so a
  width authored on a wider breakpoint still wins at a narrower one that only
  adds a max width. Emitting `100%` per breakpoint from `data[bp]` alone would
  have silently promoted a desktop `50%` box to full width on tablet.
- A stored `auto` keyword is normalized to "no authored width" in the same
  helper, so the keyword and the empty value cannot behave differently now that
  one of them produces a fill.

`fit-content` is passed to the value/unit input as an allowed keyword, so it
survives a re-commit instead of becoming an opaque `f(x)` value.
