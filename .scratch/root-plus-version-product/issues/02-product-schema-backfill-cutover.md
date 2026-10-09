# 02: Product schema, backfill, and cut-over (ProductRoot + ProductVersion)

**What to build:** `Product` is split into `ProductRoot` + `ProductVersion`, every existing product/version is migrated (ids reused, durable references repointed to the root, slug collisions resolved), and the legacy `Product` table is dropped — all in one one-shot migration that runs after the category collapse.

**Blocked by:** 01 — De-version ProductCategory.

**Status:** done

## Acceptance criteria

- [x] `ProductRoot` is `{ id, slug @unique, type ProductType, firstPublishedAt?, currentVersionId @unique, liveVersionId? @unique, createdAt, updatedAt }` with `versions` and the two pointer relations.
- [x] `ProductVersion` is `{ id, rootId, version, status, title, tiptapDescription?, acquisitionMode, price?, discountedPrice?, isFree, metadata?, imageCoverId?, categoryId?, formId?, seoId?, userId?, publishedAt?, createdAt, updatedAt }` plus `gallery`, `extras`, `faqs`, with `@@unique([rootId, version])` and `@@index([rootId])`.
- [x] The legacy `Product` model, its self-relation `RootChildren`, `@@index([rootId])`, and the dead `description` (Json) column are gone.
- [x] `ProductGallery`, `ProductExtra`, and `Faq.productId` reference `ProductVersion.id`.
- [x] `Reviews.productId`, `OrderItem.productId`, and `Purchase.productId` reference `ProductRoot.id`; `Purchase.productRootId` is dropped.
- [x] Inverse relations are renamed to `productVersions` on `User`, `Media`, `Form`, and `Seo`; `ProductCategory.productVersions` replaces `products`.
- [x] The migration reuses each legacy `Product.id` as `ProductVersion.id` and each `rootId` as `ProductRoot.id`; `currentVersionId` = highest `version` (renumbered densely per root), `liveVersionId` = the single `status = 'PUBLISHED'` row (else null), superseded `PUBLISHED` rows become `CHANGED`; `firstPublishedAt` = earliest `publishedAt` among published rows; root `slug` from the live row when published, else the current row; the shared `Seo` is carried onto every version.
- [x] Durable references are repointed version id → root id (`Reviews.productId`, `OrderItem.productId`, `Purchase.productId`).
- [x] Slug collisions are resolved deterministically (numeric suffix) before adding `@unique`.
- [x] The migration is guarded on the legacy `Product.rootId` column (idempotent) and one-way; rollback is documented as restoring a pre-deploy backup.
- [x] `acquireRootLock`'s `RootLockTable` union in `src/shared/lib/lock-root.ts` includes `"ProductRoot"`.
- [x] `npx prisma generate` succeeds. (`tsc`/`build` are expected to be red until tickets 03–05 land, as in the Post migration.)

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. Model the SQL on `prisma/migrations/20261008141035_add_post_root_and_version/migration.sql`; the extra work versus Post is the durable-reference remap and dropping `Purchase.productRootId`. Verify the exact legacy FK constraint names and the `rootId` semantics (first row's id equals `rootId`) before repointing.

Verified by `product-root-version-migration.test.ts` against a legacy-shaped throwaway schema: one root per logical product with ids reused (`ProductRoot.id = COALESCE(rootId, id)`, `ProductVersion.id = Product.id`), duplicate versions renumbered densely, pointers filled (current = highest version, live = the single `PUBLISHED` row), superseded `PUBLISHED` revisions demoted to `CHANGED`, the shared `Seo` and category link carried, durable references (`Reviews`/`OrderItem`/`Purchase`) repointed to the root, `Purchase.productRootId` dropped, slug collisions suffixed, and the legacy `Product` table dropped. `prisma migrate diff` reports no difference between the migrated database and `schema.prisma`. Cross-module reads and the create/edit/publish layers are expected to stay red until tickets 03–05.

**Deviation — `firstPublishedAt` comes from the legacy `firstPublishedAt` column, not `publishedAt`.** The criterion reads "earliest `publishedAt` among published rows"; the migration uses `MIN("firstPublishedAt") FILTER (WHERE "status" = 'PUBLISHED')`, exactly as the Post cut-over does. The two agree for every published product (legacy `publish` writes both together), but the column preserves the true first-publication date for a product that was published and later unpublished (legacy `unpublish` flips the row to `CHANGED`, leaving no `PUBLISHED` row), where a `MIN("publishedAt")` filter would silently drop it.
