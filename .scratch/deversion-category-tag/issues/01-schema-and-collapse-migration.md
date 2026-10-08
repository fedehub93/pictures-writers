# 01: Schema and collapse migration for Category and Tag

**What to build:** `Category` and `Tag` are single-row entities with a unique slug; existing versioned rows are collapsed into one row per logical item, links are repointed, versioning columns are dropped.

**Blocked by:** None (can start immediately).

**Status:** done

## Acceptance criteria

- [x] `Category` and `Tag` models are `{ id, title, slug @unique, description?, seoId?, userId?, createdAt, updatedAt }`; `version`, `rootId`, `isLatest`, `status`, `firstPublishedAt`, `publishedAt`, and `@@index([rootId])` are removed (`userId` is kept as a plain creator reference).
- [x] `PostCategory.categoryId` references `Category.id`; the `Post ↔ Tag` relation references `Tag.id`; `postId` is unchanged.
- [x] The migration resolves slug collisions deterministically before adding the `@unique` constraint.
- [x] The migration collapses each `rootId` group to its canonical row (the `isLatest = true` / `PUBLISHED` row, else the highest `version`), reusing the survivor's id.
- [x] `PostCategory` rows and `_PostToTag` join rows that referenced deleted rows are repointed to the survivor.
- [x] `Seo` rows owned solely by deleted rows are removed; the survivor's SEO is kept.
- [x] The migration is idempotent and one-way; rollback is documented as restoring a pre-deploy backup.
- [x] `npx prisma generate` succeeds (the taxonomy code/tests that still reference the removed columns are updated in tickets 02-04).

## Notes

See the parent spec at `.scratch/deversion-category-tag/spec.md`. Verify the implicit M2M join table/column names (`_PostToTag`, columns `A`/`B`) against the actual migration before repointing.
