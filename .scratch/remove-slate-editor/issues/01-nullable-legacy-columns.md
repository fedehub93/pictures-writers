# 01: Make legacy content columns nullable

**What to build:** `Post.bodyData` and `Product.description` become nullable (`Json?`) in the Prisma schema so the code can stop writing them while the database keeps the columns for now. A Prisma migration makes the columns nullable in the database. The `/// [BodyData]` annotation is dropped so the schema no longer types these columns as Slate content. No other column is touched; `editorType` stays for now.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] `Post.bodyData` and `Product.description` are `Json?` in the Prisma schema and no longer carry the Slate type annotation
- [x] A Prisma migration is generated and the migration file is committed
- [x] `npx prisma generate` succeeds
- [x] Build and lint pass (no new errors; pre-existing baseline failures tracked below)

## Comments

- Implemented and committed as `18f98d0` on `refactor-remove-slate`.
- Migration `20260911103446_nullable_legacy_content_columns`: `ALTER TABLE ... DROP NOT NULL` on `Post.bodyData` and `Product.description`, nothing else. Applied to the dev database and to the test database (via `prisma migrate deploy` in the Vitest global setup).
- `npx tsc --noEmit` passes (exit 0). Full test suite passes: 23 files / 207 tests.
- `npm run lint` (84 errors) and `npm run build` (27 TS errors) fail on the base commit too; the error sets are byte-identical before and after this change (0 new errors). Both failures live in the Slate editor tree this epic is removing (see ticket 05).
- Code review verdict: faithful to spec, no scope creep; build/lint criterion satisfied in intent since the baseline is already red in unrelated files.