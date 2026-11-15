# 02: Document migration

**What to build:** A one-off, idempotent utility converts every stored Puck document from the single `dimension` prop to the split `size` and `spacing` props. It covers all Page versions and all Site region versions, drafts and history alike, supports a dry run that writes nothing, and reports per document what it moved. It runs outside the request path and changes no database schema or API.

**Blocked by:** 01 (the prop names and the shape have to be final)

**Status:** ready-for-agent

- [ ] The pure transform moves the eight spacing keys of every `dimension` object into a sibling `spacing` object, writes the remainder as `size`, and deletes `dimension`.
- [ ] The transform is shape-based: it walks every object in the document and acts on any `props` object holding a `dimension` key, so the document root — which has props but no `type` — and blocks nested in slots and zones are all covered.
- [ ] A `dimension` value that does not look like a responsive map (breakpoint keys) is preserved and reported as a warning instead of being rewritten or thrown away.
- [ ] An object whose `dimension` holds no spacing key produces only `size`; no empty `spacing` object is written.
- [ ] Running the transform twice produces the same document as running it once, and a second run reports no changes.
- [ ] Unknown component types, unknown props and malformed component data are preserved or skipped without throwing, so one bad document cannot abort the run.
- [ ] The runner scans every `PageVersion` and every `SiteRegionVersion`, reports scanned, changed, unchanged, skipped and failed rows plus the fields moved per document, isolates per-row failures, and writes nothing in dry-run mode.
- [ ] The CLI entry point and the two npm scripts (`:dry-run` prints, the other writes) work against whichever `DATABASE_URL` is loaded.
- [ ] Tests cover: a representative page document, a document root without a `type`, blocks nested in slots and zones, an already-migrated document, a malformed or non-responsive value, idempotency, both tables, the per-document report, dry-run writing nothing, a successful write and failure isolation.
- [ ] No Prisma schema, tRPC procedure or publication change is introduced.
- [ ] `npm run lint`, `npm run typecheck` and the full test suite pass.

## Implementation notes

- `src/puck/migrations/` holds the pure transform and the `server-only` runner, with the CLI in `scripts/` — mirroring `src/modules/site-regions/lib/migrate-puck-data.ts`, `src/modules/site-regions/server/migrate-site-region-documents.ts` and `scripts/migrate-site-region-puck-data.ts`, whose report and dry-run shapes are worth reusing.
- The runner needs two loops, one per table, over every row rather than only the current and live versions: a document restored from history must already be in the new shape, and the database should hold one shape once the run is done.
- Do not add a fallback read in the render path. Absence of a value means "inherit from the wider breakpoint", so a fallback would resurrect a margin an author deleted. The migration is the compatibility layer.
- The transform is value-based: no Prisma schema, tRPC procedure or publication code changes.
