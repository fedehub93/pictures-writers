---
Status: ready-for-agent
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

**Status:** ready-for-agent

## Acceptance criteria

- [ ] A dropped Button shows one section with Text → Link → Icon → Icon position
      → Icon spacing, in that order, and no separate field for the text.
- [ ] The text auto-fills from the title of the entity being linked, and a text
      the author typed survives a change of target.
- [ ] An icon before or after the text renders inside the anchor, separated by the
      authored spacing, and scaled by the button's own Typography.
- [ ] With no icon the anchor lays out exactly as it laid out before this change;
      with an icon, icon and text sit on one line in the canvas and on the page.
- [ ] The icon is not announced: a screen reader reads the button's text once.
- [ ] A Button whose target resolves to nothing still renders as text, is not
      focusable, and is still selected by a click in the canvas instead of
      navigating.
- [ ] The section is a custom field in the same shape as Form and Link; no
      primitive Puck field is introduced, and the existing link editor is reused
      with its own label control switched off.
- [ ] Tests cover the icon markup, its position, the spacing and the silent icon,
      plus the no-icon case; a panel test covers the section order and the text
      surviving a target change.
- [ ] Typecheck, lint and the full test suite pass.

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
