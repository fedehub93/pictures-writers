# 03: Remove description from the product admin write-path

**What to build:** The product admin flow stops writing the legacy `Product.description` column entirely. The product schema drops the Slate-typed description validation; the product form no longer carries a description field; product create/update/versioning API routes and the versioning helper stop writing the legacy column. The column remains in the database but is never written by application code.

**Blocked by:** 01 (the column must be nullable so creates can omit it).

**Status:** ready-for-agent

- [ ] The product schema no longer validates a Slate-typed description
- [ ] The product admin form carries only the Tiptap description field
- [ ] Product create, update, and versioning routes/helpers never write the legacy description column
- [ ] No application code writes the legacy description column
- [ ] Build and lint pass