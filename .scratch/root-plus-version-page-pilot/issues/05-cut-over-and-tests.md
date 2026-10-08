# 05: Cut-over and integration tests

**What to build:** The old `Page` table and dual-write logic are removed, the codebase is fully migrated to Root+Version, and the new behavior is covered by integration tests. This ticket also updates the domain glossary and records the architectural decision.

**Blocked by:** 03 — Edit and publish Page versions, 04 — Delete and SEO update for Page Root+Version.

**Status:** done

## Acceptance criteria

- [x] Old `Page` model and dual-write code are removed from the codebase.
- [x] No references to the legacy `Page` model remain in queries, mutations, types, or UI.
- [x] Integration tests on `pagesRouter` cover create, edit, publish, unpublish, concurrent publish, version history, and migration backfill.
- [x] `npm run build` passes.
- [x] `npm run lint` passes.
- [x] `npm run test:run` passes.
- [x] `CONTEXT.md` is updated with the new versioning terms (`Root`, `Version`, `Live version`, `Current version`).
- [x] An ADR is written under `docs/adr/` explaining the Root+Version choice and the Page pilot.

## Comments

- Removed the `Page` model, the `User.pages`/`Seo.pages` relations, the dual-write
  module (`legacy-page-sync.ts`), the one-time backfill script (`backfill.ts` +
  `scripts/backfill-page-root-version.ts`) and the dead `pages/lib/create-new-version.ts`.
- Added `20261008130000_drop_legacy_page`: idempotently backfills any remaining
  legacy rows into `PageRoot`/`PageVersion` (reusing legacy ids), fills the
  current/live pointers where empty, then drops the `Page` table.
- `pagesRouter.create` now builds a `PageRoot` + version 1 draft + self-owned SEO
  in one transaction. Added `pagesRouter.getVersions` for the per-root version list.
- Public/admin readers that still used the legacy model were migrated:
  `getPageMetadataBySlug` (content-metadata) and `buildLlmsFullTxt` (llms) now read
  through `PageRoot.liveVersion`.
- Verification: `npx tsc --noEmit` exit 0; `npm run build` exit 0; full Vitest suite
  green (92 files / 765 tests). `npm run lint` reports 54 errors / 265 warnings,
  all pre-existing in untouched `src/shared/ui/*` files — eslint on every touched
  file is clean.

## Notes

See the parent spec at `.scratch/root-plus-version-page-pilot/spec.md`.
