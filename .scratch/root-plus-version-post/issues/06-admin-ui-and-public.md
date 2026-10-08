# 06: Admin UI and public rendering for Post

**What to build:** The admin post screens and the public post rendering read and write through the new model, with no legacy affordances.

**Blocked by:** 02 — Read paths, 03 — Edit/fork/publish, 04 — Scheduling, 05 — Delete and SEO.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] The post list shows one row per logical post with the previous default order (unpublished first, then `publishedAt` desc) and the existing status filter, columns, and publish/unpublish actions.
- [ ] The editor loads the current version and all forms (content, details, description, SEO, authors, categories, tags, image, FAQ) write to it.
- [ ] The schedule dialog schedules the current version.
- [ ] Public post rendering (`post-template`, sidebars, widgets, list views) reads the live version; the draft preview view reads the current version.
- [ ] Category/tag/author relation fields are `categories`/`authors` throughout.
- [ ] `npm run build` passes.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`.
