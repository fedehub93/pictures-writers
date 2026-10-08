# 02: Simplify taxonomy server and public queries

**What to build:** The `categories` and `tags` routers expose plain CRUD, and public reads resolve taxonomy by slug directly.

**Blocked by:** 01 — Schema and collapse migration for Category and Tag.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] `create` writes a single row (no `rootId`/`version` bootstrap).
- [ ] `update` mutates the single row in place; `create-new-version.ts` is deleted from both `blog/categories/lib` and `blog/tags/lib`.
- [ ] `updateSeo` writes the linked `Seo` row directly.
- [ ] `remove` deletes the row and its `Seo`, and clears `PostCategory` / tag links.
- [ ] `publish` and `unpublish` are removed from both routers.
- [ ] `getMany` is a single `findMany` (no distinct-root two-phase query, no `status` filter) with pagination, search, and sorting intact.
- [ ] `getOne` by `id` replaces `getLastByRootId`; admin navigation uses `id` instead of `rootId` (schemas, hooks, `prefetch`, `use-open-*`).
- [ ] `getPublishedCategoryBySlug` / `getPublishedTagBySlug` use `findUnique({ where: { slug } })` and drop `isLatest`/`firstPublishedAt`.
- [ ] `npm run lint` and `npx tsc --noEmit` pass on touched files.

## Notes

See the parent spec at `.scratch/deversion-category-tag/spec.md`.
