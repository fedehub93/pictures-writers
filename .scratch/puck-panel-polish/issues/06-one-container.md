# 06: One container — Flex and Grid retire, and the documents follow

**What to build:** One layout block. Flex and Grid leave the registry, the
palette and the render config, and every stored document that still contains them
is rewritten first: the node's effective display mode is written into the
document, then its type becomes Container. The display comes first because the
surviving nodes carry no layout at all — their grid arrives through Public
defaultProps at render time — so a plain rename would turn a page of grids into a
column of blocks. The migration is a pure, idempotent transform plus a runner
that scans every version of every Page and Site region, reports what it would
change, and writes nothing in a dry run. The glossary gains Container, and the
operations runbook states the order: migration first, deploy after.

**Blocked by:** 04 — the palette has to be the categories before the blocks are
deleted, or the panel would offer a tile whose block is gone.

**Status:** ready-for-human

- [x] The transform fills the desktop display with the mode the node used to
      have when no rung declares one, leaves an authored display alone, sets the
      type to Container, and preserves every other prop including the children.
- [x] The runner scans drafts, current, live and history for Pages and Site
      regions, reports each changed version with the nodes it touched, keeps
      going after one failure, writes nothing in a dry run, and is idempotent.
- [x] A dry run and an applying command exist, matching the pair the existing
      document migration already publishes.
- [x] Tests cover: a node with no layout, a node whose desktop rung declares
      another display, a node nested in a zone, props preserved, and a second run
      reporting no changes.
- [x] The dry run against the development database reports the one Page version
      that holds the Grid nodes and nothing else.
- [ ] After the run, every page and every Site region renders exactly as it does
      today; checked by hand on the page that holds the grids.
- [x] The two blocks are gone with every reference: the type maps, the registry,
      the page and region palettes, the render config and its name tuple, the
      defaults map and the palette meta.
- [x] The outline says Container for every layout block, including one carried by
      a document saved before this change.
- [x] The tests that enumerated the three layout blocks are updated, not deleted,
      and a Container still renders from what those documents hold.
- [x] The operations runbook states that the migration runs before the deploy.
- [x] Typecheck, lint and the full test suite pass.

## Comments

**2026-11-16** — Landed in `acc17e85` (code) and `d82a8340` (ADR, glossary,
spec).

- Pure transform and runner in `src/puck/migrations/migrate-layout-blocks.ts` and
  `migrate-layout-block-documents.ts`; the npm pair is
  `puck:migrate-layout-blocks[:dry-run]`. Flex and Grid left the registry, the
  page and region palettes, the render config and its name tuple, the defaults
  map and the palette meta; the tests were updated rather than deleted, and a
  Container renders both retired modes from migrated documents.
- Dry run before the apply: `scanned: 51, changed: 1, unchanged: 50`; the only
  entry was page `about` v1 with 9 Grid nodes. The spec's 18 was the count at
  writing; the fixture moved, the shape did not. No Flex anywhere.
- Applying run: wrote that one version (page `about` v1, 9 nodes → Container,
  desktop display grid); `failed: []`. A second dry run reports `changed: 0`,
  so the run is idempotent against the real database.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings); `npm run test:run` 271 files / 2394 tests passed;
  `npm run check:doc-citations` 0 broken.
- Open: the by-hand render check on the `about` page has not been done. The
  migration was applied at the owner's request; this ticket stays open until
  that check confirms the page looks as it did.
