# 01: Make legacy content columns nullable

**What to build:** `Post.bodyData` and `Product.description` become nullable (`Json?`) in the Prisma schema so the code can stop writing them while the database keeps the columns for now. A Prisma migration makes the columns nullable in the database. The `/// [BodyData]` annotation is dropped so the schema no longer types these columns as Slate content. No other column is touched; `editorType` stays for now.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `Post.bodyData` and `Product.description` are `Json?` in the Prisma schema and no longer carry the Slate type annotation
- [ ] A Prisma migration is generated and the migration file is committed
- [ ] `npx prisma generate` succeeds
- [ ] Build and lint pass