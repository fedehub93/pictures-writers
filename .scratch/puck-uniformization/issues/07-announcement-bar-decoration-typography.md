# 07: Migrate Announcement bar to shared decoration and typography

**What to build:** The Announcement bar gains the shared decoration, typography and dimension fields. Background, border, radius and opacity come from decoration; text colour, size, alignment and line height come from typography; spacing and sizing come from dimension. The two hand-rolled colour selects and their props are removed, and the default primary background with primary-foreground text is preserved. Dismissible behaviour, edit-mode visibility, smart-link rendering and the hide-on-empty-text rule are unchanged.

**Blocked by:** 01.

**Status:** done

- [x] Background, border, radius and opacity come from decoration; text colour and type come from typography; spacing and sizing come from dimension.
- [x] The `backgroundColor` and `textColor` props and their colour selects are removed.
- [x] The default look remains the primary background with primary-foreground text and the current small centred type.
- [x] Dismissible storage behaviour, edit-mode visibility, resolved and unresolved links, and the empty-text rule are unchanged.
- [x] Tests assert the decoration and typography variables alongside the existing behavioural assertions.
- [x] Type check, lint and the test suite pass.

## Implementation notes

- `AnnouncementBar` now exposes `dimension`, `typography` and `decoration`; the hand-rolled `backgroundColor`/`textColor` selects, their `buildColorOptions` import and the `COLOR_OPTIONS` constant were removed.
- `defaults.ts` stores the previous look as `ANNOUNCEMENT_DEFAULT_DIMENSION`, `ANNOUNCEMENT_DEFAULT_TYPOGRAPHY` and `ANNOUNCEMENT_DEFAULT_DECORATION`. The dimension defaults replace the old `w-full min-h-8 px-10 py-1.5` utilities because `.puck-dim` resets those properties; the typography defaults keep `text-xs leading-tight text-center` and `text-primary-foreground`, and the decoration default keeps `bg-primary`.
- `render.tsx` builds the style object with `getDimensionVars` + `getTypographyVars` + `getDecorationVars` and passes it to the UI. The same defaults are applied as render fallbacks, because Puck merges `defaultProps` in the editor canvas only, not in the public `<Render>`.
- `AnnouncementBarBlockUi` applies the shared `puck-dim puck-typo puck-deco` classes and the responsive variables; the old `bg-primary`/`text-primary-foreground` classes and inline colour styles are gone. Dismissal, edit-mode visibility, link degradation and the empty-text early return were left untouched.
- The UI link prop keeps accepting both the stored SmartLink and the resolved `{ label, href }` shape produced by the public resolver; the block props stay on the SmartLink contract.
- `announcement-bar-block.test.tsx` renders through `renderAnnouncementBarBlock`: it asserts decoration, typography and dimension variables (including tablet values), the default primary palette and small centred type, the stored defaults, the field migration, the resolved `{ label, href }` shape, and all previous behavioural cases.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, the three affected test files, the full `npm run test:run` (219 files / 1822 tests) and `npm run build` pass. Repository-wide `npm run lint` still reports 40 pre-existing errors and 244 warnings in unrelated files, including the errors already noted in ticket 01; none are in the Announcement bar or its tests.
