# 03: Product read paths via ProductRoot + ProductVersion

**What to build:** Every public and admin read, and every cross-module read, resolves through `ProductRoot` and its current/live version; the admin list shows one row per logical product with the original ordering.

**Blocked by:** 02 — Product schema, backfill, and cut-over.

**Status:** done

## Acceptance criteria

- [x] `getPublishedProductBySlug` resolves `slug → ProductRoot → liveVersion` (null when never published); the `type = AFFILIATE` exclusion reads `type` from the root.
- [x] `getProductMetadataBySlug`, `getPublishedProductByRootId`, and `getPublishedProductsBuilding` resolve through root/live; `getProductsPaginatedByFilters` uses the version fields via the root.
- [x] `productsRouter.getOne` returns the root with its current version; `getLastByRootId` returns the current version; `getByRootIds` returns the live version for each root (keeping `id`/`rootId` in the shape for the ads item content and admin pickers).
- [x] `productsRouter.getMany` is a single `findMany` over `ProductRoot` (with current version); it returns one row per product, supports search, explicit sorts, and the default order "unpublished first, then `publishedAt` desc, `title` asc, `id` asc". The two-phase `distinct rootId` query and the Product-specific `list-sorting` path are gone. The `category` filter uses `categoryId`.
- [x] `src/app/sitemap.ts`, `src/lib/llms.ts`, `src/data/widget.ts`, `src/data/webinars.ts`, and `src/modules/mails/lib/mail.ts` read root/live instead of `isLatest`/`status` on `Product`.
- [x] Order-service: `getFormOptions` lists roots that have a live version, and order-item name/price snapshots are taken from the live version; `checkout`/`download`/`submission` routes and `src/actions/submit-product-form.ts` resolve the live version.
- [x] `docs/adr/...`-named SEO deletion guards (`delete-post.ts`, `delete-page.ts`) count `productVersion`/`productCategory` by `seoId`.
- [x] `npx tsc --noEmit` reports no errors in the read-path files touched here.

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. `buildListOrderBy` already supports a relation path from the Post migration; reuse it. Keep `AdItem.productRootId`, `Widget.metadata.products[].rootId`, and the Tiptap node's `productRootId` unchanged (they already name the root).
