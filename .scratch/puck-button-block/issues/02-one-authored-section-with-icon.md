---
Status: done
Type: task
Blocked by: 01
---

# 02: One authored section, with the icon

**What to build:** A Button dropped on a page is authored from a single section
of the panel — Text, Link, Icon, Icon position, Icon spacing — instead of a link
editor that happens to own the words. The author writes the text where they read
it, picks a Smart link where they point it, and gives the call to action an icon
that sits before or after the text, at the text's own size, muted for assistive
technology. It is the ticket that makes the block a button rather than a word that
was renamed.

**Blocked by:** 01 — the block has to be called Button before its content moves.

**Status:** done

## Acceptance criteria

- [x] A dropped Button shows one section with Text → Link → Icon → Icon position
      → Icon spacing, in that order, and no separate field for the text.
- [x] The text auto-fills from the title of the entity being linked, and a text
      the author typed survives a change of target.
- [x] An icon before or after the text renders inside the anchor, separated by the
      authored spacing, and scaled by the button's own Typography.
- [x] With no icon the anchor lays out exactly as it laid out before this change;
      with an icon, icon and text sit on one line in the canvas and on the page.
- [x] The icon is not announced: a screen reader reads the button's text once.
- [x] A Button whose target resolves to nothing still renders as text, is not
      focusable, and is still selected by a click in the canvas instead of
      navigating.
- [x] The section is a custom field in the same shape as Form and Link; no
      primitive Puck field is introduced, and the existing link editor is reused
      with its own label control switched off.
- [x] Tests cover the icon markup, its position, the spacing and the silent icon,
      plus the no-icon case; a panel test covers the section order and the text
      surviving a target change.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- The text is stored as the label of the Smart link, so the auto-fill from an
  entity title keeps working; the panel only presents it first. Nothing about the
  stored shape changes beyond moving the authored props under one prop.
- Layout, Dimension, Typography and Decoration stay separate props, edited by the
  fields that already exist. The icon takes its size from Typography on purpose:
  a second size control would be a second type scale at every breakpoint.
- The Variant control is not part of this ticket. It arrives in 03 as the first
  control of this same section, which is why the section is built to accept a
  leading control without being restructured.
- Server-side link resolution needs no change: the document walk recognises a
  Smart link by its shape, so a link nested under the button's prop resolves like
  any other. The resolution test is the proof of that claim, not a new seam.

## Comments

- 2026-11-14 — Closed with `3b9112fa` (`feat(puck): author the Button as one
  section with an icon`). The authored props moved under `button`
  (`ButtonContentProps`): `link`, `icon`, `iconPosition`, `iconSpacing`. The
  panel now exposes `ButtonContentField`, a custom section built with
  `withContentField`, in the order Text → Link → Icon → Icon position → Icon
  spacing; the Text control writes the Smart link's label and the shared
  `LinkView` renders target selection with `showLabel: false`. `LinkView` gained
  an optional `defaultLabel` so the block's placeholder label is treated as
  unauthored and a first target still auto-fills the entity title, while a
  typed text survives a target change. The icon renders inside the anchor as an
  `aria-hidden` svg at `1em`, before or after the text, with a gap defaulting to
  `0.5em`; a button without an icon keeps its previous `inline-block` anchor and
  emits the same style object. `getLinkText` and `EMPTY_LINK` are now shared with
  `InlineSmartLink` and the links editor instead of being re-implemented.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 259 files / 2259 tests pass. New
  tests: icon markup/position/spacing/silence and the no-icon case
  (`button-block.test.tsx`), the real `DynamicIcon` inside the anchor
  (`button-icon-dom.test.tsx`), and the section order plus text survival and
  auto-fill (`button-content-field.test.tsx`). The Link list, Copyright and
  NavbarBlock resolution tests now store the link under the Button's `button`
  prop and still resolve it, which is the proof the walker needed no change.
  No browser probe: the spec leaves the icon's vertical alignment to a hand
  check in the canvas and on the published page, and the probe reports events,
  not computed layout. The two-axis code review found no spec breach; its
  standards notes (path aliases, one owned text fallback, one empty-link
  constant, an explicit field type) are folded into the commit.
