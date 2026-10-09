# Split Product into ProductRoot + ProductVersion, and take ProductCategory out of versioning

**Status**: accepted

`Product` and `ProductCategory` were the last entities still on the legacy single-table versioning model: every revision was a row distinguished by `rootId`, `version`, `status`, and `isLatest`, with the root being one of its own rows. ADR 0011 split `Page`, ADR 0013 split `Post`, ADR 0012 took the blog's `Category`/`Tag` out of versioning entirely. This is the final step of that migration.

We treat the two entities differently, because they are different kinds of thing.

**`Product` becomes `ProductRoot` + `ProductVersion`**, mirroring `Post`:

- `ProductRoot` is the logical product. It owns the stable, unique `slug`, the immutable `type`, `firstPublishedAt`, `createdAt`/`updatedAt`, and the two pointers `currentVersionId` and `liveVersionId`. Durable references point at it: `Reviews`, `OrderItem`, `Purchase` (and the loose `AdItem.productRootId` / `Widget.metadata.products[].rootId`, which keep their keys), so a review is never orphaned by a new product revision and an order line names the logical product.
- `ProductVersion` is one revision. It owns the mutable content and every editorial relation — `title`, `tiptapDescription`, `acquisitionMode`, `price`, `discountedPrice`, `isFree`, `metadata`, `imageCoverId`, `categoryId`, `formId`, `userId`, `publishedAt`, plus `gallery`, `extras`, `faqs` — and a `version` integer scoped to its root. `Seo` is a separate one-to-one entity on the version (cloned on fork), replacing today's single `Seo` shared across every revision. The dead legacy `description` (Json) column is dropped.
- Public reads resolve `slug → ProductRoot → liveVersion`; the draft preview and admin reads use the current version. Editing a non-live current version updates it in place; editing the live version forks a new `CHANGED` version. Publishing acquires a row-level lock on the root, demotes the previous live version, promotes the target, and updates `liveVersionId`; `firstPublishedAt` is written on the root only at first publication.
- Migration is a **one-shot split**: create the new tables, move each legacy row into a `ProductVersion` (reusing row ids) under a `ProductRoot` (reusing the `rootId`), renumber duplicate versions densely, repoint `Reviews`/`OrderItem`/`Purchase` from version ids to the root, carry the shared `Seo`, resolve slug collisions deterministically, drop `Purchase.productRootId`, then drop the legacy `Product` table. There is no dual-write phase; rollback means restoring a pre-deploy backup.

**`ProductCategory` leaves versioning** (a collapse, like `Category`/`Tag` in ADR 0012):

- One row per category: `id`, `title`, `slug @unique`, `description?`, `seoId?`, `createdAt`, `updatedAt`. The versioning columns and `@@index([rootId])` are dropped, `publish`/`unpublish` and the per-entity `createNewVersion` disappear, and the `product-categories.publish` permission is removed. Edits apply immediately.
- The collapse runs **before** the product split, so `Product.categoryId` is first repointed from any category version row to the survivor and then carried onto `ProductVersion.categoryId` unchanged.

## Considered options

- **Split `ProductCategory` into Root + Version too**, for storefront uniformity with `Product`: rejected. A product category is the shop's taxonomy — the same shape as the blog's `Category`, which ADR 0012 already de-versioned. Versioning it buys duplicated rows, an overloaded `isLatest`, and dead publish/draft UX that protects nothing (nobody previews a category rename). The one cost of de-versioning — new categories going live immediately — is exactly how blog taxonomy behaves.
- **Keep the single shared `Seo` across product versions** (today's behaviour): rejected. It is a divergence from `Post`/`Page`, and mutating the shared row means an in-progress change can leak to the live site. Each version owns its own `Seo`, cloned on fork.
- **Keep `Reviews`/`OrderItem`/`Purchase` pointing at version rows**: rejected. Reviews are not cloned when a product is edited, so a new version silently orphans them; orders and purchases carry their own name/price snapshots and should reference the logical product, not a revision.
- **Global unique slug on `ProductRoot`** instead of per-category: chosen. The category lives on the version, so a `@@unique([categoryId, slug])` is not expressible on the root; the public URL already includes the category segment, and a stable global slug matches `Post`.
- **Add scheduling for products**: out of scope. Products keep `DRAFT`/`CHANGED`/`PUBLISHED`; `ContentStatus.SCHEDULED` is not produced for them.

## Consequences

- Admin product lists show one row per logical product (the root); the two-phase distinct-root `getMany` disappears and the default ordering is preserved through the shared comparator.
- The blog, pages, and shop are all on Root + Version except taxonomy; the `content-versioning-debt` note is closed — no entity remains on the legacy model.
- `Reviews`, `OrderItem`, and `Purchase` now aggregate by root, fixing the review-orphaning bug and making the order → product link point at the right id. `Purchase.productRootId` is dropped.
- `acquireRootLock`'s whitelisted table union grows with `"ProductRoot"`, so publish/unpublish/edit serialize the same way as `Page` and `Post`.
- External references (`AdItem.productRootId`, `Widget.metadata`, and the Tiptap product node's `productRootId`) keep working because `ProductRoot.id` reuses the legacy `rootId`.
- The cut-over is destructive and one-way: rolling back means restoring a database backup that predates the deploy.
