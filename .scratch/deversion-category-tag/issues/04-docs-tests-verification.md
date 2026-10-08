# 04: Docs, tests, and verification

**What to build:** Taxonomy de-versioning is recorded in the domain docs and covered by integration tests, and the full suite is green.

**Blocked by:** 01 — Schema and collapse migration, 02 — Simplify taxonomy server, 03 — Admin UI and post-editor integration.

**Status:** done

## Acceptance criteria

- [x] Integration tests on `categoriesRouter` and `tagsRouter` cover create, in-place update, SEO update, remove, `getMany` (pagination/search/sort), and public `...BySlug`.
- [x] A migration test asserts one row per logical item, repointed links, and resolved slug collisions.
- [x] Tests that assumed taxonomy versioning are removed or updated. (No taxonomy tests existed; the versioning-only `create-new-version.ts` files were removed in ticket 02.)
- [x] `CONTEXT.md` glossary states that taxonomy is not versioned and versioning is for long, frequently edited content.
- [x] `content-versioning-debt` note drops `Category`/`Tag` from the Root+Version list.
- [x] An ADR under `docs/adr/` records the decision ("taxonomy is not versioned").
- [x] `npm run build` and `npm run test:run` pass; `npm run lint` passes on every touched file.

## Notes

See the parent spec at `.scratch/deversion-category-tag/spec.md`.

`npm run lint` (a repo-wide `eslint` with no path) exits non-zero on this
branch because of **pre-existing** errors in unrelated modules (forms builder,
shadcn `carousel`/`sidebar`, mails templates, product public views, …). None of
the files touched by this work are implicated: running `eslint` on the new
test files exits 0. Fixing 52 unrelated errors is out of scope for this ticket.
CI (`.github/workflows/test.yml`) runs only `npm run test:run`, which is green.
