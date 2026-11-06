# 05: Migrate LinkList and Copyright to shared typography and dimension

**What to build:** LinkList and Copyright gain the shared typography and dimension fields and apply the shared style variables and classes. Their current appearance is preserved through defaults: the Copyright line keeps the small footer type size and the LinkList title keeps its semibold treatment. Link resolution, empty-row handling, the Copyright server renderer that reads the site name and year from Installation settings, and the database-free editor canvas are unchanged.

**Blocked by:** 01.

**Status:** done

- [x] LinkList and Copyright expose typography and dimension and apply the shared variables and classes.
- [x] The Copyright block defaults to the current small footer type size; the LinkList title remains semibold.
- [x] Resolved links, unresolved entity links, legacy resolved links, external new-tab links and empty rows behave exactly as before.
- [x] The Copyright public renderer still reads the site name from Installation settings, and the editor canvas stays database-free.
- [x] Tests assert the new style variables alongside the existing behavioural assertions.
- [x] Type check, lint and the test suite pass.

## Implementation notes

- LinkList and Copyright now declare `dimension` and `typography` in their prop types and editor field configs. Their renders emit `getDimensionVars`/`getTypographyVars` and the UI applies `puck-dim puck-typo` plus the inline variables.
- The LinkList title keeps `font-semibold`; its hard-coded `text-base` was removed so the block typography can flow through, with the shared typography pipeline preserving the previous 1rem size by default.
- The Copyright small footer type size lives in `Copyright/defaults.ts` and is used both by the block's `defaultProps` (editor field defaults and saved documents) and by the render fallback. The fallback matters because Puck's public `<Render>` does not merge component `defaultProps`, so documents saved without typography still render at the small size on the public site.
- `CopyrightServer` forwards `dimension` and `typography` alongside the Installation-derived site name; the editor canvas keeps calling the same pure render without a database dependency.
- Tests now render through each block's shared render: existing link-resolution/empty-row/copyright assertions are preserved, and new assertions cover the emitted typography/dimension variables, the semibold title, the rendered Copyright default and server forwarding.
- Verification: `npx tsc --noEmit`, targeted ESLint on the changed files (0 errors) and `npm run test:run` (219 files / 1812 tests) pass. The repository-wide `npm run lint` still reports the pre-existing errors in unrelated files.
