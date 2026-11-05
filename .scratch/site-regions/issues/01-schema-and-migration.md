---
Status: done
Type: task
---

# Add SiteRegion and SiteRegionVersion to Prisma schema

## Goal

Create the database tables for versioned global Site regions.

## Acceptance criteria

- [x] `SiteRegionKey` enum exists with values `HEADER` and `FOOTER`.
- [x] `SiteRegion` model mirrors `PageRoot` but uses `key` (enum, unique) instead of `slug`.
- [x] `SiteRegionVersion` model mirrors `PageVersion` but belongs to `SiteRegion` and stores `puckData`.
- [x] A migration is generated and committed.
- [x] `npx prisma generate` runs cleanly.

## Hints

- Reuse the existing `ContentStatus` enum if present; otherwise define `SiteRegionStatus`.
- Keep relation names unique, e.g. `SiteRegionCurrentVersion` / `SiteRegionLiveVersion`.
- File: `prisma/schema.prisma`.

## Out of scope

- Seed data; covered by ticket 03.
- tRPC procedures; covered by ticket 02.

## Notes

`ContentStatus` was already present with `DRAFT/CHANGED/PUBLISHED/SCHEDULED`, so no new status enum was needed. No `PageEditorType` equivalent: a Site region is always Puck-edited, so the column would have been speculative generality.

The models are placed next to `PageRoot`/`PageVersion` in `prisma/schema.prisma` and reuse `/// [PuckData]` so `prisma-json-types-generator` types `puckData` as `PrismaJson.PuckData | null`.

`@@index([rootId])` is the leftmost prefix of `@@unique([rootId, version])`, so it is technically redundant; it is copied verbatim from `PageVersion` for consistency.

The spec says "one row per region key per Installation" but the data model has no `installationId` (an Installation owns its own database). `key @unique` is correct today; adding multi-tenancy inside one database would turn it into `@@unique([installationId, key])`.

The `///` doc comment references `CONTEXT.md` "Site region"; that glossary section exists only as an uncommitted working-tree edit on this branch.

## Comments

Implemented in commit `0c8c6595`.

- Migration `20261105115934_add_site_regions` creates the `SiteRegionKey` enum and both tables, with the 4 foreign keys and every index from the spec data model.
- `npx prisma validate` and `npx prisma generate` are clean; `prisma migrate diff --from-config-datasource --to-schema` against a migrated database reports no difference.
- `npx tsc --noEmit`, `npm run test:run` (197 files / 1656 tests) and `npm run build` pass. Repo-wide `npm run lint` still fails on 40 pre-existing errors in files this ticket does not touch.
- Review (standards + spec, in parallel) found no blocking issues: no missing fields, no scope creep beyond the two doc comments, migration SQL reproduces the schema exactly. The ADR for the decision is ticket 11.
