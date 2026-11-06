# 05: Document migration utility

**What to build:** A one-off, idempotent utility converts existing Site region documents from the old flat block props to the new nested `content` shapes, so development headers and footers saved before this work open in the editor without hand editing. The Top bar is excluded because its concept changed and is recreated instead. The utility runs outside the request path and changes no database schema or API.

**Blocked by:** 01, 02, 03, 04 (all new block shapes must exist first)

**Status:** done

- [x] The utility converts the old Brand, Search bar, NavbarBlock, Link list and Copyright flat props into their new nested `content` shapes.
- [x] Documents that already use the nested shapes are left unchanged.
- [x] Running the utility twice produces the same document as running it once.
- [x] Announcement bar entries are not converted; the document owner recreates the Top bar in the editor.
- [x] Unknown component types and malformed component props are preserved or skipped without throwing, so one bad document cannot abort the run.
- [x] The utility reports what it changed per document.
- [x] Tests cover each converted shape, idempotency, already-migrated documents and unknown or malformed data using representative fixtures.
- [x] No Prisma schema, tRPC procedure or Site region versioning change is introduced.
- [x] Type checking, targeted linting and the full test suite pass.

## Implementation notes

- `src/modules/site-regions/lib/migrate-puck-data.ts` is the pure transform. It clones the document, walks every object (so blocks inside slots and zones are covered), and moves the legacy flat props of Brand, SearchBar, NavbarBlock, LinkList and Copyright into `content`. It returns the migrated copy plus one change entry per converted block and warnings for unusable `content` values.
- A block with a nested `content` object is left alone when it no longer carries flat props, which makes the transform idempotent. Stale flat props left by a partial save are merged into `content`; a duplicate flat value is discarded and reported, with the nested value winning. Unknown component types are preserved, and the legacy `AnnouncementBar` block is reported as a warning so the owner can recreate it as a Top bar. Malformed component data is skipped and never throws.
- `src/modules/site-regions/server/migrate-site-region-documents.ts` runs the transform over every stored `SiteRegionVersion` outside the request path. It supports `--dry-run`, reports each changed version with the block fields it moved, records warnings separately, and catches per-document failures so one bad row cannot abort the run.
- `scripts/migrate-site-region-puck-data.ts` is the CLI entry point: `npm run site-regions:migrate-puck-data:dry-run` prints the report without writing, then `npm run site-regions:migrate-puck-data` applies it.
- The transform is value-based rather than schema-based: no Prisma schema, tRPC procedure or Site region versioning code changed.
- Tests: `migrate-puck-data.test.ts` covers each converted shape, blocks nested in slots and zones, idempotency, partial migrations, already-migrated documents, prototype-key component types, unknown component types (including the legacy `AnnouncementBar` block) and malformed component data. `migrate-site-region-documents.test.ts` covers the per-document report, dry-run not writing, successful writes, warning-only documents and failure isolation between documents.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, `npm run test:run` (225 files / 1871 tests) pass. `npm run site-regions:migrate-puck-data:dry-run` runs against the development database without writing.
