# 04: Create, edit, fork, publish, unpublish, SEO, and delete for Product

**What to build:** Editors manage products through the root/version model, with forking on live edits, per-version SEO, and safe concurrent publish — mirroring the Post server layer.

**Blocked by:** 02 — Product schema, backfill, and cut-over.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] `create` builds a `ProductRoot` + a `DRAFT` version 1 (`type` on the root) + a self-owned `Seo` in one transaction.
- [ ] Editing the current version updates it in place when it is not the live version, replacing gallery/extras/FAQs only when supplied.
- [ ] Editing the live version forks a new `CHANGED` version (`max(version) + 1`) copying content, gallery, extras, FAQs, `categoryId`, and a **cloned** `Seo`; repoints `currentVersionId`; the live version is untouched.
- [ ] `updateSeo` acquires the root lock, forks when the current version is live, and updates/clones the version's own `Seo` (no shared-row mutation).
- [ ] `publish` acquires a row-level lock on `ProductRoot`, demotes the previous live version to `CHANGED`, promotes the target to `PUBLISHED`, sets `publishedAt` and `liveVersionId`, and sets `firstPublishedAt` on the root only on first publication; `revalidateContent("product")` runs.
- [ ] `unpublish` clears `liveVersionId` and moves the version to `CHANGED`.
- [ ] `remove` deletes the root, cascading versions, editorial relations, and orphaned `Seo`.
- [ ] `products/lib/create-new-version.ts` is deleted; Post-style helper files replace it (`create-product.ts`, `save-product.ts`, `publish-product.ts`, `lock-root-products.ts`, `product-seo.ts`, `delete-product.ts`).
- [ ] Metadata type-mismatch validation still rejects a version whose `metadata.type` differs from the root's `type`.

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. Mirror `src/modules/blog/posts/lib/save-post.ts`, `publish-post.ts`, `create-post.ts`, `post-seo.ts` and `src/modules/pages/server/`. Serialize publish/unpublish/edit on the root lock added in ticket 02.
