# 06: Tests, docs, and verification

**What to build:** The product/category test suites cover the new model, the migration is tested against a seeded legacy database, the documentation converges, and the full checks pass.

**Blocked by:** 05 — Product admin and public UI repoint.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] `products-router.test.ts` is rewritten for root/version: create (root + DRAFT v1 + own SEO), in-place draft edit, fork on live edit (copying gallery/extras/FAQs/category/cloned SEO), `updateSeo` fork, publish/demote/`firstPublishedAt`, two concurrent publish races, unpublish, `getMany` one-row-per-root + default order + explicit sorts, `getByRootIds`/`getPublishedByRootId` = live, `remove` cascade, metadata mismatch rejection, permissions.
- [ ] `reviews-router` / `orders-router` tests are updated so reviews and order items reference product roots and survive a new product version.
- [ ] New `product-root-version-migration.test.ts` mirrors `post-root-version-migration.test.ts`: product split reconstructs roots, reuses ids, renumbers duplicate versions, fills pointers, repoints durable references, carries SEO, resolves slug collisions; category collapse reconstructs one row per category and repoints product links.
- [ ] `CONTEXT.md` *Versioning*/*Root*/*Version* and the Catalog terms reflect the new model; ADR 0014 is present.
- [ ] `.scratch/content-versioning-debt/note.md` is retired/updated: no entity remains on the legacy model.
- [ ] `npx vitest run`, `npx tsc --noEmit`, `npm run lint`, and `npm run build` are all clean.
- [ ] Manual acceptance of create → edit → publish → unpublish for a product and a category, plus the public shop pages, passes.

## Notes

See the parent spec at `.scratch/root-plus-version-product/spec.md`. Run against the dedicated test database (`.env.test`); `tests/global-setup.ts` applies migrations. If the Prisma client looks stale, `npx prisma generate` (the "out-of-sync client" gotcha).
