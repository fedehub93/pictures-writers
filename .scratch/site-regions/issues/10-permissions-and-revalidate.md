---
Status: done
Type: task
Blocked by: 02, 07
---

# Add site_layout permission and global revalidation

## Goal

Gate Site region editing with a dedicated permission and ensure publish triggers layout revalidation.

## Acceptance criteria

- [x] New backoffice permission area `site_layout` with actions `read`, `update`, `publish`.
- [x] `ADMIN` role has all actions by default.
- [x] `EDITOR` role has all actions in the initial seed (can be restricted later per customer).
- [x] tRPC procedures from ticket 02 check the permission.
- [x] Admin UI from ticket 07 hides/disables actions based on permission.
- [x] `publish-site-region.ts` calls `revalidatePath("/", "layout")`.
- [x] `unpublish` also triggers revalidation.

## Hints

- Look at how `pages` permission is defined and enforced.
- The permission check should live in `src/modules/site-regions/server/procedures.ts`.

## Out of scope

- Removing existing static components.

## Comments

Implemented in commit `884cac16`.

- Added `SITE_LAYOUT_READ`, `SITE_LAYOUT_UPDATE` and `SITE_LAYOUT_PUBLISH` to `PERMISSIONS`; migration `20261105123000_add_site_layout_permissions` inserts the catalog rows and assigns all three to `ADMIN` and `EDITOR` idempotently.
- `getProcedurePermission` now remaps `siteRegions.create` to `site_layout.update`, resolving the ticket 02 follow-up: the area has no `create` action, and creating a root on first editor open is part of the update surface. All other procedures keep resolving through the existing `siteRegions` → `site_layout` alias in `protectedProcedure`.
- Admin UI gating: the list page requires `site_layout.read`; the editor route requires `site_layout.update` because opening it creates the region when missing. The "Edit layout" entry point and the editor Save button use `SITE_LAYOUT_UPDATE`; publish/unpublish buttons in both the list and the editor use `SITE_LAYOUT_PUBLISH`, so a read-only role sees statuses but no mutation controls.
- Revalidation was already implemented by ticket 02 in `publish-site-region.ts` (`revalidatePath("/", "layout")` plus the cache tag) for both `publish` and `unpublish`, including the no-op unpublish path. No change was needed, only verification.
- Tests: `authorization.test.ts` now locks the `create` remap; `site-regions-permissions.test.ts` asserts the three catalog keys exist and are assigned to `ADMIN` and `EDITOR`; `site-region-edit-action.test.tsx` covers the permission-gated edit link. `npx tsc --noEmit` clean, targeted ESLint clean, full suite `npm run test:run` passes (217 files / 1784 tests).
- Review deliberately kept the spec's underscore area name `site_layout` even though other areas use hyphens; the spec and existing sidebar/nav references use it consistently.

