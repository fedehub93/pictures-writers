# 01: Replace ProductFAQ with the generic Faq model and migrate data

**What to build:**
Update `prisma/schema.prisma`: replace the `ProductFAQ` model with a generic `Faq` model (`id`, `question`, `answer`, `sort`, optional `productId` and `postId`), add `faqs Faq[]` to `Post`, switch `Product.faqs` to `Faq[]`, add indexes on both FKs and cascade deletes. Create the migration that copies existing `ProductFAQ` rows into `Faq` and runs `prisma generate`.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `Faq` model exists with optional FKs to `Product` and `Post`, `onDelete: Cascade`, `@@index` on both FK columns.
- [x] `Post.faqs` and `Product.faqs` both refer to `Faq`.
- [x] Existing `ProductFAQ` rows migrated 1:1 into `Faq` with correct `productId` and `postId = null`; table dropped.
- [x] Migration is checked in and `npx prisma generate` succeeds.

## Comments

- Implemented and committed by the agent: `d599903` `feat(faq): replace ProductFAQ with generic Faq model and migration` (+ `1a3d665` trailing-newline cleanup).
- Migration `prisma/migrations/20260916120000_replace_product_faq_with_generic_faq/migration.sql` copies `ProductFAQ` rows into `Faq` (same `id`/`question`/`answer`/`sort`/`productId`, `postId` null) before dropping `ProductFAQ`. Final DDL matches Prisma's own `migrate diff` output exactly.
- `npx prisma validate` and `npx prisma generate` succeed; fresh typecheck and lint pass.
- To keep the build green, the `db.productFAQ` consumer switches were done here too (see `02-product-persistence.md` comments): `src/lib/product.ts` and the versions PATCH route now use `db.faq` with unchanged delete-then-create semantics.
- **Not yet applied**: the migration has not been deployed. Per spec, it should be verified against a copy of production-like data before deploy.