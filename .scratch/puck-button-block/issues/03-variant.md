---
Status: done
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

**Status:** done

## Acceptance criteria

- [x] A freshly dropped Button is primary, and the variant control always shows a
      value: there is no empty option to fall back to.
- [x] Primary, secondary, outline and ghost each read as a complete button, built
      on the theme tokens already in use, identically in the canvas and on the
      published page.
- [x] An authored Decoration or Typography value wins over the variant at the
      breakpoint it is authored at, and the variant's value still applies at
      breakpoints where nothing was authored.
- [x] Clearing an authored value brings the variant's value back, and the panel
      shows the field as unmodified again.
- [x] Changing the variant re-emits the style values without discarding the props
      the author set, at every breakpoint.
- [x] No stylesheet class carries a variant's look: the emitted style variables
      come through the same pipeline as an author's values, so a future state can
      override a preset and an authored value through one path.
- [x] There is no size control, and the four variants are the only ones offered.
- [x] Tests pin the emitted style variables for each variant and the override
      precedence across two breakpoints; no test asserts the internal shape of the
      variant table.
- [x] Typecheck, lint and the full test suite pass.

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

## Comments

- 2026-11-14 — Closed with `780dad12` (`feat(puck): start the Button from a
  variant`). `button.variant` is a `ButtonVariant`
  (`primary | secondary | outline | ghost`) with no empty value;
  `BUTTON_DEFAULT_VARIANT` is `primary` and the block default stores it. The
  table in `src/puck/blocks/Button/variants.ts` maps each variant to Decoration
  and Typography values on the theme tokens already in use (`--primary`,
  `--primary-foreground`, `--secondary`, `--secondary-foreground`,
  `--foreground`, `--border`, `--radius`), all four sharing the 1px border,
  radius and `font-weight: 500` so switching never resizes the box.
  `resolveButtonVariantStyles` merges the table underneath the authored values
  per breakpoint and key before `getTypographyVars`/`getDecorationVars` run; an
  explicitly `undefined` authored key counts as cleared, and an unknown stored
  variant falls back to primary instead of crashing. The panel leads the
  existing section with a four-way Variant control that always shows a value,
  plus one line stating the inheritance. No stylesheet rule or class is
  involved. `BUTTON_DEFAULT_PROPS` lost the old link-flavoured Typography
  default and gained a `0.5rem 1rem` target-sized padding, so a freshly dropped
  Button reads as a call to action without opening Dimension.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 259 files / 2271 tests pass. New
  tests pin each variant's style variables at all three breakpoints, the
  default primary, the two-breakpoint override precedence, clearing (including
  a key left as `undefined`), variant changes preserving authored props, the
  unknown-variant fallback, and the panel order plus the stored pick. No test
  reaches into the variant table. No browser probe: the spec leaves the visual
  acceptance — each variant reading as a complete button, identically in the
  canvas and on the page — to a hand check. The two-axis review's findings were
  folded in: the undefined-key erasure and the unknown-variant crash are fixed,
  the resolver was renamed away from the repo's `with*` HOC convention, and the
  shared box is expressed once.
