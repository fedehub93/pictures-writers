---
Status: ready-for-agent
Type: task
Blocked by: 02
---

# 03: The variant

**What to build:** A Button dropped on a page already looks like a call to action
— primary, secondary, outline or ghost — without the author opening a style field,
and painting over it still wins. Two authors produce buttons that agree, a page
with three calls to action ranks them instead of tripping over three blues, and
clearing a value the author wrote returns the variant's.

**Blocked by:** 02 — the control is the first item of the section that ticket
builds.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] A freshly dropped Button is primary, and the variant control always shows a
      value: there is no empty option to fall back to.
- [ ] Primary, secondary, outline and ghost each read as a complete button, built
      on the theme tokens already in use, identically in the canvas and on the
      published page.
- [ ] An authored Decoration or Typography value wins over the variant at the
      breakpoint it is authored at, and the variant's value still applies at
      breakpoints where nothing was authored.
- [ ] Clearing an authored value brings the variant's value back, and the panel
      shows the field as unmodified again.
- [ ] Changing the variant re-emits the style values without discarding the props
      the author set, at every breakpoint.
- [ ] No stylesheet class carries a variant's look: the emitted style variables
      come through the same pipeline as an author's values, so a future state can
      override a preset and an authored value through one path.
- [ ] There is no size control, and the four variants are the only ones offered.
- [ ] Tests pin the emitted style variables for each variant and the override
      precedence across two breakpoints; no test asserts the internal shape of the
      variant table.
- [ ] Typecheck, lint and the full test suite pass.

## Notes

- The variant maps to Decoration and Typography values per breakpoint, not to a
  stylesheet class. That is the decision ADR-0043 records, and the reason is the
  state work planned after this feature: a class owns a look that a state variable
  could not override.
- The table is also the place a future "save these props as a variant" would
  write, which is why the values live as props rather than as CSS.
- The panel cannot show an inherited variant value as a placeholder, because a
  field sees only its own prop. State the inheritance in one line of copy inside
  the section instead; reading the selected item's props through the editor store
  is a later improvement, not this ticket.
- A variant whose background is transparent — outline and ghost — will need its
  own hover in 04. Do not pre-empt it here.
