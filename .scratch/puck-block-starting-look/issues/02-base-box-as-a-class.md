---
Status: ready-for-human
Type: task
Blocked by: 01
---

# 02: The Button's base box is a class of Style variables

**What to build:** A Button whose target-sized box belongs to the block instead
of to each instance. The four paddings stop being part of the block's default
props and are declared by the Button's own class, so a freshly dropped Button
emits nothing for them and looks the same as before, while a field the author
clears returns the base box instead of collapsing the Button.

**Blocked by:** 01 — the same stylesheet section and the same test file, not a
behavioural dependency. Doing them in parallel would edit both twice.

**Status:** ready-for-human — implementation landed, visual hand check pending.

## Acceptance criteria

- [x] A freshly dropped Button no longer emits its four paddings inline and no
      longer receives them from the block's default props.
- [ ] The Button's class declares those four paddings, and a Button looks exactly
      as it did before, in the canvas and on the published page.
- [x] An authored padding still wins at the Breakpoint it was authored at.
- [x] Clearing a padding value returns the base box instead of collapsing the
      Button, at every Breakpoint.
- [x] The panel shows the padding as unauthored until the author writes it, and
      states in one line where the unset values come from — the same line the
      Variant's inheritance uses.
- [x] The Width keeps its inline base width, and the Width control still names it
      as the block default.
- [x] A document that stored its paddings renders unchanged.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- The one document-visible change, and it is the intended one: a document that
  stored padding at a single Breakpoint gains the base at the others. Shallow
  default merging means such a document has no desktop padding today.
- The boundary matters as much as the change: the other blocks keep their default
  props. A block that needs a class-owned box brings its own arguments, and this
  spec does not open that door.
- The Width is deliberately left alone: its constant is quoted by the Width
  control, so hard-coding it in the stylesheet would give one value two sources.
- Hand check, no browser probe: the Button's box empty, authored and cleared, in
  the canvas and on the page.

## Comments

### 2026-11-16 — implemented, awaiting the hand check

Landed in `c193c5eb` (`feat(puck): carry a Button's base box on its class`).

- `BUTTON_DEFAULT_PROPS` no longer carries `spacing`; the four paddings moved to
  `.puck-button-box` in `puck-base.css` §4a, declared as the desktop rung's Style
  variables only, so the ladder carries them to tablet and mobile. The class is
  emitted by `ButtonBlockUi` on the anchor and on the text fallback alike, next
  to the variant class.
- The panel's copy now reads "The variant and the Button's base box set the
  starting style; a Decoration, Typography or Spacing value overrides it", and
  the Spacing section reads empty for a fresh Button because the block has no
  spacing default. The Width is untouched and still named as the block default.
- Stale doc comments in `Button/types.ts` and `Button/render.tsx` were corrected
  to the class model (they still said the render merged the variant underneath
  the authored values).
- Verification: `npm run typecheck` clean; `npx eslint` on the touched files 0
  problems; `npm run lint` 0 errors (265 pre-existing warnings); `npm test` 264
  files / 2349 tests passed; `npm run check:doc-citations` 92 docs, 0 broken.
- A throwaway happy-dom probe against the real stylesheet confirmed the desktop
  box computes to `8px 16px` with nothing authored and to `32px 16px 8px 16px`
  with `--pt-d:2rem`, i.e. one authored value wins while the other three keep
  the class's. The probe file was deleted.
- Hand check not done: the appearance half of the second criterion is still
  open, so the ticket is handed to `ready-for-human`. The declarations, the
  ordering against `.puck-dim` and the canvas/page markup parity are pinned by
  tests; the visual glance at an empty, an authored and a cleared Button in the
  canvas and on the page is the reviewer's.
