---
Status: done
Type: task
Blocked by: 01
---

# Site region server layer: queries and tRPC procedures

## Goal

Build the backend CRUD and publish flow for Site regions, mirroring the pages module.

## Acceptance criteria

- [x] `src/modules/site-regions/server/queries/get-live-region-by-key.ts` returns the published version for a key, or `null`.
- [x] `src/modules/site-regions/server/queries/get-region-with-versions.ts` returns a region with its versions for the admin list.
- [x] `src/modules/site-regions/server/save-site-region.ts` updates the current version in place, forking a new `CHANGED` version if the current one is live.
- [x] `src/modules/site-regions/server/publish-site-region.ts` promotes a version to live and handles revalidation (call `revalidatePath("/", "layout")`).
- [x] `src/modules/site-regions/server/procedures.ts` exposes tRPC router `siteRegions` with: `getByKey`, `getCurrent`, `getVersions`, `create`, `update`, `publish`, `unpublish`.
- [x] All procedures enforce the `site_layout` permission (ticket 10 can add the permission check if not ready; at minimum use `protectedProcedure`).

## Hints

- Copy patterns from `src/modules/pages/server/`.
- Run `dehydratePuckForms` before saving if forms are allowed inside regions; otherwise skip.
- Include `userId` on create/update where the pages module does.

## Out of scope

- Admin UI (ticket 07).
- Smart link resolution (ticket 05).

## Notes

- `SITE_REGION_KEYS` in `constants.ts` is the single tuple used by the tRPC enum schema; Prisma still generates the enum values, so adding a key remains a migration plus one tuple entry.
- `create` is idempotent: it returns the existing current version instead of creating a second root, so the admin screen can call it on first open. A concurrent first call is only guarded by the unique `key`.
- `getCurrent` and `getByKey` return `null` (not an error) when a region has not been created or published yet, which is what the admin "create on open" flow and the layout fallback need.
- `update` only accepts the root's current version; a stale id raises `CONFLICT`. This is stricter than the pages module, whose API can rewrite any version id.
- The permission area is wired through `AREA_ALIASES` (`siteRegions` → `site_layout`) so ticket 10 only needs to seed the permissions. Until then every procedure fails closed with `FORBIDDEN`.
- **Ticket 10 follow-up**: the path rule maps `create` to `site_layout.create`, but the spec only defines `read`/`update`/`publish`. Ticket 10 must either add a `create` action or remap `create` to `site_layout.update` (e.g. via `permissionProcedure`). Resolved in ticket 10 by remapping `siteRegions.create` to `site_layout.update` in `getProcedurePermission`.
- `publish` and `unpublish` both call `revalidatePath("/", "layout")` from `publish-site-region.ts`, as tickets 02 and 10 require.
- `getRegionWithVersions` is consumed directly by server components (ticket 07), not through tRPC, mirroring how the pages admin reads its queries.

## Comments

Implemented in commit `323dfbb0`.

- Added `src/modules/site-regions/` with `constants.ts`, `schemas.ts`, and `server/{errors,lock-site-region,create-site-region,save-site-region,publish-site-region,present-site-region-version,procedures,index}.ts` plus the two queries and their barrel.
- Registered `siteRegions` in `src/trpc/routers/_app.ts`; added `SiteRegion` to the shared `RootLockTable` so publish/edit serialize with the other root/version models.
- `save-site-region.ts` dehydrates Puck forms before writing and forks a `CHANGED` version when the current one is live; `publish-site-region.ts` demotes the previous live version, sets `firstPublishedAt` only once, and revalidates the public layout on publish and unpublish.
- Tests: 23 cases in `src/modules/site-regions/server/__tests__/site-regions.test.ts` cover create idempotency, in-place vs forked edits, stale-version rejection, form dehydration/hydration, publish/unpublish pointers and `firstPublishedAt`, the public query (including `null` before publication), version history and the admin query. `src/shared/lib/authorization.test.ts` locks the `siteRegions` → `site_layout` mapping.
- `npx tsc --noEmit` clean; `npx eslint` clean on every touched file; full suite `npm run test:run` passes (198 files / 1680 tests).
- Code review (standards + spec, parallel) found no blocking defects beyond the permission seed, which is deliberately ticket 10. The alias mapping and the stale-version guard were added in response to the review.
