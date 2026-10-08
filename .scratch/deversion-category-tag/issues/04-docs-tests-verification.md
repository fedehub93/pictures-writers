# 04: Docs, tests, and verification

**What to build:** Taxonomy de-versioning is recorded in the domain docs and covered by integration tests, and the full suite is green.

**Blocked by:** 01 — Schema and collapse migration, 02 — Simplify taxonomy server, 03 — Admin UI and post-editor integration.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Integration tests on `categoriesRouter` and `tagsRouter` cover create, in-place update, SEO update, remove, `getMany` (pagination/search/sort), and public `...BySlug`.
- [ ] A migration test asserts one row per logical item, repointed links, and resolved slug collisions.
- [ ] Tests that assumed taxonomy versioning are removed or updated.
- [ ] `CONTEXT.md` glossary states that taxonomy is not versioned and versioning is for long, frequently edited content.
- [ ] `content-versioning-debt` note drops `Category`/`Tag` from the Root+Version list.
- [ ] An ADR under `docs/adr/` records the decision ("taxonomy is not versioned").
- [ ] `npm run build`, `npm run lint`, and `npm run test:run` pass.

## Notes

See the parent spec at `.scratch/deversion-category-tag/spec.md`.
