# 05: Delete and SEO update for Post

**What to build:** Post deletion and SEO updates work through the new model without orphans.

**Blocked by:** 03 — Edit, fork, publish, and unpublish for Post.

**Status:** done

## Acceptance criteria

- [x] Deleting a post removes the `PostRoot` and all its `PostVersion` rows (cascade).
- [x] Deletion removes the versions' `PostCategory`, `PostAuthor`, `Faq`, and `_PostVersionToTag` rows (cascade) and any `Seo` rows owned solely by those versions.
- [x] `updateSeo` updates the SEO of the current version.
- [x] SEO changes on a published post are staged on the current version and do not affect the live version until publish.
- [x] No orphaned versions, relations, or SEO rows remain after deletion.
- [x] The `remove` input remains the root id and deletes all revisions.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Mirror ticket 04 of the Page pilot (`delete-and-seo-update`).

## Comments

Delete and SEO now run on `PostRoot` / `PostVersion`, mirroring the Page pilot.

- **`remove` is root-only.** The ticket-03 compatibility fallback that also accepted a version id is gone; `postsRouter.remove` takes the root id and delegates to `deletePostRoot({ rootId })`, which locks the root, cancels any pending `PUBLISH_POST` action, deletes it (cascading every `PostVersion`, `PostCategory`, `PostAuthor`, `Faq` and `_PostVersionToTag` link), then deletes each version's SEO row unless another entity still references it. The admin call sites (`PostsActions`, `PostIdView`) now pass `rootId` instead of the version id.
- **`updateSeo`** (`updatePostVersionSeo`) was already wired in ticket 03; it updates a non-live current version's SEO in place and forks a `CHANGED` version with a cloned, self-owned SEO when the current version is live, leaving the live metadata untouched until publish.
- **Tests.** New `src/modules/blog/posts/server/__tests__/posts-delete-seo.test.ts` (11 tests) exercises `postsRouter` as the seam: draft SEO edited in place, staged SEO on a published post (live version/SEO untouched), staged SEO going live on publish, NOT_FOUND, and remove cascading versions plus `PostCategory`/`PostAuthor`/`Faq`/`_PostVersionToTag` and the owned SEO rows while keeping a SEO row another version still references, canceling a pending action, rejecting a version id, and leaving no orphans. New file green; `posts-edit-publish`, `posts-read`, `post-read-paths`, `scheduled-post` suites still pass.
- **Remaining red (owned by later tickets).** Same five legacy files ticket 04 flagged: `publish-post.test.ts`, `post-slug-faqs.test.ts`, tags/categories router tests and the de-version migration test (ticket 07); the admin/public post UI still uses `postAuthors`/`postCategories` (ticket 06). `tsc` reports only those pre-existing errors; eslint is clean on every touched file.
