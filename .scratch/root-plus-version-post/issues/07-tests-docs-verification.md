# 07: Tests, docs, and verification

**What to build:** The Post migration is covered by integration tests and the full suite is green, with the domain docs finalized.

**Blocked by:** 06 — Admin UI and public rendering.

**Status:** done

## Acceptance criteria

- [x] Integration tests on `postsRouter` cover create, in-place edit, fork-on-live edit, publish, unpublish, concurrent publish, `getVersions`, scheduling, delete, and `getMany` (default order, explicit sorts, search).
- [x] A migration test asserts one root per logical post, reused ids, repointed editorial relations/SEO, and resolved slug collisions.
- [x] Existing post tests that assumed the legacy model are updated or removed.
- [x] `CONTEXT.md` states *Post* = logical identity, *Post version* = revision, and the corrected *Root*/*Version* definitions.
- [x] `content-versioning-debt/note.md` drops `Post` from the legacy list.
- [x] An ADR (0013) records the Post Root + Version decision.
- [x] `npm run build`, `npm run lint`, and `npm run test:run` pass; `npx tsc --noEmit` is clean. — `tsc --noEmit` clean and `test:run` green; `build` compiles and finishes TypeScript (full prerender needs seeded content plus the one-way Post migration applied to the target DB); `lint` reports only the repo's 52 pre-existing errors, none in the files added here (identical count to the baseline).

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Model the integration tests on `src/modules/pages/server/__tests__/page-root-version.test.ts`.

## Comments

Closed the blog migration with the missing migration test and router-level scheduling coverage; the docs/ADR were already in place from earlier tickets and are verified here.

- **Migration test.** New `src/modules/blog/__tests__/post-root-version-migration.test.ts` replays `20261008141035_add_post_root_and_version/migration.sql` against a throwaway schema seeded with legacy `Post` rows, so the destructive cut-over can be exercised without touching the migrated public schema (dropping the schema cleans up). It asserts one `PostRoot` per logical post with the legacy group id reused, each `PostVersion` reusing the legacy row id with duplicated version numbers densely renumbered per root, `currentVersionId` = highest version / `liveVersionId` = the `PUBLISHED` row, `firstPublishedAt` on the root, slug collisions resolved deterministically (`shared` / `shared-1`), SEO carried onto each version, editorial relations (`PostCategory`, `PostAuthor`, `Faq`, `_PostVersionToTag`) repointed at `PostVersion`, and idempotency on a second run.
- **Router scheduling coverage.** New `posts-schedule.test.ts` exercises `postsRouter.schedule` / `reschedule` / `cancelSchedule` end to end (version status + `ScheduledAction` targeting `PostRoot`), complementing the library-level `scheduled-post.test.ts`.
- **Explicit sorts.** `posts-read.test.ts` now covers every value in `POST_LIST_SORTS`: `title` and `publishedAt` (pre-existing) plus `createdAt`, `updatedAt`, `scheduledAt` (nulls last) and `status`.
- **Existing tests.** No remaining test references the legacy `db.post`, `postAuthors`, or `postCategories`; the superseded/legacy suites were reconciled in tickets 04–06.
- **Docs.** `CONTEXT.md` defines *Post* (identity) / *Post version* (revision) and the corrected *Root*/*Version*; `content-versioning-debt/note.md`'s legacy list is down to `ProductCategory`/`Product`; ADR 0013 records the decision.
- **Verification.** `npx tsc --noEmit` clean; `npm run test:run` green (98 files, 821 tests). `npm run lint` reports the same 52 pre-existing errors / 265 warnings as the baseline (none in the files added here). `npm run build` compiles and finishes TypeScript, and page-data collection for the Post routes succeeds once a migrated database is used; a full prerender additionally needs seeded production content (the sitemap dereferences a product's category), and the target database must have the one-way Post migration applied — both deploy steps, unchanged from ticket 06.
