# 05: Product admin and public UI repoint

**What to build:** The admin product surface and the public shop pages work against `ProductRoot`/`ProductVersion`, with the same UX as before.

**Blocked by:** 03 — Product read paths; 04 — Create, edit, fork, publish, unpublish, SEO, and delete.

**Status:** done

## Acceptance criteria

- [x] Admin product list is one row per root with the current version's status/title, paginated/filterable via nuqs (`search | page | status | type | category`), using `DataTable` + `DataPagination` as in the blog.
- [x] Admin product detail loads the current version; the details form, gallery, extras, FAQ, SEO, and metadata forms save through the new procedures (forking when the current version is live).
- [x] The metadata editors (`metadata/ebook|service|affiliate|webinar`) operate on the version; `type` is shown as read-only from the root.
- [x] The product category select/filter bind to `category.id`/`categoryId` (no `rootId`).
- [x] Publish/unpublish actions use `{ id, rootId }` against the new procedures; the `StatusBox` and list status filter reflect the current version's status.
- [x] Embedded product / widget product / `use-product-root-id-query` / ads item content render the live version by root id (`getPublishedByRootId`, `getByRootIds`) without shape breakage.
- [x] Public shop pages (`/shop/[categorySlug]`, `/[productSlug]`, submission, download, checkout) read the live version and the de-versioned category (ticket 01).
- [x] `npx tsc --noEmit` and `npm run lint` are clean for the touched files.

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. The public pages stay server components with direct module queries (nuqs/Hydrate are admin-only). Follow the Post admin UI as the reference (`src/modules/blog/posts/ui`).

The admin and public surfaces were already shaped for the legacy model's `id`/`rootId` pair, so the repoint is mostly type plumbing: the four product pickers/widgets that still imported the dropped `Product` model (`select-product-modal`, `use-slash-command-modal-service`, the widget `product-type-form` and `popup/product-form`) now use a single `ProductListItem` type projected from `products.getMany`'s output (`src/modules/shop/products/types.ts`), and `columns` reuses it.

`products.getMany` gained an optional `publishedOnly` flag that lists roots with a live version and projects the live version. The product picker (`useProductsQuery`) and the reviews product options use it, so a product that has been edited after publishing (a `CHANGED` current version) stays selectable — the prior `status: PUBLISHED` filter keyed off the *current* version and silently dropped it.

Verified by the extended `products-router.test.ts` (`getMany` with `publishedOnly` returns the live version and excludes drafts). `tsc`/`eslint` are clean for the touched files; the `reviews`/`orders`/`forms` suites still reference the dropped `Product` model and remain red until ticket 06, as expected.
