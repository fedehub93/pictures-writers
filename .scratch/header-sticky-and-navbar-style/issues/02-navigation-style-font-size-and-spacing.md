---
Status: done
Type: task
---

# Navigation style: font size and item spacing

## Goal

Let an editor set the size of the navigation labels and the spacing between the entries, per Breakpoint, for both the desktop menu and the mobile sheet.

## Acceptance criteria

- [x] `NavbarBlock` exposes a **Navigation style** accordion with two `ValueUnitInput` controls: **Font size** (with the existing `FONT_SIZE_PRESETS`) and **Item spacing**.
- [x] Both values are responsive with the shared ladder: they are authored on the viewport selected in the editor, tablet inherits desktop and mobile inherits tablet.
- [x] Empty values keep today's rendering exactly: 14px inline labels, ~8px inline row spacing, 16px mobile sheet labels, 4px sheet row spacing.
- [x] `fontSize` sets every **link label**: top-level links, column/card triggers, dropdown and column links, mobile rows and mobile accordion triggers. Card titles/descriptions and the CTA keep their own sizes. The inline value is the resolved desktop/tablet/mobile cascade; the mobile sheet always uses the mobile value.
- [x] `itemSpacing` sets the gap between entries: the desktop top-level row (replacing the current `space-x-1` + `gap-1` combination with a single authored value) and the mobile sheet rows. The per-item `px-4` padding and the dropdown lists' own spacing are unchanged.
- [x] Values reach the DOM as responsive CSS custom properties on the navbar wrapper, consumed by the shared stylesheet with the desktop → tablet → mobile media ladder; no inline `font-size`/`gap` that cannot respond to the breakpoint.
- [x] The portaled mobile sheet receives the same variables (or an explicit equivalent) so the controls also affect the mobile menu, which otherwise sits outside the wrapper in the DOM.
- [x] Existing documents without `appearance` render unchanged, in both the canvas and the public site.
- [x] Tests cover: the field on the block config, the emitted variables and their cascade, the defaults when no values are authored, and the sheet receiving the values.
- [x] `npx tsc --noEmit`, targeted ESLint, `npm run test:run` and `npm run build` pass.

## Implementation notes

- **Field.** `NavbarStyleField` (`src/puck/blocks/NavbarBlock/style-field.tsx`) mirrors the Typography field: `usePuck` for the selected viewport, `cascadeViewportValues`, `PropHeader` + `ValueUnitInput`, wrapped in `withAccordionField("Navigation style", …)`. Clearing an input resets the breakpoint value instead of storing an empty string.
- **Data.** `NavbarAppearanceProps` and `appearance?: Responsive<…>` live on `NavbarBlockProps` / `NavbarBlockRenderProps`. `getNavbarAppearanceVars` (`lib/appearance.ts`) resolves the cascade through the shared `cascadeViewportValues` and emits `--nav-fs-d/t/m` and `--nav-gap-d/t/m` only for authored values.
- **CSS.** `.puck-nav` carries the defaults and the media ladder; `.puck-nav-row` owns the desktop gap and `.puck-nav-sheet-list` the sheet gap. `.puck-nav-label` is applied directly to every link label so the `text-sm` hard-coded in the shared `AccordionContent` cannot pin nested mobile column links.
- **Portaled sheet.** `SheetContent` gets `.puck-nav-sheet` plus the same variables, and always resolves the mobile value.
- **Margins.** The desktop row drops the primitive `space-x-1` with `space-x-0` and replaces `gap-1` with the authored single gap.

## Verification

- Implemented in commit `9e239ee7`.
- `npx tsc --noEmit`, targeted ESLint, full `npm run test:run` (1930 tests) and `npm run build` pass.

## Hints

- Add `NavbarAppearanceProps = { fontSize?: string; itemSpacing?: string }` and `appearance?: Responsive<NavbarAppearanceProps>` to `NavbarBlockProps` and `NavbarBlockRenderProps` (`types.ts`), then thread it through `render.tsx`, `server.tsx` and `ui/navbar-block.tsx`.
- Model the field on `TypographyField` (`src/puck/fields/typography/index.tsx`): `usePuck` for the current viewport, `cascadeViewportValues`, `PropHeader` + `ValueUnitInput`, wrapped in `withAccordionField("Navigation style", <TypeIcon …>, …)`. Keep it in `NavbarBlock`'s own folder (e.g. `style-field.tsx`) rather than the shared Typography field.
- Emit dedicated variables (`--nav-fs-d/t/m`, `--nav-gap-d/t/m`) instead of reusing `--fs-*`/`--rgap-*`, to avoid the `.puck-typo`/`.puck-layout` reset semantics. Resolve the cascade in the render and emit all three only when at least one breakpoint is authored, so the CSS defaults handle the untouched document.
- Add a `.puck-nav` rule to `src/puck/styles/puck-base.css` with the defaults and the same media ladder used by the rest of the file (`max-width: 1023px` / `767px`), and a `.puck-nav-sheet` rule for the portaled content.
- Remove the explicit `text-sm`/`text-base` from the link and trigger classes so they inherit the wrapper size. Do not remove the explicit sizes on `NavbarCard` (title `text-sm`, description `text-sm`/`text-xs`) or the button size on CTAs.
- `cn` uses `twMerge`, so `space-x-0` cleanly replaces the primitive's `space-x-1`; the authored gap can then be a single inline `gap`.
- Do not add `appearance` to `defaultProps`: Puck merges defaults in the canvas only, and the empty value is defined to mean "today's look" on both paths.

## Out of scope

- Text colour/weight for the labels, CTA sizing, card typography.
- Changing the dropdown/column list spacing.
