# 05: Product admin and public UI repoint

**What to build:** The admin product surface and the public shop pages work against `ProductRoot`/`ProductVersion`, with the same UX as before.

**Blocked by:** 03 — Product read paths; 04 — Create, edit, fork, publish, unpublish, SEO, and delete.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Admin product list is one row per root with the current version's status/title, paginated/filterable via nuqs (`search | page | status | type | category`), using `DataTable` + `DataPagination` as in the blog.
- [ ] Admin product detail loads the current version; the details form, gallery, extras, FAQ, SEO, and metadata forms save through the new procedures (forking when the current version is live).
- [ ] The metadata editors (`metadata/ebook|service|affiliate|webinar`) operate on the version; `type` is shown as read-only from the root.
- [ ] The product category select/filter bind to `category.id`/`categoryId` (no `rootId`).
- [ ] Publish/unpublish actions use `{ id, rootId }` against the new procedures; the `StatusBox` and list status filter reflect the current version's status.
- [ ] Embedded product / widget product / `use-product-root-id-query` / ads item content render the live version by root id (`getPublishedByRootId`, `getByRootIds`) without shape breakage.
- [ ] Public shop pages (`/shop/[categorySlug]`, `/[productSlug]`, submission, download, checkout) read the live version and the de-versioned category (ticket 01).
- [ ] `npx tsc --noEmit` and `npm run lint` are clean for the touched files.

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. The public pages stay server components with direct module queries (nuqs/Hydrate are admin-only). Follow the Post admin UI as the reference (`src/modules/blog/posts/ui`).
