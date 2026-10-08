# Spec: De-version Category and Tag

## Problem Statement

`Category` and `Tag` currently carry the full content-versioning model: `rootId`,
`version`, `status`, `isLatest`, `firstPublishedAt`, `publishedAt`, a per-entity
`create-new-version.ts`, and `publish`/`unpublish` procedures. That machinery is
built for content that is edited often, is substantial, and needs drafts,
history, scheduling, and rollback.

Blog taxonomy is none of those things. A category or tag is a small, stable
record (`title`, `slug`, `description`, `Seo`) that is rarely edited and has no
meaningful notion of "a draft revision" or "the version that was live last
month". Carrying versioning for taxonomy costs us:

- **Duplicated rows and ambiguous `isLatest`**: the same overloaded flag the Page
  pilot removed from content, still noisy in taxonomy.
- **Two-phase list queries**: `getMany` selects distinct root ids first, then
  sorts/paginates over `id in (...)` (`src/shared/lib/list-sorting.ts` workaround).
- **Per-entity drift**: `blog/categories/lib/create-new-version.ts` and
  `blog/tags/lib/create-new-version.ts` are near-duplicates.
- **Migration tax**: every future Root+Version migration has to consider two more
  entities — and the taxonomy link tables — for no benefit.
- **Dead UX**: `CHANGED`/`SCHEDULED` states and publish controls that no one
  needs on a category.

The Root+Version split (ADR 0011) was justified for editorial content because it
solves a real problem (edit a published item without touching the live site,
publish atomically, keep history). For taxonomy, the version boundary protects
nothing: nobody previews a draft category rename. We therefore **exclude
taxonomy from versioning entirely** and model it as simple, directly-editable
entities.

## Solution

`Category` and `Tag` become single-row entities with a stable unique slug and no
revision model.

- One row per logical category/tag. `slug` becomes `@unique` and is the stable
  public identity.
- Remove `version`, `rootId`, `isLatest`, `status`, `firstPublishedAt`,
  `publishedAt`. Keep `id`, `title`, `slug`, `description`, `seoId`, `userId`,
  `createdAt`, `updatedAt`.
- Edits apply immediately; there is no draft/publish/unpublish step.
- `Seo` stays a one-to-one relationship on the row (as with `PageVersion`), so
  the existing SEO form keeps working.
- `PostCategory.categoryId` points at `Category.id` (no root). The `Post ↔ Tag`
  many-to-many points at `Tag.id`. The post-side of those links is unchanged
  until `Post` itself is migrated.
- Category/Tag are removed from the Root+Version backlog: only `Post`,
  `Product`, and `ProductCategory` remain.

This is a **collapse** migration, not a split: existing versions of the same
taxonomy item are merged into one row (the published/latest survivor), references
are repointed, and the extra rows are deleted.

## User Stories

1. As an editor, I want a category or tag rename to save directly, because
   taxonomy is simple and does not need a draft/publish workflow.
2. As an editor, I want the taxonomy list to show one row per item, with no
   `CHANGED`/`SCHEDULED` status noise and no publish/unpublish controls.
3. As an editor, I want to keep editing category/tag SEO as part of the same
   record.
4. As a site visitor, I want category and tag URLs to stay stable across edits,
   so bookmarks and rankings are preserved.
5. As a developer, I want taxonomy out of the versioning model, so the remaining
   Root+Version migrations concern only `Post`, `Product`, and `ProductCategory`.
6. As a developer, I want existing categories and tags migrated automatically
   and without data loss.
7. As a developer, I want the taxonomy list query to be a single, simple
   `findMany` without the distinct-root workaround.

## Implementation Decisions

- **Schema**: `Category` and `Tag` keep their table names and become single-row
  entities: `id`, `title`, `slug @unique`, `description?`, `seoId?`, `userId?`,
  `createdAt`, `updatedAt`. The `@@index([rootId])` and all versioning columns are
  dropped. `userId` is kept as a plain creator reference (it is not part of the
  versioning model).
- **Stable identity**: `slug` gains a `@unique` constraint. Because the current
  slugs are not unique, the migration must resolve collisions (append a numeric
  suffix, deterministically) before adding the constraint.
- **SEO ownership**: `Seo` remains a separate entity linked one-to-one to the
  category/tag row; `updateSeo` writes `Seo` directly instead of forking a new
  version.
- **Post-side links**: `PostCategory.categoryId` references `Category.id`; the
  `Post ↔ Tag` relation references `Tag.id`. `postId` and the join semantics are
  unchanged until `Post` is migrated to Root+Version.
- **Preview/draft**: none. There is no draft state for taxonomy; edits are live.
- **Procedures**: `publish`/`unpublish` are removed from the `categories` and
  `tags` routers. `getMany` becomes a single `findMany` (no distinct-root
  two-phase query, no status filter). `getLastByRootId` is replaced by `getOne`
  by `id`; admin navigation switches from `rootId` to `id`.
- **Public queries**: `getPublishedCategoryBySlug` / `getPublishedTagBySlug`
  become a direct `findUnique({ where: { slug } })`, dropping the `isLatest`
  filter and `firstPublishedAt` ordering.
- **Migration strategy**: an in-place collapse migration: for each `rootId`
  group keep the canonical row (the `isLatest = true` / `PUBLISHED` row, else the
  highest `version`), repoint `PostCategory` and the `_PostToTag` join to the
  survivor's id, delete the other rows and any SEO rows they solely owned, then
  drop the versioning columns and add the unique slug constraint. Idempotent and
  one-way; rollback means restoring a backup taken before the deploy.
- **`ContentStatus`**: the enum stays (still used by `Post`, `Product`,
  `ProductCategory`); it is simply no longer referenced by `Category`/`Tag`.

## Testing Decisions

- Tests exercise the `categoriesRouter` and `tagsRouter` as the primary seam,
  integration-style against the real database (no Prisma mocking), modeled on the
  existing blog router tests.
- Key scenarios:
  - Creating a category/tag produces exactly one row.
  - Updating a category/tag mutates the single row in place (no new row).
  - Updating SEO mutates the linked `Seo` row.
  - Removing a category/tag removes the row and its SEO, and clears
    `PostCategory` / tag links.
  - `getMany` returns one row per item, paginates, and supports sorting/search
    without the distinct-root query.
  - Public `...BySlug` returns the row for a given slug.
  - Migration collapse reconstructs one row per logical item, repoints links, and
    resolves slug collisions.
- Existing blog tests that assume versioning of taxonomy must be updated or
  removed.

## Out of Scope

- Migrating `Post`, `Product`, or `ProductCategory` to Root+Version.
- Changing the post editor's tag/category selection behavior beyond the FK
  target and the id-vs-rootId navigation change.
- Slug redirects / URL history for taxonomy.
- Soft delete / restore or version history for taxonomy.
- Adding an explicit `sort` to the tag relation (kept implicit M2M).

## Further Notes

- This makes taxonomy the cheapest and lowest-risk migration of the remaining
  set, and can be done before `Post`/`Product` to build confidence.
- Because it is a *collapse*, there is no dual-write phase (unlike the Page
  pilot): schema and code move together in one deploy, verified against the
  dedicated test database first.
- The decision should be recorded in an ADR and the `CONTEXT.md` glossary, and
  the `content-versioning-debt` note should be updated to drop `Category`/`Tag`
  from the Root+Version list. The rule to document: **versioning is for
  long, frequently edited content; taxonomy is a set of stable system entities.**
