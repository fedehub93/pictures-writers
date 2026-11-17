# 02: Document migration

**What to build:** A one-off, idempotent utility converts every stored Puck document from the single `dimension` prop to the split `size` and `spacing` props. It covers all Page versions and all Site region versions, drafts and history alike, supports a dry run that writes nothing, and reports per document what it moved. It runs outside the request path and changes no database schema or API.

**Blocked by:** 01 (the prop names and the shape have to be final)

**Status:** done

- [x] The pure transform moves the eight spacing keys of every `dimension` object into a sibling `spacing` object, writes the remainder as `size`, and deletes `dimension`.
- [x] The transform is shape-based: it walks every object in the document and acts on any `props` object holding a `dimension` key, so the document root — which has props but no `type` — and blocks nested in slots and zones are all covered.
- [x] A `dimension` value that does not look like a responsive map (breakpoint keys) is preserved and reported as a warning instead of being rewritten or thrown away.
- [x] An object whose `dimension` holds no spacing key produced only `size`; no empty `spacing` object was written. *(Superseded in 03 — see the revision line and the last comment.)*
- [x] Revision in 03: an authored `dimension` writes both destinations even when one keeps no key, because the empty half is what keeps a block render default suppressed.
- [x] Running the transform twice produces the same document as running it once, and a second run reports no changes.
- [x] Unknown component types, unknown props and malformed component data are preserved or skipped without throwing, so one bad document cannot abort the run.
- [x] The runner scans every `PageVersion` and every `SiteRegionVersion`, reports scanned, changed, unchanged, skipped and failed rows plus the fields moved per document, isolates per-row failures, and writes nothing in dry-run mode.
- [x] The CLI entry point and the two npm scripts (`:dry-run` prints, the other writes) work against whichever `DATABASE_URL` is loaded.
- [x] Tests cover: a representative page document, a document root without a `type`, blocks nested in slots and zones, an already-migrated document, a malformed or non-responsive value, idempotency, both tables, the per-document report, dry-run writing nothing, a successful write and failure isolation.
- [x] No Prisma schema, tRPC procedure or publication change is introduced.
- [x] `npm run lint`, `npm run typecheck` and the full test suite pass.

## Implementation notes

- `src/puck/migrations/` holds the pure transform and the `server-only` runner, with the CLI in `scripts/` — mirroring `src/modules/site-regions/lib/migrate-puck-data.ts`, `src/modules/site-regions/server/migrate-site-region-documents.ts` and `scripts/migrate-site-region-puck-data.ts`, whose report and dry-run shapes are worth reusing.
- The runner needs two loops, one per table, over every row rather than only the current and live versions: a document restored from history must already be in the new shape, and the database should hold one shape once the run is done.
- Do not add a fallback read in the render path. Absence of a value means "inherit from the wider breakpoint", so a fallback would resurrect a margin an author deleted. The migration is the compatibility layer.
- The transform is value-based: no Prisma schema, tRPC procedure or publication code changes.

## Comments

- 2026-11-15 — Implemented in `2650c6cc`. `src/puck/migrations/migrate-size-spacing.ts` is the pure transform (`migrateSizeSpacing`): it walks every object, splits any `props.dimension` into `size` (the remainder) and `spacing` (the eight margin and padding keys), and deletes the old key. `src/puck/migrations/migrate-size-spacing-documents.ts` is the `server-only` runner (`migrateSizeSpacingDocuments`) over every `PageVersion` and `SiteRegionVersion`, with a per-row try/catch, a per-document report and dry-run support. `scripts/migrate-puck-size-spacing.ts` is the CLI, exposed as `puck:migrate-size-spacing` and `puck:migrate-size-spacing:dry-run`; both read the loaded `DATABASE_URL`.
- Choices worth knowing. Breakpoint names come from the canonical `BREAKPOINTS` table in `src/puck/utils/breakpoints.ts`, not a local copy. A rung that keeps no key of a destination is dropped rather than stored empty: an absent breakpoint and an empty one cascade identically, and the panel never writes an empty rung. A props object that already carries `size` or `spacing` alongside `dimension` (possible when the new editor saves a legacy document before the migration runs) keeps the new shape per key while a moved key fills the gap; a sibling that is not an object, a non-responsive `dimension`, and a rung that is not an object are preserved and warned. The report entry's `label` is the page slug or the Site region key, and `changes[].size` / `changes[].spacing` list the property names moved for each block (an empty `size` means that block's `dimension` held only spacing; `changes[].emptyMarkers` names the destinations written as `{}` by the ticket-03 revision).
- Verification: `npm run lint` 0 errors (265 pre-existing warnings), `npm run typecheck` 0, `npx vitest run` 264 files / 2324 tests passed (18 new in the two migration test files), `npm run check:doc-citations` 89 docs / 0 broken, `npx eslint` on the new files 0. Both npm scripts were run with `DATABASE_URL` pointed at the agent database (read-only dry run, then the write script): each scanned 1 page version, 0 Site region versions, 0 changes, 0 failures, and issued no update. No real document was written by this ticket; ticket 03 owns the write against the development database.
- For ticket 03: the per-block `changes[].size` / `changes[].spacing` arrays are the signal for ticket 01's open question about a `dimension` that authored only one half (an empty array names the half that was absent per block, not per breakpoint), and a document that is warning-only appears in `documents` with `changed: 0` on every run, which is expected: the value is preserved and still needs a human.
- 2026-11-15 — Revised in ticket 03. The dry run against the development database confirmed ticket 01's open question and made it a defect: 23 stored Top bar versions authored a height and no padding, and `TOP_BAR_DEFAULT_SPACING` came back on a migrated box because the render falls back per surface while the pre-split `dimension` suppressed the whole default. The transform now writes both destinations for a legacy box (an empty `spacing: {}` or `size: {}` when the authored half kept no key), so a migrated box keeps its pre-split look; a props object that already carries `size` or `spacing` was saved by the new editor, keeps its own per-surface absence, and gains no empty sibling. `SizeSpacingMigrationChange` gained `emptyMarkers` so the report can name the marker without claiming one where nothing was written (`spacing (empty)` versus a destination left untouched), and an empty `dimension: {}` is now read as a (vacuous) responsive map instead of a warning that left the key behind.

