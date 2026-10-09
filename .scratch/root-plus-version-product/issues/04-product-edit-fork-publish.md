# 04: Create, edit, fork, publish, unpublish, SEO, and delete for Product

**What to build:** Editors manage products through the root/version model, with forking on live edits, per-version SEO, and safe concurrent publish — mirroring the Post server layer.

**Blocked by:** 02 — Product schema, backfill, and cut-over.

**Status:** done

## Acceptance criteria

- [x] `create` builds a `ProductRoot` + a `DRAFT` version 1 (`type` on the root) + a self-owned `Seo` in one transaction.
- [x] Editing the current version updates it in place when it is not the live version, replacing gallery/extras/FAQs only when supplied.
- [x] Editing the live version forks a new `CHANGED` version (`max(version) + 1`) copying content, gallery, extras, FAQs, `categoryId`, and a **cloned** `Seo`; repoints `currentVersionId`; the live version is untouched.
- [x] `updateSeo` acquires the root lock, forks when the current version is live, and updates/clones the version's own `Seo` (no shared-row mutation).
- [x] `publish` acquires a row-level lock on `ProductRoot`, demotes the previous live version to `CHANGED`, promotes the target to `PUBLISHED`, sets `publishedAt` and `liveVersionId`, and sets `firstPublishedAt` on the root only on first publication; `revalidateContent("product")` runs.
- [x] `unpublish` clears `liveVersionId` and moves the version to `CHANGED`.
- [x] `remove` deletes the root, cascading versions, editorial relations, and orphaned `Seo`.
- [x] `products/lib/create-new-version.ts` is deleted; Post-style helper files replace it (`create-product.ts`, `save-product.ts`, `publish-product.ts`, `lock-root-products.ts`, `product-seo.ts`, `delete-product.ts`).
- [x] Metadata type-mismatch validation still rejects a version whose `metadata.type` differs from the root's `type`.

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. Mirror `src/modules/blog/posts/lib/save-post.ts`, `publish-post.ts`, `create-post.ts`, `post-seo.ts` and `src/modules/pages/server/`. Serialize publish/unpublish/edit on the root lock added in ticket 02.

Implemented under `src/modules/shop/products/server/`: `create-product.ts`, `save-product.ts` (in-place draft edit vs. live fork, `forkProductVersion` reused by the SEO path), `update-seo.ts`, `publish-product.ts` (publish + unpublish), `delete-product.ts`, `lock-root-products.ts`, `product-seo.ts`, and `errors.ts` for tRPC mapping. `productUpdateSchema` gained an optional `extras` array (the `ProductExtra` rows were previously uneditable) so gallery/extras/FAQs can each be replaced only when supplied. `productsRouter` write paths were rewired to the new helpers; `remove` accepts either a root or a version id (the admin passes the current version's id).

Verified by the rewritten `products-router.test.ts` (44 tests) plus the unchanged `product-root-version-migration.test.ts` and `product-categories` suite: create root + DRAFT v1 + own Seo, in-place draft edit, SEO in place vs. fork, live fork copying gallery/extras/FAQs/category/cloned Seo, publish demote + `firstPublishedAt` once, two concurrent publishes, unpublish, `getMany` one-row-per-root, `getByRootIds`/`getPublishedByRootId` live resolution, cascade delete of versions/editorial relations/orphaned Seo, and metadata mismatch rejection. `tsc`/`eslint` are clean for the touched files. The `reviews`/`orders`/`forms` suites still reference the dropped `Product` model and remain red until ticket 06, as expected.
