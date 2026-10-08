# 03: Edit, fork, publish, and unpublish for Post

**What to build:** Editors can create, edit, and publish/unpublish posts through the root/version model, with forking on live edits and safe concurrent publish.

**Blocked by:** 01 — Schema, backfill, and cut-over.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] `create` builds a `PostRoot` + a `DRAFT` version 1 + self-owned `Seo` in one transaction.
- [ ] Editing the current version updates it in place when it is not the live version.
- [ ] Editing the live version forks a new `CHANGED` version (`max(version) + 1`) and repoints `currentVersionId`; the live version is untouched.
- [ ] `publish` acquires a row-level lock on `PostRoot`, demotes the previous live version to `CHANGED`, promotes the target to `PUBLISHED`, sets `publishedAt`, clears `scheduledAt`/`preSchedulingStatus`, and sets `liveVersionId`.
- [ ] `firstPublishedAt` is written on the root only on first publication.
- [ ] `unpublish` clears `liveVersionId` and moves the version to `CHANGED`.
- [ ] `getVersions(rootId)` returns the per-root version list.
- [ ] The shared root-lock helper is extracted and used by both `Page` and `Post`.
- [ ] `posts/lib/create-new-version.ts` is deleted.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Serialize `publish`/`unpublish`/edit on the root row lock, as `Page` does. Preserve the existing FAQ/tag/category/author copy semantics when forking a version.
