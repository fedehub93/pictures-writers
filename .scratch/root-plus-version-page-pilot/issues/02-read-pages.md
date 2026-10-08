# 02: Read pages via Root+Version

**What to build:** Admin and public page reads resolve through `PageRoot` and `PageVersion`, while writes still use dual-write for safety.

**Blocked by:** 01 — Schema and backfill for Page Root+Version.

**Status:** done

## Acceptance criteria

- [x] `pagesRouter.getOne` reads from `PageRoot` + `PageVersion`.
- [x] `pagesRouter.getLastByRootId` returns the current version from the new schema.
- [x] `pagesRouter.getMany` lists one row per `PageRoot`, sorted and filtered as before.
- [x] `getPublishedPageBySlug` resolves `slug -> PageRoot -> liveVersion`.
- [x] Admin page list renders one row per logical page.
- [x] Public page rendering works for all existing slugs after migration.
- [x] Editor loads the current version of the selected page.

## Notes

See the parent spec at `.scratch/root-plus-version-page-pilot/spec.md`.
