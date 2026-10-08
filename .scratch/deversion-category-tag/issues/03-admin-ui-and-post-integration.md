# 03: Admin UI and post-editor integration

**What to build:** Admin taxonomy screens drop versioning affordances, and the post editor selects categories/tags against the simplified entities.

**Blocked by:** 02 — Simplify taxonomy server and public queries.

**Status:** done

## Acceptance criteria

- [x] Category and tag lists show one row per item with no status filter, no status column, and no publish/unpublish actions.
- [x] Detail forms save directly (no draft/changed/publish UI); the SEO form still works.
- [x] `columns.tsx`, `actions.tsx`, `*-status-filter.tsx`, `*-list-header.tsx`, `data-table-features.ts`, and the `*-id-view.tsx` views are updated or removed accordingly.
- [x] The post editor's category and tag selectors continue to work end-to-end against `Category.id` / `Tag.id`.
- [x] `npm run build` passes.

## Notes

See the parent spec at `.scratch/deversion-category-tag/spec.md`.
