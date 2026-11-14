---
Status: done
Type: task
Blocked by: 03
---

# 04: Hover

**What to build:** Every Button answers the pointer without anyone authoring it,
and the feedback follows the colour actually painted on that button: a primary
repainted green hovers from green, not from the theme's blue. A variant whose
background is transparent still shows a visible hover of its own. The naming
contract for the states that come later is written down and used, so adding focus
or active later is a rule and a variable, not a redesign.

**Blocked by:** 03 — outline and ghost have transparent backgrounds and need a
hover of their own, which can only be decided once the variants exist.

**Status:** done

## Acceptance criteria

- [x] Every Button gains a hover appearance with nothing authored, in the canvas
      and on the published page.
- [x] The hover is derived from the button's own background, so an overridden
      button hovers from the colour the author chose.
- [x] A Button whose background is transparent — outline, ghost, or any button
      whose author cleared the background — still has a visible hover.
- [x] A variant may dictate its own hover where the derived one does not read, and
      an author's hover wins over the variant's, like every other style value.
- [x] The state is expressed with the documented naming contract, the state as an
      infix before the breakpoint, and no state rule redefines a base variable:
      an authored value is inline and no stylesheet rule could outrank it.
- [x] The transition is smooth and causes no layout shift or movement of
      neighbouring blocks.
- [x] In the canvas the hover is visible and never interferes with editing: a
      click still selects the block and does not navigate.
- [x] Only hover ships. There is no state control in the panel, no state prop on
      any field, and no type reserved for a second state.
- [x] Tests read the shared stylesheet and pin the hover rule, its selector and
      the derived fallback, and assert that nothing redefines the base variables
      under a state.
- [ ] The appearance is accepted by hand in the canvas and on the published page
      for all four variants, as the base-width measurement was in the previous
      spec.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- This is the first hover in the block system: the shared stylesheet has no
  stateful rule today. It is deliberately the only one, and it exists to prove the
  contract rather than to introduce a mechanism.
- Why the state cannot reuse the base variables: an authored value reaches the
  block root as an inline custom property, and a stylesheet rule never outranks an
  inline declaration. A state therefore reads its own variables and the stylesheet
  chooses between them.
- A mitigated risk: the canvas draws the same stylesheet as the page, so a button
  under the pointer will visibly hover while being edited. That is a preview of
  the state, not a regression, and it must not change what a click does.
- The transition properties and duration are a design choice, not a spec
  constraint. If they turn out to be too slow on a heavy page, shorten them rather
  than removing the hover.

## Comments

- 2026-11-14 — Closed with `58ace2e5` (`feat(puck): give the Button a hover read
  from its own colour`) and `27849881` (`fix(puck): let the decoration ladder
  paint the tablet and mobile background`).

  Hover is read, never authored. `getDecorationStateVars` emits a Decoration's
  values under a state infix by reusing the one property list `getDecorationVars`
  emits, and `HOVER_STATE` names the `h`, so `--bgc-h-d` is the desktop hover of
  the background and no base variable is touched. `resolveButtonVariantStyles`
  now also returns the variant's own hover, materialized through the same
  `mergeVariant` pipeline as the base values: a variant hover is a preset in the
  state namespace, so a future authored hover wins there like every other value.
  Outline and ghost dictate `var(--accent)`; primary and secondary emit none and
  let the stylesheet derive one from the base background, which is what makes an
  overridden primary hover from the colour the author painted.

  `puck-base.css` §9 is the stylesheet's only stateful rule: one rule per rung
  reads `--bgc-h-<breakpoint>`, chains the state's own ladder and falls back to
  `color-mix(in srgb, var(--bgc-…) 85%, var(--foreground))`. It declares
  `background-color` only, with `!important` because `.puck-deco` does, and
  transitions that property at 160ms — no box property, so no layout shift. No
  rule under `:hover` declares a custom property, so an authored inline value
  stays unbeatable. The state has two selectors: `a.puck-button:hover` on the
  page, so a Button whose target resolves to nothing does not answer the pointer
  as if it were clickable, and `[data-puck-component].puck-button:hover` in the
  canvas, where the stored Smart link is unresolved and the same Button is drawn
  as text — the state stays a preview while editing, as this ticket's note asks.
  The second selector is inert bytes in the published bundle, like §7 and §8.

  The second commit is a prerequisite the hover exposed: the `.puck-deco`
  background at tablet and mobile did not carry the base declaration's
  `!important`, so an authored tablet or mobile colour never painted and the
  derived hover would have mixed a colour the page does not show. It changes only
  blocks whose author painted a background below desktop, which is the value the
  panel already showed, and its test lives with the ladder in
  `breakpoints.test.ts`.

  Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 260 files / 2289 tests pass. The new
  `button-hover.test.tsx` pins the three hover rules (both selectors, the
  per-rung state chain, the derived fallback), that no `:hover` rule redefines a
  base variable or touches a box property, the transition, the `--accent` hover
  for outline and ghost, the absence of state variables for primary and
  secondary, an overridden primary deriving from the authored colour, the infix
  emitter, the class on both the anchor and the text fallback, and the unchanged
  field set. `inline-roots` now asserts `puck-button` on the block root, and
  `breakpoints.test.ts` pins the decoration ladder's weight.

  One acceptance criterion is not ticked: the four variants' appearance has not
  been accepted by hand in the canvas and on the published page. No browser probe
  ran — the probe reports events, not computed colour, and the spec leaves the
  visual acceptance to a hand check. The canvas previews the state for every
  Button, including a link to an entity, which the canvas holds unresolved and
  draws as text; the published page resolves that link to an anchor and hovers.
  The click contract needs no new proof: the class changes no handler and
  `canvas-link-inert.test.tsx` still covers selection instead of navigation.
