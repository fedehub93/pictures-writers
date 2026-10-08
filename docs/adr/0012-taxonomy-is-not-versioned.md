# Taxonomy is not versioned

**Status**: accepted

Content versioning carries `rootId`, `version`, `status`, `isLatest`, `firstPublishedAt`, and `publishedAt` on every entity it touches, plus a per-entity `create-new-version` path and `publish`/`unpublish` procedures. That machinery is built for content that is long, substantial, and edited often, where a draft must not touch the live site and history is worth keeping. ADR 0011 split `Page` into `PageRoot` + `PageVersion` to validate the pattern; the remaining entities were expected to follow.

`Category` and `Tag` do not fit that shape. A category or tag is a small, stable record — `title`, `slug`, `description`, and `Seo` — that is rarely edited and has no meaningful "draft revision" or "version that was live last month". Carrying versioning for taxonomy bought duplicated rows, an overloaded `isLatest`, two-phase list queries, near-duplicate per-entity `create-new-version` code, and dead UX (`CHANGED`/`SCHEDULED` states and publish controls on a category). Nobody previews a draft category rename, so the version boundary protects nothing.

We **exclude taxonomy from versioning** and model `Category` and `Tag` as single-row, directly-editable entities:

- One row per logical category/tag: `id`, `title`, `slug @unique`, `description?`, `seoId?`, `userId?`, `createdAt`, `updatedAt`. The versioning columns and `@@index([rootId])` are dropped; `userId` stays as a plain creator reference.
- `slug` becomes the stable public identity and gains a `@unique` constraint. Because the existing slugs are not unique, the collapse migration resolves collisions deterministically (numeric suffix) before adding it.
- Edits apply immediately — there is no draft, publish, or unpublish step. `Seo` stays a one-to-one relationship on the row, so the existing SEO form keeps working.
- `PostCategory.categoryId` points at `Category.id` and the `Post ↔ Tag` m2m points at `Tag.id`; the post side is unchanged until `Post` itself is migrated.
- The migration is a **collapse**, not a split: each `rootId` group is merged into its canonical revision (the `isLatest = true` / `PUBLISHED` row, else the highest `version`), post links are repointed onto the survivor and de-duplicated, orphaned `Seo` rows are removed, then the versioning columns are dropped and the unique slug constraint added. It is idempotent and one-way; rollback means restoring a pre-deploy backup.

## Consequences

- Admin taxonomy lists show one row per item with no status column, status filter, or publish/unpublish actions. `getMany` becomes a single `findMany` (`distinct-root` workaround gone).
- Public reads resolve `slug → Category`/`Tag` directly; category and tag URLs stay stable because the slug is the identity.
- `Category` and `Tag` leave the Root + Version backlog; only `Post`, `Product`, and `ProductCategory` remain.
- `ContentStatus` is retained (still used by `Post`, `Product`, `ProductCategory`); it is simply no longer referenced by taxonomy.
- Taxonomy becomes the cheapest, lowest-risk migration of the remaining set and can precede `Post`/`Product` to build confidence. Because it is a collapse there is no dual-write phase — schema and code move together in one deploy, verified against the test database first.

## Considered options

- **Keep versioning for taxonomy** for model uniformity: rejected — uniformity with a model that does not fit the entity is not a benefit worth the duplicated rows, two-phase queries, and dead UX.
- **Split taxonomy into Root + Version like `Page`**: rejected — the extra indirection protects nothing when there is no draft/live distinction.
- **Slug history / redirects, soft delete, or version history for taxonomy**: out of scope. A stable unique slug already preserves public URLs across edits.

Partially supersedes ADR 0011 (`Split the Page model into PageRoot + PageVersion`), which listed `Category` and `Tag` among the entities intended to follow the split. The rule this establishes: **versioning is for long, frequently edited content; taxonomy is a set of stable system entities.**
