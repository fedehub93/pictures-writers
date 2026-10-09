# 01: De-version ProductCategory (schema, collapse migration, server, admin UI)

**What to build:** `ProductCategory` leaves the versioning model and becomes a single, directly-editable row with a stable unique slug — the shop equivalent of `deversion_category_tag` (ADR 0012). Existing categories are collapsed (not split), product links are repointed, and publish/unpublish disappear end to end.

**Blocked by:** None (can start immediately). This is the tracer bullet and must land before the product split.

**Status:** done

## Acceptance criteria

- [x] `ProductCategory` is `{ id, title, slug @unique, description?, seoId?, createdAt, updatedAt }`. The `rootId`/`root`/`rootChildren` self-relation, `@@index([rootId])`, and the `version`/`status`/`isLatest`/`firstPublishedAt`/`publishedAt` columns are gone.
- [x] `Seo.productCategories` remains the inverse relation; `ProductCategory.seoId` stays a one-to-one link on the row.
- [x] `Product.categoryId` references `ProductCategory.id` (unchanged target) and the migration repoints it off any non-surviving category revision.
- [x] Migration `…deversion_product_category` is a guarded, idempotent collapse: survivor per `rootId` group = `isLatest`/`PUBLISHED`/highest `version`; deletes the other rows and orphaned `Seo`; resolves slug collisions with a numeric suffix; drops the versioning columns and adds the unique slug index. One-way; rollback is documented as restoring a pre-deploy backup.
- [x] `product-categories/lib/create-new-version.ts` is deleted; `publish`/`unpublish` are removed from the router; `create`/`update`/`updateSeo` write one row directly.
- [x] `getMany` is a single `findMany` (no `distinct: ["rootId"]`, no status filter); `getOne`/`getLastByRootId` are replaced by an `id`-based lookup; `getPublishedProductCategoryBySlug` is a direct `findUnique({ slug })`; the dead `getDraftProductCategoryBySlug` is removed.
- [x] Permissions: `product-categories.publish` is removed from `src/shared/lib/permissions.ts` (mapping + catalogue), the RBAC/authorization tests, and any seed.
- [x] Admin UI: the category list has no status column/filter/publish controls; detail navigation uses `id` (not `rootId`); the product `category-select`/category filter bind to `category.id`/`categoryId`.
- [x] `product-categories-router.test.ts` is rewritten for the single-row model (create/update/updateSeo/remove/getMany/public-by-slug).
- [x] `npx prisma generate` succeeds. (`tsc` may stay red for product-side files until ticket 02.)

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. Model the collapse SQL on `prisma/migrations/20261008140000_deversion_category_tag/migration.sql`, substituting `ProductCategory` and the `Product.categoryId` link. This ticket must merge before ticket 02 so the product split carries an already-repointed `categoryId`.

Verified by `product-category-migration.test.ts` against a legacy-shaped throwaway schema: one row per `rootId` group (survivor = `isLatest`/`PUBLISHED`/highest `version`), products repointed onto the survivor, orphaned `Seo` removed, slug collisions suffixed, versioning columns dropped and the unique slug index added. `prisma migrate diff` reports no difference between the migrated database and `schema.prisma`.
