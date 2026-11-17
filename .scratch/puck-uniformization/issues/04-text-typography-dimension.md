# 04: Migrate Text to shared typography and dimension

**What to build:** The Text block exposes plain multi-line text, the shared dimension field and the shared typography field. Alignment, colour, font size, font weight, line height and letter spacing become responsive through the typography pipeline; width, height, margins and padding come from dimension. The hand-rolled alignment and colour props and their inline styles are removed, and the block keeps rendering a semantic paragraph with typed line breaks preserved.

**Blocked by:** 01.

**Status:** done

- [x] Text exposes text, dimension and typography; the old alignment and colour props are gone from the field config, the props and the render.
- [x] Typography and dimension render as responsive CSS custom properties through the shared style pipeline and the shared block classes.
- [x] The block still renders a semantic paragraph and preserves line breaks typed in the textarea.
- [x] The default look is unchanged when no typography is configured.
- [x] Tests assert the paragraph markup and the typography variables, including a breakpoint-specific value.
- [x] Type check, lint and the test suite pass.

## Implementation notes

- `Text` now exposes `text` (textarea), `dimension` and `typography`; the hand-rolled `align` and `color` fields, their `ALIGN_OPTIONS`/`buildColorOptions` imports and the default `align` prop were removed.
- `render.tsx` builds the style object with `getDimensionVars` + `getTypographyVars` and passes it to the UI, mirroring Heading so the editor canvas and the public render share one implementation.
- `TextBlockUi` renders a semantic `<p>` with the shared `puck-dim puck-typo` classes, the style variables inline, and Tailwind's `whitespace-pre-line` to keep line breaks typed in the textarea. With no typography configured the shared classes leave `font-size`, `color`, `font-weight`, `line-height`, `letter-spacing` and `text-align` inheriting from the surrounding block.
- `text-block.test.tsx` now renders through `renderTextBlock` and asserts the paragraph markup and shared classes, desktop typography variables plus a tablet `--fs-t` value, width/height/margin/padding dimension variables, the untouched default look, and that the field config exposes `text`, `dimension` and `typography` without `align`/`color`.
- The consolidated render-pipeline case for Text now passes dimension and typography instead of the removed props.
- Verification: `npx tsc --noEmit`, targeted `npx eslint` (0 errors), the two affected test files and the full `npm run test:run` (219 files / 1805 tests) pass. Repository-wide `npm run lint` still reports the pre-existing errors in unrelated files noted in ticket 01; none are in the Text block or its tests.
