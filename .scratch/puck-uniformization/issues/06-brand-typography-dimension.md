# 06: Migrate Brand to shared typography and dimension

**What to build:** The Brand block gains the shared typography and dimension fields and applies the shared style variables and classes. The logo and site name continue to come from Installation settings with the existing overrides, the uppercase treatment stays a semantic class of the block, and the current site-name size, weight and letter spacing are preserved as defaults. The editor canvas remains database-free and the public path keeps its server renderer.

**Blocked by:** 01.

**Status:** done

- [x] Brand exposes typography and dimension and applies the shared variables and classes.
- [x] Site name and logo still come from Installation settings; the custom text and custom logo overrides are unchanged.
- [x] Uppercase remains a semantic class because typography does not express text transform; default size, weight and letter spacing preserve the current look.
- [x] The editor canvas stays database-free and the public path still reads settings through its server renderer.
- [x] Tests cover the new style variables and the existing settings-driven rendering.
- [x] Type check, lint and the test suite pass.

## Implementation notes

- Brand now declares `dimension` and `typography` in its prop types and editor field config. Its render emits `getDimensionVars`/`getTypographyVars`, and the UI applies `puck-dim puck-typo` plus the inline variables on the flex wrapper.
- The previous site-name look lives in `Brand/defaults.ts` as `BRAND_DEFAULT_TYPOGRAPHY` (`1.125rem`, line height `1.75rem`, weight `600`, letter spacing `0.1em`) and is used both by `defaultProps` and by the render fallback, because Puck's public `<Render>` does not merge component `defaultProps`.
- The hard-coded `text-lg font-semibold tracking-widest` classes were removed from the site-name span; `uppercase` stays as the block's semantic class because Typography does not express text transform.
- `BrandServer` forwards `dimension` and `typography` alongside the Installation-derived site name and logo; the editor canvas keeps calling the same pure render without a database dependency.
- Tests render through the shared render and keep the existing Installation-settings/custom-override assertions, with new assertions for responsive typography and dimension variables, the preserved default look, the uppercase class, and server forwarding.
- Verification: `npx tsc --noEmit`, targeted ESLint on the changed files (0 errors) and `npm run test:run` (219 files / 1818 tests) pass. The repository-wide `npm run lint` still reports the pre-existing errors in unrelated files.
