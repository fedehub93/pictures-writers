---
Status: done
Type: task
Blocked by: 02
---

# Admin UI for managing Site regions

## Goal

Add a backoffice section to list, edit, save and publish header/footer.

## Acceptance criteria

- [x] New admin route `src/app/(admin)/site-regions/page.tsx` lists Header and Footer with status, published version and actions.
- [x] Route `src/app/(admin)/site-regions/[key]/page.tsx` opens the Puck editor for the selected region.
- [x] Editor uses the region-specific Puck config (Header vs Footer palette).
- [x] Save and publish actions use the tRPC procedures from ticket 02.
- [x] Add a menu item under `/admin` labeled "Aspetto" or "Site layout".

## Hints

- Reuse `PuckEditor` from `src/puck/custom-config.tsx` but pass a different config object per region.
- You may need to refactor `PuckEditor` so it accepts a `config` prop.
- The initial load should call `getCurrent` (or `create` if the region does not exist) and hydrate forms.

## Out of scope

- Permission gating; covered by ticket 10.

## Comments

Implemented on branch `feat-site-region`.

- Routes live under `src/app/(admin)/admin/(routes)/site-regions/` so they serve `/admin/site-regions` while staying inside the existing admin route group.
- The list page reads both regions through `getRegionWithVersions` and shows status, current/published version, timestamps and publish/unpublish actions. A missing region stays in the list as "Not created" and is created on first open of the editor.
- The editor receives a region-specific Puck config from `src/puck/region-editor-config.tsx`, built from the same palette tuples used by the public renderer (`region-palettes.ts`). `PuckEditor` now accepts a `config` and a header slot; page editing keeps the previous page config.
- Save and publish/unpublish go through the ticket 02 tRPC procedures. Saving a live region forks a new version, so the editor header updates its local version id after each mutation instead of reusing a stale id.
- The Elements panel now derives its widgets from the active Puck config, so header and footer only expose their own palette.
- Added a "Site layout" item under Content in the admin sidebar, gated by `site_layout.read`. The permission seed remains ticket 10, so the item appears once that ticket lands.
- `dehydratePuckForms` accepts the broad `Data` type now: Site region documents legitimately contain blocks outside the page component map.
- Tests: `region-editor-config.test.ts` locks the editor palettes; `region-presentation.test.ts` covers missing/draft/changed/published summaries and badge variants. `npx tsc --noEmit` clean; targeted ESLint clean; full suite `npm run test:run` passes (210 files / 1745 tests). `npm run lint` still reports the repo's pre-existing 40 errors outside this change.
