---
Status: done
Type: task
Blocked by: 04
---

# 05: The hover reads a real fallback chain

**What to build:** A Button answers the pointer at every breakpoint, not only at
desktop. Today the primary and secondary variants lose their background on hover
below 1024px — the box turns transparent instead of darkening — because the
state rule passes a comma list to a single `var()` fallback instead of nesting
the fallbacks. The rule is corrected, the hand acceptance that ticket 04 left
open is performed for all four variants, and a test fails on the pattern that
shipped so a future state cannot repeat it.

**Blocked by:** 04 — it repairs the rule that ticket introduced and finishes the
one acceptance criterion that ticket did not tick.

**Status:** done

## Acceptance criteria

- [x] Hovering a Button changes its background at desktop, tablet and mobile, in
      both the canvas and the published page. Primary and secondary no longer
      become transparent below the desktop breakpoint.
- [x] The corrected state chain keeps the existing precedence: a variant's
      hover value wins where it exists, then the state value inherited from a
      wider breakpoint, then a colour derived from the base background.
- [x] Primary and secondary still derive their hover from the colour the author
      painted at every breakpoint — desktop included — and outline and ghost
      still use the theme's hover surface.
- [x] No state rule declares a base variable, changes a box property, or adds a
      second transitioned property: the ticket 04 contract is unchanged.
- [x] A stylesheet test reads `puck-base.css` and fails on the shape that
      shipped — a single `var()` whose fallback is a comma-separated list —
      while accepting the nested chain. The existing hover test is extended
      rather than duplicated.
- [x] The appearance is accepted by hand for all four variants, at all three
      breakpoints, in the canvas and on the published page. This closes the
      criterion left unticked in 04.
- [x] Typecheck, lint and the full test suite pass.

## Notes

- Diagnosis, verified in Chrome against `puck-base.css` and the real theme
  tokens: at tablet and mobile the declaration was
  `var(--bgc-h-t, var(--bgc-h-d), color-mix(…))`. The fallback is everything
  after the first comma, so when `--bgc-h-t` is absent the substituted value is
  `var(--bgc-h-d), color-mix(…)` — two values for one property, invalid at
  computed-value time, and `background-color` falls back to its initial value.
  Outline and ghost escaped because they emit `--bgc-h-*` at every breakpoint.
  Desktop escaped because its rule has a single fallback.
- The fix is nesting: `var(--bgc-h-t, var(--bgc-h-d, color-mix(…)))`, and the
  same for the mobile rung. A throwaway CDP run confirmed all four variants at
  1280, 900 and 700 after the change.
- The reason this shipped: `button-hover.test.tsx` asserts that the state
  variables appear before `color-mix` in the declaration text, which is true of
  both the broken and the corrected value. A substring assertion cannot see a
  malformed chain; the structural guard is the part that closes the gap, and it
  belongs in the same file.
- No ADR: the naming contract and the read-only state in ADR-0043 are correct.
  This is a defect in one declaration, not a decision.
- Ticket 04 stays `done` with its comment intact. Its closure was accurate for
  what had been verified; the hand check it named is performed here, and this
  ticket's comment records it.

## Comments

- 2026-11-15 — Closed with `c36fcf15` (`fix(puck): nest the Button hover
  fallback chain`).

  The tablet and mobile hover rules nest each fallback in its own `var()`:
  desktop `var(--bgc-h-d, color-mix(…))`, tablet
  `var(--bgc-h-t, var(--bgc-h-d, color-mix(…)))`, mobile
  `var(--bgc-h-m, var(--bgc-h-t, var(--bgc-h-d, color-mix(…))))`. Precedence is
  unchanged — the variant's hover, then the wider breakpoint's state value, then
  the colour derived from the base background — and the base ladder inside the
  mix is untouched, so primary and secondary still derive from the authored
  colour at every rung while outline and ghost keep `--accent`. No rule under
  `:hover` declares a custom property or a second property, and the transition
  is still `background-color` only (§9 of `puck-base.css`).

  `button-hover.test.tsx` now reads the declaration as a chain instead of a
  substring. `varChain` parses the value into the state rungs and the tail,
  rejecting a `var()` with more than one top-level comma — the shipped shape
  `var(--bgc-h-t, var(--bgc-h-d), color-mix(…))` — while accepting
  `var(--bgc-h-t, var(--bgc-h-d, color-mix(…)))`. The existing "reads the
  state's variable ahead of the derived colour" test was extended in place to
  assert the chain at all three rungs; no second test was added. Red before the
  fix: the guard failed with "passes 2 values to one var(); each fallback must
  nest in its own var()".

  Acceptance, closing the hand check left open in 04: a throwaway CDP run
  hovered the four variants on the published page and in the builder canvas at
  1280, 900 and 700 (the canvas iframe was resized and its `innerWidth` read
  back as 1280/900/700). Every variant resolved to an anchor; the computed hover
  background was non-transparent and different from the base at every width on
  both surfaces:

  - primary: base `lab(54.5081 39.1499 38.3555)` → hover
    `color(srgb 0.705707 0.366921 0.244191)`;
  - secondary: base `lab(91.3205 -0.239193 5.28079)` → hover
    `color(srgb 0.812454 0.800228 0.757348)`;
  - outline and ghost: base `rgba(0, 0, 0, 0)` → hover
    `lab(91.3205 -0.239193 5.28079)`.

  The probe fixture and its published version were reverted with
  `npm run agent:seed`; ticket 04 is left untouched, as its note asks, and this
  comment is the record of the check it named.

  Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 260 files / 2289 tests pass.
