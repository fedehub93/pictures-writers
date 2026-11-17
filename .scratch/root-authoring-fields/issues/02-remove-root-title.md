---
Status: done
Type: task
Blocked by: 01
---

# Remove the root title

## Goal

Delete the inert `title` prop from the editor root, so the properties panel does not offer a control that changes nothing.

## Acceptance criteria

- [x] `RootProps` no longer declares `title`.
- [x] `RootEditor.fields` no longer contains `title`, and no root config (page, header, footer) reintroduces it.
- [x] `rootRenderConfig.fields` no longer declares `title` either.
- [x] Documents saved with `root.props.title` still load, save and publish unchanged; the stray value is ignored, not stripped.
- [x] No migration, no backfill, no schema change.
- [x] Tests updated: `header-sticky-root.test.ts` and `layout-visibility.test.tsx` assert `title` is absent and `dimension` remains.
- [x] `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build` pass.

## Implementation notes

- `src/puck/root/index.tsx`, `src/puck/root/types.ts`, `src/puck/render-config.tsx`.
- Puck's `Render` still reads `root.props.title` internally as a fallback document title, so keeping the stored value is harmless.
- Do not add a replacement "name" field: a Page's identity is its title on the version, and a region's identity is `SITE_REGION_LABELS` plus the admin list.

## Verification

- Implemented in commit `8f6709ca`.
- `npx tsc --noEmit`, targeted ESLint (only pre-existing `any` warnings), `npm run test:run` (240 files, 1980 tests) and `npm run build` pass.
- Root field assertions live in `header-sticky-root.test.ts`, `layout-visibility.test.tsx` and `root-surface-fields.test.tsx`.
- `dehydrate-puck-forms.test.ts` proves the save path keeps an unknown `root.props.title` (it clones the document and only edits Form blocks); load, publish and region migration also clone rather than rebuild `root.props`, so the stray value survives untouched.

## Out of scope

- Removing other inert fields, root naming, region labels.
