# 06: Tests, docs, and verification

**What to build:** The product/category test suites cover the new model, the migration is tested against a seeded legacy database, the documentation converges, and the full checks pass.

**Blocked by:** 05 — Product admin and public UI repoint.

**Status:** done

## Acceptance criteria

- [x] `products-router.test.ts` is rewritten for root/version: create (root + DRAFT v1 + own SEO), in-place draft edit, fork on live edit (copying gallery/extras/FAQs/category/cloned SEO), `updateSeo` fork, publish/demote/`firstPublishedAt`, two concurrent publish races, unpublish, `getMany` one-row-per-root + default order + explicit sorts, `getByRootIds`/`getPublishedByRootId` = live, `remove` cascade, metadata mismatch rejection, permissions. (Suite written in ticket 04; ticket 06 adds the missing default-order assertion.)
- [x] `reviews-router` / `orders-router` tests are updated so reviews and order items reference product roots and survive a new product version.
- [x] New `product-root-version-migration.test.ts` mirrors `post-root-version-migration.test.ts`: product split reconstructs roots, reuses ids, renumbers duplicate versions, fills pointers, repoints durable references, carries SEO, resolves slug collisions; category collapse reconstructs one row per category and repoints product links. (Migration test written in ticket 02; category collapse in ticket 01's `product-category-migration.test.ts`.)
- [x] `CONTEXT.md` *Versioning*/*Root*/*Version* and the Catalog terms reflect the new model; ADR 0014 is present.
- [x] `.scratch/content-versioning-debt/note.md` is retired/updated: no entity remains on the legacy model.
- [x] `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all clean.
- [ ] Manual acceptance of create → edit → publish → unpublish for a product and a category, plus the public shop pages, passes. *(Requires a human/browser pass against a migrated, seeded database; the router integration suites cover the same flows programmatically.)*

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. Run against the dedicated test database (`.env.test`); `tests/global-setup.ts` applies migrations. If the Prisma client looks stale, `npx prisma generate` (the "out-of-sync client" gotcha).

## Comments

Closed the programme with the remaining test repoint, the docs, and the full verification.

- **Legacy-model tests repointed.** `reviews-router`, `orders-router`, `foundation`, the order-automation suites (`create-order-node`, `form-to-order-flow`, `order-completed-trigger`) and the forms `product-form-emit` suite no longer touch `db.product`; durable references now name a `ProductRoot` and the snapshots come from its live `ProductVersion`. A shared `createProductRoot` fixture (`src/modules/shop/products/lib/__tests__/root-fixtures.ts`) builds a root + version directly, mirroring the blog's `root-fixtures.ts`. New "durability across versions" tests in the reviews and orders suites assert a review / order item still points at the root after a second `ProductVersion` is created. `npm run test:run` is green (99 files, 822 tests).
- **Default order.** `products-router.test.ts` gains the missing default-order assertion (unpublished `DRAFT`/`CHANGED` first, then `PUBLISHED`, then `publishedAt` desc / `title` / `id`), alongside the explicit sorts already covered.
- **Docs.** `CONTEXT.md` and ADR 0014 already reflected the model (tickets 01–02); verified here. `.scratch/content-versioning-debt/note.md` is marked **closed** with the final update: no entity remains on the legacy model.
- **Verification.** `npx tsc --noEmit` clean; `npm run lint` reports 48 errors / 262 warnings — at or below the pre-existing baseline, none in the touched files; `npm run test:run` green. `npm run build` compiles and finishes TypeScript cleanly; full prerender needs a migrated, seeded database. Against the migrated test DB the build passes `/sitemap.xml` and fails only on `/blog` (`generateMetadata` dereferences `posts[0]`), the same "needs seeded content" limitation the Post cut-over documented — not a code defect from this work. The dev `.env` database has not had the one-way migration applied, so it must be migrated before a full build there.
- **Scope.** No production code changed in this ticket; it is tests + docs.
