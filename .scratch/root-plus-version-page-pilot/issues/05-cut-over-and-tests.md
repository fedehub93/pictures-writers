# 05: Cut-over and integration tests

**What to build:** The old `Page` table and dual-write logic are removed, the codebase is fully migrated to Root+Version, and the new behavior is covered by integration tests. This ticket also updates the domain glossary and records the architectural decision.

**Blocked by:** 03 — Edit and publish Page versions, 04 — Delete and SEO update for Page Root+Version.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Old `Page` model and dual-write code are removed from the codebase.
- [ ] No references to the legacy `Page` model remain in queries, mutations, types, or UI.
- [ ] Integration tests on `pagesRouter` cover create, edit, publish, unpublish, concurrent publish, version history, and migration backfill.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run test:run` passes.
- [ ] `CONTEXT.md` is updated with the new versioning terms (`Root`, `Version`, `Live version`, `Current version`).
- [ ] An ADR is written under `docs/adr/` explaining the Root+Version choice and the Page pilot.

## Notes

See the parent spec at `.scratch/root-plus-version-page-pilot/spec.md`.
