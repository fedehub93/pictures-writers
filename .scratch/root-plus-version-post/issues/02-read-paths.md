# 02: Read paths via PostRoot + PostVersion

**What to build:** Every public and admin read resolves through `PostRoot` and its current/live version; the admin list shows one row per logical post with the original ordering.

**Blocked by:** 01 — Schema, backfill, and cut-over.

**Status:** done

## Acceptance criteria

- [x] `getPublishedPostBySlug` resolves `slug → PostRoot → liveVersion` (null when never published).
- [x] `getDraftPostBySlug` resolves `slug → PostRoot → currentVersion`.
- [x] `getPublishedPostByRootId`, `getPublishedPostById`, `get-last-post-by-root-id`, building/paginated/filtered/grouped queries, and calendar queries read through root/current/live as appropriate.
- [x] `postsRouter.getOne` returns the root with its current version; `getLastByRootId` returns the current version.
- [x] `postsRouter.getMany` is a single `findMany` over `PostRoot` (with current version); it returns one row per post, supports search, explicit sorts (`title`, `status`, `publishedAt`, `scheduledAt`, `createdAt`, `updatedAt`), and default ordering "unpublished first, then `publishedAt` desc, `title` asc, `id` asc". The two-phase `distinct rootId` query is gone.
- [x] `content-metadata`, `sitemap`, `llms`, and widgets read through the new models; `AdItem.postRootId`, `AdBlock.excludedPostIds`, `ScheduledAction.targetId`, and `Widget.metadata.posts[].rootId` are unchanged (they name `PostRoot.id`).
- [x] `npx tsc --noEmit` reports no errors in the read-path files touched here.

## Comments

Implemented in `fd30083`. The read paths now run exclusively through `PostRoot` /
`PostVersion`: slug/public reads resolve to `liveVersion`, draft and admin reads to
`currentVersion`; `getMany` is one `findMany` over `PostRoot`; `content-metadata`,
`sitemap`, `llms`, `data/widget`, `latest-news` and the scheduler `calendar-query`
were repointed. `buildListOrderBy` gained an optional `relation` path so version
fields can be sorted from the root. Added `post-read-paths.test.ts` (query layer)
and `posts-read.test.ts` (router reads) — 11 tests, green.

Criterion 7 caveat: `postsRouter`'s **mutation** procedures (`create`, `updateSeo`,
`remove`, `unpublish`) still reference the dropped `db.post` (7 errors); those are
owned by tickets 03/05, and the remaining `db.post`/`postCategories` references in
admin/public components and legacy tests are owned by tickets 06/07. All files
whose read paths were migrated here are clean. Also deferred to ticket 03:
`getVersions(root)` (spec lists it for parity with `Page`).


## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Generalize the list comparator in `src/shared/lib/list-sorting.ts` so it no longer assumes the legacy Post shape; `Product`/`ProductCategory` keep the old path until they migrate.
