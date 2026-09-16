# 02: Switch product write + admin form to the Faq model

**What to build:**
Point the product persistence and admin UI at the new `Faq` table: `src/lib/product.ts` (`createNewVersionProduct`), `src/app/api/admin/shop/products/[rootId]/versions/[productId]/route.ts` (PATCH), `src/app/(admin)/admin/(routes)/shop/products/[rootId]/page.tsx` (select), `src/app/(admin)/admin/(routes)/shop/products/[rootId]/_components/product-form.tsx` (initial data mapping), and the `faqs` field-name references in `src/schemas/product.ts`. Delete-then-create semantics and inline accordion form stay as today.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `db.productFAQ` references replaced with `db.faq` in both write paths; create payloads set `productId` per version.
- [ ] Admin product page selects `faqs` from `Faq` and seeds `product-form` default `faqs` unchanged.
- [ ] Saving a draft product persists FAQ; publishing creates a CHANGED version whose FAQ rows point to the new version id.

## Comments

- Partial progress from issue `01` (done while keeping the build green after the schema rename): the two write paths now use `db.faq` — `src/lib/product.ts` (`createNewVersionProduct`) and `src/app/api/admin/shop/products/[rootId]/versions/[productId]/route.ts` (PATCH). Delete-then-create semantics unchanged; `productId` still points to the current version id.
- Remaining here: admin product page `faqs` select in `src/app/(admin)/admin/(routes)/shop/products/[rootId]/page.tsx` and `product-form.tsx` default values (both already read the generated `Faq` data via `faqs`, so mostly verification).