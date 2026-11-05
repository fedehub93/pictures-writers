---
Status: done
Type: task
---

# Create a Text block for Puck

## Goal

Add a plain paragraph block usable in pages, header and footer.

## Acceptance criteria

- [x] New block at `src/puck/blocks/Text/`.
- [x] Props: `text` (rich text or plain string), `align`, `color`.
- [x] Registered in the generic page config and in both region configs.
- [x] Renders semantic `<p>` markup.

## Hints

- Start simple: a textarea for `text` and selects for alignment/color.
- If rich text is needed later, migrate to TipTap; keep the prop schema forward-compatible.

## Notes

- `TextBlockProps.text` is typed as `ReactNode` while the editor field is a plain `textarea`, so the block can move to `RichTextField` without changing its public props or render function.
- `align` reuses the typography `AlignType` (`left | center | right | justify`); `color` is a select over the theme colors plus the shared palette, with a "Default" option that inherits the surrounding text color.
- The block renders one semantic `<p>`; `white-space: pre-line` keeps line breaks typed in the textarea visible.
- Registered in `renderComponentConfigs` (which feeds the page palette), in `SHARED_REGION_COMPONENTS` (Header and Footer render palettes), and in both editor configs (`config.tsx` and `custom-config.tsx`). Added to the custom editor sidebar and the Typography category.
- The admin-side per-region editor palette is not in this ticket; it is built with the admin UI (ticket 07). Both existing region configs are the render palettes.
- Tests: `text-block.test.tsx` covers semantic markup, alignment/color output and both editor registrations; `region-render-config.test.ts` locks `Text` into the page palette and both region palettes.
