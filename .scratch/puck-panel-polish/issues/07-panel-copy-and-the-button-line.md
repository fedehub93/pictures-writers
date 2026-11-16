# 07: The panel speaks with one voice, and the Button's exception is written down

**What to build:** One case for the panel's field labels — sentence case, with
initialisms kept — instead of sixteen Title Case labels among sentence-case ones.
This is a change of case, not of words: no label is renamed. Alongside it, the
one exception the block defaults carry is written where a maintainer will read
it, next to the defaults themselves: a block's starting look stays in
defaultProps, except for the Button, and the Top bar and the Separator are named
as the boundary.

**Blocked by:** 01 — the same size view is edited by both, and this ticket should
not reopen the control that ticket changes.

**Status:** done

- [x] The field labels read in sentence case, initialisms such as a URL kept
      upper case.
- [x] No label changes word: the diff is a change of case only.
- [x] Labels that are already sentence case are untouched.
- [x] The block defaults state the starting-look exception, name the Button as
      the decision and the Top bar and Separator as the boundary, and cite the
      ADR that records it.
- [x] Documentation citations and the full test suite pass, with every test that
      asserts a changed label updated.

## Comments

- 2026-11-16 — Implemented in `e9e6c0a9`. Every field label and the field-group
  headings in the shared panel views now read in sentence case, with initialisms
  kept (`Image URL`, `Loading (SEO)`, `(X)`/`(Y)`); only the case changed. A
  panel-copy test drives Decoration, Typography, Size, Image and both Layout
  modes through their props and fails on a Title Case word or heading. Select
  option names and colour-swatch names are values rather than field labels and
  are unchanged.
- `src/puck/blocks/defaults.ts` states the starting-look exception: a block's
  starting look stays in `defaultProps`, except the Button, whose base box and
  Variant are owned by `puck-button-box` and the variant classes (ADR-0045); the
  Top bar and the Separator are the boundary and keep their defaults.
- Verification: `npm run typecheck` clean; `npm run lint` clean on the touched
  files; `npm run check:doc-citations` 93 docs, 0 broken citations;
  `npm run test:run` 271 files / 2394 tests passed. No browser probe: the change
  is copy and a comment.
