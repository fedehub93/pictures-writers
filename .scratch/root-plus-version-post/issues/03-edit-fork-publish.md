# 03: Edit, fork, publish, and unpublish for Post

**What to build:** Editors can create, edit, and publish/unpublish posts through the root/version model, with forking on live edits and safe concurrent publish.

**Blocked by:** 01 — Schema, backfill, and cut-over.

**Status:** done

## Acceptance criteria

- [x] `create` builds a `PostRoot` + a `DRAFT` version 1 + self-owned `Seo` in one transaction.
- [x] Editing the current version updates it in place when it is not the live version.
- [x] Editing the live version forks a new `CHANGED` version (`max(version) + 1`) and repoints `currentVersionId`; the live version is untouched.
- [x] `publish` acquires a row-level lock on `PostRoot`, demotes the previous live version to `CHANGED`, promotes the target to `PUBLISHED`, sets `publishedAt`, clears `scheduledAt`/`preSchedulingStatus`, and sets `liveVersionId`.
- [x] `firstPublishedAt` is written on the root only on first publication.
- [x] `unpublish` clears `liveVersionId` and moves the version to `CHANGED`.
- [x] `getVersions(rootId)` returns the per-root version list.
- [x] The shared root-lock helper is extracted and used by both `Page` and `Post`.
- [x] `posts/lib/create-new-version.ts` is deleted.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Serialize `publish`/`unpublish`/edit on the root row lock, as `Page` does. Preserve the existing FAQ/tag/category/author copy semantics when forking a version.

## Comments

Implemented the Post root/version mutation layer, modeled on the Page pilot.

- **Shared root lock.** `src/shared/lib/lock-root.ts` exposes `acquireRootLock(tx, "PageRoot" | "PostRoot", id)` (a whitelisted table name, so the identifier is never caller-controlled). `acquirePageRootLock` and the post `acquireRootLock` are now thin wrappers over it.
- **Server layer.** `save-post.ts` (replaces `create-new-version.ts`, which is deleted along with its unit test) updates a non-live current version in place or forks a `CHANGED` `max(version)+1` version that copies content, categories, tags, authors, FAQs and a self-owned SEO row. `publish-post.ts` rewrites the workflow on `PostRoot`/`PostVersion` (root lock, demote previous live, promote, clear scheduling, `firstPublishedAt` once, invalidate the `ScheduledAction`) and adds `unpublishPostVersion`. New helpers: `create-post.ts`, `update-seo.ts`, `delete-post.ts`, `post-seo.ts`, `errors.ts`.
- **Router.** `create`, `update`, `updateSeo`, `publish`, `unpublish` and `getVersions` are wired to the helpers; `create` writes root + version 1 + SEO + author link (and the `ScheduledAction` when a future `scheduledAt` is supplied) in one transaction. `remove` now deletes by root (accepting a root or version id until the admin UI is repointed in ticket 06).
- **Tests.** `posts-edit-publish.test.ts` (19 tests) covers create, in-place edit, fork-on-live edit (including relation copy), publish/demote/`firstPublishedAt`, two publish races, unpublish and `getVersions`; green against the real database. The read-path and Page suites still pass.

Deviations / notes:
- `create` with a future `scheduledAt` still produces a `SCHEDULED` version 1 rather than `DRAFT`, preserving the existing "schedule a post from the calendar" creation flow. Ticket 04 owns scheduling semantics.
- `updateSeo` and `delete`/`remove` are implemented here (both were downstream of deleting `create-new-version.ts` and dropping `db.post` from `procedures.ts`); ticket 05 can refine and test them.
- `delete-page.ts` (SEO reference check) and `get-pages-grouped-by-root-id.ts` were repointed off the dropped `Post` model — leftovers from tickets 01/02 required for `tsc`.
- Still red at `tsc`, owned by later tickets: `posts/lib/schedule-post.ts`, the scheduler handler/`migration.ts` and its tests (ticket 04); admin/public post UI using `postAuthors`/`postCategories` (ticket 06); legacy post/scheduler/taxonomy tests (ticket 07).

