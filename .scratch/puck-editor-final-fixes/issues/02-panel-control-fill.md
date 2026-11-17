# 02: Every panel control shares one fill

**What to build:** One fill token in `PANEL_CONTROL` — `bg-background
dark:bg-input/30`, the values the text primitives already use — applied to every
properties-panel control that owns its border: the text input, the select
trigger, the colour field, the unit input's group, the segmented control and
the block fields' textareas. A control then looks the same wherever it is
nested, because its fill does not come from the surface behind it. The picker
needs nothing: it is a `Button variant="outline"`, which already carries the
fill. The muted groups stay as they are; the panel's own `bg-sidebar` surface
stays as it is; the vendored primitives are not edited.

**Status:** done

- [x] `PANEL_CONTROL.fill` exists and is documented with the reason it does not
      inherit the surface, including that the dark half is the primitives'
      translucent tint rather than a second opaque colour.
- [x] It is not folded into `PANEL_CONTROL.box`: the unit input's inner `<input>`
      takes `box` and must not paint a second translucent layer.
- [x] `TextInput`, `PanelSelectTrigger`, `ValueColorInput`, the unit input's
      `InputGroup`, `SegmentedControl`, the custom aspect-ratio input and the
      three panel `Textarea`s (Copyright, the two menu-item descriptions) all
      carry the fill. The textareas take it through `PANEL_CONTROL.textArea`.
- [x] The picker is unchanged: its `Button variant="outline"` already carries
      the fill, and no `bg-transparent` override is added.
- [x] `bg-background` is no longer hardcoded at a call site where the token
      applies; no `bg-transparent` override is introduced anywhere.
- [x] No file in `src/shared/ui/` is edited.
- [x] `src/puck/__tests__/panel-control-size.test.tsx` asserts the fill on each
      control and the absence of `bg-transparent`, which `twMerge` would have
      removed. The textareas are asserted through a rendered `MenuItemEditor`
      plus the token the Copyright field takes.
- [x] `npm run lint`, `npm run typecheck` and the full test suite pass.
- [x] Browser probe: in light and dark, the controls in Decoration → Border,
      Spacing and Typography read as one family, and a control inside a
      `bg-muted/60` group keeps the same fill as one outside it.

## Comments

- 2026-11-17 — Implemented in `365d8dc6`. `PANEL_CONTROL.fill` is
  `bg-background dark:bg-input/30`; the controls that own their border apply it,
  and a new `PANEL_CONTROL.textArea` token carries it for the panel's two-row
  textareas. `CommandSelect` and the icon picker were left alone: the
  `outline` Button variant already declares both halves. ADR-0047 records the
  decision and `CODING_STANDARDS.md` states the rule a new control follows.
- Browser probe, `.env.agent` (light, then `dark` added on the document): after
  expanding Size, Spacing and Decoration, the 26 panel-owning controls report
  one computed `background-color` in the light theme — `lab(97.92 …)` — whether
  they sit on `bg-sidebar` or inside the `bg-muted/60` groups, and one value in
  dark too (`oklab(0.4336 … / 0.3)`). Before the change the same list mixed
  `rgba(0,0,0,0)` with the light fill.
- The `outline` Button variant also carries `dark:bg-input/30`, so the picker's
  assertion is a statement of the outcome, not a mutation guard; the
  discriminating class for the other controls is `bg-background`, because their
  primitives already ship the dark tint.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors; `npm run
  test:run` 271 files / 2400 tests passed, including 11 in
  `panel-control-size.test.tsx`; `npm run check:doc-citations` 94 docs, 0 broken
  citations.
