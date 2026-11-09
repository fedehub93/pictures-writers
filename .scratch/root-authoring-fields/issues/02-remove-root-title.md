---
Status: ready-for-agent
Type: task
Blocked by: 01
---

# Remove the root title

## Goal

Delete the inert `title` prop from the editor root, so the properties panel does not offer a control that changes nothing.

## Acceptance criteria

- [ ] `RootProps` no longer declares `title`.
- [ ] `RootEditor.fields` no longer contains `title`, and no root config (page, header, footer) reintroduces it.
- [ ] `rootRenderConfig.fields` no longer declares `title` either.
- [ ] Documents saved with `root.props.title` still load, save and publish unchanged; the stray value is ignored, not stripped.
- [ ] No migration, no backfill, no schema change.
- [ ] Tests updated: `header-sticky-root.test.ts` and `layout-visibility.test.tsx` assert `title` is absent and `dimension` remains.
- [ ] `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build` pass.

## Implementation notes

- `src/puck/root/index.tsx`, `src/puck/root/types.ts`, `src/puck/render-config.tsx`.
- Puck's `Render` still reads `root.props.title` internally as a fallback document title, so keeping the stored value is harmless.
- Do not add a replacement "name" field: a Page's identity is its title on the version, and a region's identity is `SITE_REGION_LABELS` plus the admin list.

## Out of scope

- Removing other inert fields, root naming, region labels.
