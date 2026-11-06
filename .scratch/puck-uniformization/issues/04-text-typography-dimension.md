# 04: Migrate Text to shared typography and dimension

**What to build:** The Text block exposes plain multi-line text, the shared dimension field and the shared typography field. Alignment, colour, font size, font weight, line height and letter spacing become responsive through the typography pipeline; width, height, margins and padding come from dimension. The hand-rolled alignment and colour props and their inline styles are removed, and the block keeps rendering a semantic paragraph with typed line breaks preserved.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] Text exposes text, dimension and typography; the old alignment and colour props are gone from the field config, the props and the render.
- [ ] Typography and dimension render as responsive CSS custom properties through the shared style pipeline and the shared block classes.
- [ ] The block still renders a semantic paragraph and preserves line breaks typed in the textarea.
- [ ] The default look is unchanged when no typography is configured.
- [ ] Tests assert the paragraph markup and the typography variables, including a breakpoint-specific value.
- [ ] Type check, lint and the test suite pass.
