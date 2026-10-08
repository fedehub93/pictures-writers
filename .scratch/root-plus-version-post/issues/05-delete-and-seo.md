# 05: Delete and SEO update for Post

**What to build:** Post deletion and SEO updates work through the new model without orphans.

**Blocked by:** 03 — Edit, fork, publish, and unpublish for Post.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Deleting a post removes the `PostRoot` and all its `PostVersion` rows (cascade).
- [ ] Deletion removes the versions' `PostCategory`, `PostAuthor`, `Faq`, and `_PostToTag` rows (cascade) and any `Seo` rows owned solely by those versions.
- [ ] `updateSeo` updates the SEO of the current version.
- [ ] SEO changes on a published post are staged on the current version and do not affect the live version until publish.
- [ ] No orphaned versions, relations, or SEO rows remain after deletion.
- [ ] The `remove` input remains the root id and deletes all revisions.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Mirror ticket 04 of the Page pilot (`delete-and-seo-update`).
