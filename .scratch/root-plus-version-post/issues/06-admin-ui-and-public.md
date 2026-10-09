# 06: Admin UI and public rendering for Post

**What to build:** The admin post screens and the public post rendering read and write through the new model, with no legacy affordances.

**Blocked by:** 02 — Read paths, 03 — Edit/fork/publish, 04 — Scheduling, 05 — Delete and SEO.

**Status:** done

## Acceptance criteria

- [x] The post list shows one row per logical post with the previous default order (unpublished first, then `publishedAt` desc) and the existing status filter, columns, and publish/unpublish actions.
- [x] The editor loads the current version and all forms (content, details, description, SEO, authors, categories, tags, image, FAQ) write to it.
- [x] The schedule dialog schedules the current version.
- [x] Public post rendering (`post-template`, sidebars, widgets, list views) reads the live version; the draft preview view reads the current version.
- [x] Category/tag/author relation fields are `categories`/`authors` throughout.
- [ ] `npm run build` passes — code-level gate met (`✓ Compiled`, `Finished TypeScript`), see comment: full prerender needs a migrated DB with production content.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`.

## Comments

Admin UI and public rendering now read and write exclusively through the
root/version model; the last `postAuthors` / `postCategories` accesses are gone.

- **Admin.** `columns.tsx` renders the version's `authors` relation (the list
  row already exposes them from `getMany`); `AuthorsForm`, `CategoriesForm` and
  `PostDetailsForm` read `initialData.authors` / `initialData.categories`. The
  editor already loads the current version (`getLastByRootId`) and every form
  writes `{ id: versionId, rootId }` through `posts.update`; the schedule dialog
  already acted on `post.id` (the current version) + `rootId`.
- **Public.** `post-template`, `post-list`, `post-list-grid`, `post-slug-view`,
  `post-draft-slug-view` read `post.authors` / `post.categories`. `PostBottom`
  already queried `PostAuthor` by version id, which stays valid.
- **Test reconciliation.** The build type-checks test files, so the legacy suites
  that still assumed `db.post` had to be reconciled to satisfy the build gate:
  `posts/lib/__tests__/publish-post.test.ts` (fully superseded by
  `posts-edit-publish`, `posts-delete-seo` and `scheduled-post`) was removed;
  `post-slug-faqs.test.ts` was ported to `createPostRoot`; the `categories-router`
  and `tags-router` suites seed a `PostRoot` + `PostVersion` instead of a legacy
  `Post`; and `deversion-category-tag-migration.test.ts` was removed — the
  taxonomy migration it replays references `_PostToTag` and `"Post"`, both dropped
  by the Post cut-over, so it can no longer run. This overlaps ticket 07's
  "existing post tests updated or removed"; 07 still owns the new Post migration
  test, docs and ADR.
- **Verification.** `npx tsc --noEmit` is clean; the full suite is green
  (96 files, 815 tests). `npm run build` now compiles and passes TypeScript; its
  remaining prerender steps depend on production content (the sitemap and
  `[...slug]` metadata assume seeded products/posts) and on the one-way Post
  migration being applied to the target database, which is a deploy step.

