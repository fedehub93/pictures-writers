---
Status: done
Type: task
Blocked by: None
---

# 01: The Variant's look is a class of Style variables

**What to build:** A Button that carries the look of its variant without copying
that look onto the instance. A freshly dropped primary emits no variant Style
variable and one class naming the variant; an authored Decoration or Typography
value still appears inline and still wins at the Breakpoint it was authored at;
clearing it still brings the variant's back; the four variants, their dictated
hover and the derived hover all read exactly as they do today, in the canvas and
on the published page.

**Blocked by:** None (can start immediately).

**Status:** done

## Acceptance criteria

- [x] A freshly dropped Button carries a class naming its variant and emits no
      Variant Style variable inline; the anchor and the plain-text fallback
      carry the same root classes.
- [x] Each of the four variants looks exactly as it did before, in the canvas
      and on the published page.
- [x] An authored Decoration or Typography value still appears inline, still wins
      at the Breakpoint it was authored at, and inherits the variant elsewhere.
- [x] Clearing an authored value brings the variant's value back.
- [x] A stored variant that is no longer one of the four still renders as
      primary.
- [x] Each variant's hover still works — derived from the base colour for primary
      and secondary, dictated for outline and ghost — and still follows a
      background the author overrode.
- [x] The stylesheet holds each variant's look once, those rules declare only
      custom properties, and none of them uses `!important`.
- [x] The render no longer resolves variant styles: the variant name, the list the
      panel offers, the default and the fallback for an unmatched stored value
      are the only data left.
- [x] The canvas and the published page emit identical markup.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- The invariant this ticket establishes: inline outranks the class, so a Variant
  rule that declared a property or `!important` would silently take the preset
  out of the author's hands. A test pins it; nothing else can.
- The values move to the stylesheet, so an author-defined "save these props as a
  Variant" would need a generated rule. It is out of scope before and after.
- No longer needed: the per-Breakpoint merge and the resolver that fed it. What
  the render still needs is the variant's name and a fallback for a value the
  stored document no longer matches.
- Hover keeps the single stateful rule it already has: same selectors, same
  derived fallback, same transition. This ticket only stops writing the
  variant-dictated state variables inline.
- Hand check, no browser probe: the four variants in the canvas and on the page.
  The probe reports events, not computed colour.

## Comments

### 2026-11-16 — closed

Landed in `b276cd66` (`feat(puck): carry a Button's variant look on its class`),
with the decision in `fc96f94d` and the glossary wording in `6653717a`.

- The render no longer resolves the variant: it emits the authored Typography
  and Decoration variables inline, and the root carries
  `puck-button-<variant>`. `variants.ts` keeps the name, the list, the default
  and the fallback for a stored value that is no longer one of the four.
- `puck-base.css` §4a holds one rule per variant, declaring the desktop rung as
  Style variables only — no property, no `!important` — with the dictated hover
  for outline and ghost. The hover rule is unchanged.
- The panel's list is `BUTTON_VARIANTS`, shared with the resolver, so a variant
  the panel offers always has a rule the stylesheet paints.
- One decision taken with the user: a Variant declares the desktop rung only. An
  authored value is inline and outranks the class at every rung, so a value
  written on a wider Breakpoint is inherited by the narrower ones, as in every
  other block; the variant is not re-materialized per rung. The stylesheet, the
  test that reads it and the glossary state this.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm test` 264 files / 2340 tests passed;
  `npm run check:doc-citations` 92 docs, 0 broken citations.
- Hand check done by the user: the four variants read correctly in the canvas
  and on the published page. No browser probe.

