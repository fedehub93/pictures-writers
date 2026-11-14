---
Status: ready-for-agent
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

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Every Button gains a hover appearance with nothing authored, in the canvas
      and on the published page.
- [ ] The hover is derived from the button's own background, so an overridden
      button hovers from the colour the author chose.
- [ ] A Button whose background is transparent — outline, ghost, or any button
      whose author cleared the background — still has a visible hover.
- [ ] A variant may dictate its own hover where the derived one does not read, and
      an author's hover wins over the variant's, like every other style value.
- [ ] The state is expressed with the documented naming contract, the state as an
      infix before the breakpoint, and no state rule redefines a base variable:
      an authored value is inline and no stylesheet rule could outrank it.
- [ ] The transition is smooth and causes no layout shift or movement of
      neighbouring blocks.
- [ ] In the canvas the hover is visible and never interferes with editing: a
      click still selects the block and does not navigate.
- [ ] Only hover ships. There is no state control in the panel, no state prop on
      any field, and no type reserved for a second state.
- [ ] Tests read the shared stylesheet and pin the hover rule, its selector and
      the derived fallback, and assert that nothing redefines the base variables
      under a state.
- [ ] The appearance is accepted by hand in the canvas and on the published page
      for all four variants, as the base-width measurement was in the previous
      spec.
- [ ] Typecheck, lint and the full test suite pass.

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
