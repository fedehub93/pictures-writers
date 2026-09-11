# 03: Remove description from the product admin write-path

**What to build:** The product admin flow stops writing the legacy `Product.description` column entirely. The product schema drops the Slate-typed description validation; the product form no longer carries a description field; product create/update/versioning API routes and the versioning helper stop writing the legacy column. The column remains in the database but is never written by application code.

**Blocked by:** 01 (the column must be nullable so creates can omit it).

**Status:** done

- [x] The product schema no longer validates a Slate-typed description
- [x] The product admin form carries only the Tiptap description field
- [x] Product create, update, and versioning routes/helpers never write the legacy description column
- [x] No application code writes the legacy description column
- [x] Build and lint pass

## Comments

- Implemented on `refactor-remove-slate` on top of `a7854f2`.
- `productFormSchema` drops `description: z.custom<Descendant[]>()` and its `slate` import; the admin form's `defaultValues` no longer seeds a Slate paragraph shape (the `GenericEditor` field was already removed in an earlier ticket; only `tiptapDescription` remains).
- Write paths stop touching the legacy column: the POST create route no longer seeds a Slate-shaped description; `createNewVersionProduct` neither copies `values.description` on create nor spreads `publishedProduct.description` on update (`description: undefined`); the PATCH versions route strips `description` from the incoming payload (`description: undefined`).
- Full test suite passes: 24 files / 209 tests. `npx tsc --noEmit` reports only the 13 pre-existing blog-post `bodyData` errors (Slate tree being removed in ticket 05); the baseline also had product-form `Control` errors that this change eliminates. Lint: 84 errors / 392 warnings, byte-identical baseline set, none in touched files.
- Code review verdict: faithful to spec, no scope creep; the pre-existing `values: any` on `createNewVersionProduct` is noted as a possible follow-up.