# 01: Schema and backfill for Page Root+Version

**What to build:** The database can store pages as `PageRoot` + `PageVersion`, existing pages are migrated, and newly created pages are written to the new schema while the old `Page` schema still works.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Acceptance criteria

- [x] Prisma migration creates `PageRoot` and `PageVersion` with correct relations, unique constraints, and indexes.
- [x] `PageRoot` owns `slug` (unique), `firstPublishedAt`, `currentVersionId`, and `liveVersionId`.
- [x] `PageVersion` owns mutable content (`title`, `puckData`, `status`, `publishedAt`, etc.) and a sequential `version` number scoped to the root.
- [x] Backfill script creates one `PageRoot` for every existing `rootId` group in the old `Page` table.
- [x] Backfill moves every old `Page` row into a `PageVersion` and sets `currentVersionId` / `liveVersionId` correctly.
- [x] Page creation uses dual-write: it inserts both an old `Page` row and a new `PageRoot` + `PageVersion`.
- [x] Existing build, lint, and tests still pass.

## Notes

See the parent spec at `.scratch/root-plus-version-page-pilot/spec.md`.
