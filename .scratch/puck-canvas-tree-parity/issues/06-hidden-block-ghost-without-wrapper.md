---
Status: ready-for-human
Type: task
Blocked by: 04-dragref-on-remaining-block-roots
---

# Hidden-block ghost without the wrapper

## What to build

A block hidden at the viewport being edited is drawn as a dashed ghost so it
stays selectable. The current rules key off Puck's wrapper being the parent of
the placeholder class:

```css
[data-puck-component]:has(> .puck-hidden-placeholder) { … }
```

With tickets 03 and 04 the placeholder class sits on the same element as
`data-puck-component`, so those rules stop matching and the ghost disappears.
Rewrite section 6 of `puck-base.css` for the new tree, keeping the three
behavioural promises: the block stays visible and selectable as a ghost, the
authored `display: none` still applies at every other width, and the label says
which breakpoint hides it.

## Acceptance criteria

- [x] A block hidden at desktop is drawn as a dashed ghost at desktop, keeps its
      label, and still occupies no space on the published page.
- [x] The same holds at tablet and mobile, and the ghost appears at exactly one
      canvas width per breakpoint (the media-query scoping is preserved).
- [ ] Clicking the ghost selects the block and opens its fields.
- [ ] Dragging a block into or out of the ghost's place still works.
- [x] A block that is *not* hidden is never faded, outlined or labelled.
- [x] The rule cannot reach the published page: the ghost classes are emitted
      only while editing.
- [x] A regression test asserts the emitted classes for a hidden block in the
      editor path (the class list is the contract; the pixels are not).

## Notes

- Today the outline lives on the wrapper and the fade on the child, so the
  outline stays solid while the content fades. With a single element those two
  cannot be separated: decide whether the outline fades with the content (simpler,
  acceptable) or whether the fade moves to the block's children. Record the
  choice in the CSS comment.
- `getLayoutClassNames` emits `puck-hidden-placeholder` plus one
  `puck-hidden-at-*` marker; only the selectors around it change, not the
  contract it expresses.

## Comments

- 2026-11-11 — Implemented. Section 6 of `puck-base.css` now keys off
  `.puck-hidden-placeholder` on the block root instead of
  `[data-puck-component]:has(> …)`; the node the editor emits the classes on is
  the node Puck owns, because every block is `inline` and puts its `dragRef`
  there. The rules stay class-based on purpose: the class emission (only while
  editing) is the published-page guarantee, and the CSS does not depend on
  Puck's `data-puck-component` attribute, so a future upgrade that stops
  tagging the node cannot leave a hidden block at its authored `display: none`
  (invisible and unselectable) instead of merely un-ghosted.
- Fade decision, as the note asked: `opacity` sits on the root, so the box, the
  dashed outline and the `Hidden on …` label fade together. That is the simpler
  of the two options and reads correctly as a ghost; the alternative (fade the
  children only) cannot cover a leaf's text nodes. The value is declared inside
  each marker's media query, not on the base rule, so at every other width an
  authored `opacity` still applies.
- Follow-up found in review: the ghost custom properties are inherited, so a
  block hidden at one breakpoint nested in a parent hidden at another would
  have picked up the parent's outline and label. The base rule now resets
  `--puck-ghost-outline` and `--puck-hidden-label` to `initial` (the same
  convention `.puck-display` uses for the display ladder), and the regression
  test pins the reset.
- New `src/puck/__tests__/hidden-block-ghost.test.tsx` pins both halves of the
  contract. The stylesheet side parses the real file and asserts: no ghost rule
  uses `:has(> …)` or a Puck attribute, every rule targets the placeholder
  element itself (or its `::after`), the base rule stays neutral and resets the
  inherited properties, and each `puck-hidden-at-*` marker lives in exactly its
  breakpoint query with `display: block !important` plus the label. The render
  side mounts Text and Container through their editor renders with a spy
  `dragRef` and asserts the classes land on the element the ref receives: the
  block root for a leaf, the slot root for a container, with the desktop-first
  cascade (`none` at desktop marks all three buckets, `none` at tablet marks
  tablet + mobile). A visible block gets no ghost classes, and the public
  render emits none either.
- The CSS rule parser that `root-zone-layout.test.ts` carried locally moved to
  `src/puck/__tests__/helpers/css-rules.ts` (`readPuckBaseRules`, `parseRules`,
  `declarations`, `authoredDeclarations`) so both tripwires read the stylesheet
  the same way.
- Verification: `npx tsc --noEmit` clean; `npx eslint` on the touched test
  files 0 errors; `npm run test:run` 248 files / 2080 tests pass.
- Remaining for the maintainer: the two interaction checks (clicking the ghost
  selects the block and opens its fields; dragging a block in and out of the
  ghost's place) are canvas behaviours no test in this repo can observe. They
  are the reason the status is `ready-for-human`; everything else is closed.
