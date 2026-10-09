# Spec: Root + Version for Product, and de-version ProductCategory

## Problem Statement

`Product` and `ProductCategory` are the last two entities still on the legacy
single-table versioning model: every revision is a row distinguished by `rootId`,
`version`, `status`, and `isLatest`, with the root being one of its own rows.
That model conflates identity with revision, overloads `isLatest` between
"current version" and "live version", duplicates content and every related row
per revision, forces a two-phase `distinct rootId` query in the admin list, and
implements the publish dance slightly differently per entity.

`Product` specifically carries a shared `Seo` across all versions (unlike
`Post`/`Page`, which fork it), and its durable references point at *version*
rows: `Reviews.productId` is not cloned when a product is edited, so editing a
published product **orphans its reviews**; `OrderItem.productId` and
`Purchase.productId` also name a revision even though both already snapshot the
name/price they need.

`ProductCategory` is structurally the blog's `Category` — `title`, `slug`,
`description`, `Seo` — which ADR 0012 already removed from versioning. Carrying
`rootId`/`version`/`isLatest` and publish/unpublish for it is pure debt.

`Page` (ADR 0011), `Post` (ADR 0013), and taxonomy (ADR 0012) are done. This is
the final step: after it, **no entity remains on the legacy model** and the
`content-versioning-debt` note closes.

## Solution

`ProductCategory` **leaves versioning** (collapse), and `Product` is split into
`ProductRoot` + `ProductVersion`.

### ProductCategory (de-version)

- One row per logical category: `id`, `title`, `slug @unique`, `description?`,
  `seoId?`, `createdAt`, `updatedAt`. The `rootId`, `version`, `status`,
  `isLatest`, `firstPublishedAt`, `publishedAt` columns and `@@index([rootId])`
  are dropped.
- Edits apply immediately — there is no draft, publish, or unpublish step.
  `publish`/`unpublish` are removed from the router and the
  `product-categories.publish` permission is removed.
- `Product.categoryId` points at `ProductCategory.id`; the public category query
  becomes a direct `findUnique({ slug })`.
- The collapse migration runs **first**, mirroring `deversion_category_tag`.

### Product (Root + Version, mirroring Post)

- `ProductRoot` is the logical product: `id` (reuses the legacy `rootId`),
  `slug @unique`, `type`, `firstPublishedAt?`, `currentVersionId @unique`,
  `liveVersionId? @unique`, `createdAt`, `updatedAt`.
- `ProductVersion` is one revision: `rootId` (cascade), `version`, `status`,
  `title`, `tiptapDescription`, `acquisitionMode`, `price`, `discountedPrice`,
  `isFree`, `metadata`, `imageCoverId`, `categoryId`, `formId`, `seoId`,
  `userId`, `publishedAt`, plus `gallery`, `extras`, `faqs`;
  `@@unique([rootId, version])`. The dead legacy `description` (Json) column is
  dropped.
- **`type` lives on the root** (stable identity); the metadata discriminated
  union stays on the version.
- **`Seo` is per version**, cloned on fork (parity with Post/Page), replacing
  the single shared row.
- **Durable references point at the root**: `Reviews.productId`,
  `OrderItem.productId`, and `Purchase.productId` reference `ProductRoot`;
  `Purchase.productRootId` is dropped. `ProductGallery`, `ProductExtra`, and
  `Faq` stay version-scoped (their row ids are reused, only the FK target
  changes).
- Public reads resolve `slug → ProductRoot → liveVersion`; draft/admin reads use
  the current version. `AdItem.productRootId`,
  `Widget.metadata.products[].rootId`, and the Tiptap product node's
  `productRootId` keep their keys and still name the root.
- No scheduling for products (`ContentStatus.SCHEDULED` is not produced).

## User Stories

1. As an editor, I want to edit a published product without changing the live
   site, so that I can prepare changes safely.
2. As an editor, I want to publish the current version atomically, so that the
   live shop flips in one step.
3. As an editor, I want a product's gallery, extras, FAQs, SEO, and category
   link to be part of the version I am editing, so they draft and publish
   together with the content.
4. As an editor, I want the product list to show one row per logical product,
   with work-in-progress products first, so that I can see what needs attention.
5. As an editor, I want a category rename to save directly, with no draft/publish
   workflow, because taxonomy is simple.
6. As a site visitor, I want product and category URLs to stay stable across
   edits, so that bookmarks and rankings are preserved.
7. As a store owner, I want reviews and orders to keep pointing at the product
   after I edit it, so that editing a product does not detach its reviews.
8. As a developer, I want `Product` and `ProductCategory` out of the legacy
   model, so that no entity remains on it and the two-phase list query is gone.
9. As a developer, I want existing products and categories migrated
   automatically and without data loss.

## Implementation Decisions

- **Two ordered migrations.** `…deversion_product_category` (collapse) runs
  first, then `…add_product_root_and_version` (split), so the product split
  simply carries the already-repointed `categoryId` onto `ProductVersion`.
- **ProductCategory collapse.** Survivor per `rootId` group = `isLatest` /
  `PUBLISHED` / highest `version`; repoint `Product.categoryId` onto the
  survivor; delete the other rows and orphaned `Seo`; resolve slug collisions
  with a numeric suffix; drop the versioning columns and add the unique slug
  index. Guarded and idempotent, one-way.
- **Product split pointer rules** (mirroring the Post cut-over):
  `currentVersionId` = highest `version` (renumbered densely per root to satisfy
  `@@unique([rootId, version])`); `liveVersionId` = the single row with
  `status = 'PUBLISHED'`, demoting any other `PUBLISHED` rows to `CHANGED`;
  `firstPublishedAt` on the root = earliest `publishedAt` among published rows;
  root `slug` from the live row when published, else the current one. The shared
  `Seo` is carried onto every version.
- **Slug uniqueness.** `ProductRoot.slug` is globally `@unique` (the category
  lives on the version, so a composite unique is not expressible). Collisions
  are resolved deterministically during migration.
- **Concurrency.** Publish/unpublish/edit serialize on a row-level lock on
  `ProductRoot`, via the shared root-lock helper (extended with
  `"ProductRoot"`).
- **Admin list ordering.** A single `findMany` over `ProductRoot` (with its
  current version); the default order ("unpublished first, then `publishedAt`
  desc, `title`, `id`") reuses the generalized comparator; explicit column sorts
  stay supported.
- **Read paths.** `getPublishedProductBySlug` / `getProductMetadataBySlug` /
  `getPublishedProductByRootId` / `getPublishedProductsBuilding` /
  `getProductsPaginatedByFilters` resolve to the live version; `getMany`,
  `getOne`, `getLastByRootId`, `getByRootIds` adapt to root/current/live.
- **Cross-module reads.** `sitemap`, `llms`, `data/widget`, `data/webinars`,
  `mails`, order-service (`getFormOptions` and order item snapshots from the
  live version), the reviews product picker, `checkout`/`download`/`submission`
  routes, and the SEO deletion guards are repointed off the dropped `Product`
  model.
- **Module structure.** `products/server` adopts Post-style files
  (`create-product.ts`, `save-product.ts`, `publish-product.ts`,
  `lock-root-products.ts`, `product-seo.ts`, `delete-product.ts`);
  `lib/create-new-version.ts` is removed. `product-categories` loses
  `lib/create-new-version.ts` and its publish/unpublish procedures.
- **Category admin navigation** switches from `rootId` to `id`; the product
  category filter/select switches from category `rootId` to `categoryId`.

## Testing Decisions

- Tests exercise the `productsRouter` and `productCategoriesRouter` as the
  primary seam, integration-style against the real test database (no Prisma
  mocking), modeled on `post-root-version-migration.test.ts` and the existing
  shop router tests.
- Key scenarios:
  - Creating a product produces a root and a `DRAFT` version 1 with its own
    `Seo`; duplicate `type` metadata mismatches are rejected.
  - Editing a draft updates the current version in place; editing a published
    product forks a new `CHANGED` version (copying gallery, extras, FAQs, a
    cloned `Seo`, and `categoryId`) while the live version is unchanged.
  - Publishing promotes the target under a root lock and demotes the previous
    live version; `firstPublishedAt` is written once.
  - Unpublishing clears `liveVersionId`.
  - Two concurrent publish calls leave the root consistent.
  - `getMany` returns one row per product with the default order and supports
    explicit sorts; `getByRootIds` / `getPublishedByRootId` return the live
    version.
  - Reviews, order items, and purchases reference the root and survive a new
    product version.
  - Deleting a root cascades versions, editorial relations, and its SEO.
  - Product category: create/update/remove mutate a single row; `getMany` is a
    single `findMany`; the public query resolves by slug directly.
  - **Migration test**: the product split reconstructs one root per logical
    product, reuses ids, renumbers duplicate versions, fills the pointers,
    repoints durable references, carries SEO, and resolves slug collisions; the
    category collapse reconstructs one row per category and repoints product
    links.
- Final verification: `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, and
  `npm run build` clean, plus manual acceptance of
  create → edit → publish → unpublish and the public shop pages.

## Out of Scope

- Product scheduling (no `SCHEDULED`/`scheduledAt` for products).
- Version-history or rollback UI for products.
- Slug redirects / URL history.
- Soft delete / restore for products or categories.
- Renaming the Prisma `Reviews` model to `Review`.
- Removing the `ProductExtra` model (kept, version-scoped) or the legacy
  `Purchase` model (kept, retargeted to the root).
- Introducing public pagination for the shop.

## Further Notes

- This closes the content-versioning programme: `CONTEXT.md`'s *Versioning* term
  no longer lists remaining entities, and `.scratch/content-versioning-debt/`
  is retired.
- The decision is recorded in ADR 0014.
- Because it reuses ids and has no dual-write, the cut-over is one-way; rollback
  means restoring a pre-deploy backup. Both migration bodies are guarded so
  re-running them is a no-op.
