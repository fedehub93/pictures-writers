# 02: Read paths via PostRoot + PostVersion

**What to build:** Every public and admin read resolves through `PostRoot` and its current/live version; the admin list shows one row per logical post with the original ordering.

**Blocked by:** 01 — Schema, backfill, and cut-over.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] `getPublishedPostBySlug` resolves `slug → PostRoot → liveVersion` (null when never published).
- [ ] `getDraftPostBySlug` resolves `slug → PostRoot → currentVersion`.
- [ ] `getPublishedPostByRootId`, `getPublishedPostById`, `get-last-post-by-root-id`, building/paginated/filtered/grouped queries, and calendar queries read through root/current/live as appropriate.
- [ ] `postsRouter.getOne` returns the root with its current version; `getLastByRootId` returns the current version.
- [ ] `postsRouter.getMany` is a single `findMany` over `PostRoot` (with current version); it returns one row per post, supports search, explicit sorts (`title`, `status`, `publishedAt`, `scheduledAt`, `createdAt`, `updatedAt`), and default ordering "unpublished first, then `publishedAt` desc, `title` asc, `id` asc". The two-phase `distinct rootId` query is gone.
- [ ] `content-metadata`, `sitemap`, `llms`, and widgets read through the new models; `AdItem.postRootId`, `AdBlock.excludedPostIds`, `ScheduledAction.targetId`, and `Widget.metadata.posts[].rootId` are unchanged (they name `PostRoot.id`).
- [ ] `npx tsc --noEmit` reports no errors in touched files.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Generalize the list comparator in `src/shared/lib/list-sorting.ts` so it no longer assumes the legacy Post shape; `Product`/`ProductCategory` keep the old path until they migrate.
