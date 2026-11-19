# 06: Backfills resolve the driver per Media

**What to build:** The metadata and rendition backfills run on a library that mixes remote legacy Media and local Media. Each row is read and written through the driver recorded on it, so one half of the library no longer fails because the command resolved a single driver for everything.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] On a fixture with one local and one legacy remote Media, the metadata backfill reads and writes each row through its recorded driver.
- [x] On the same fixture, the rendition backfill produces and records renditions through each row's driver, and a legacy row keeps its provider addresses while a local row gets relative ones.
- [x] A row whose recorded driver is not configured on this instance is reported and skipped without aborting the run.
- [x] Dry-run writes nothing, and the exit code reflects failures.
- [x] Tests cover the mixed run, the skipped row and the dry run.

## Comments

**2026-11-19 — landed in `708021a0`.**

Both backfills took one `driver` resolved from the environment, so the metadata job read every image through it and the rendition job read and wrote every image through it. They now take the active driver plus an environment (`active`, `env`) and call `resolveMediaStorageDriver` on each row's recorded driver, caching one client per driver for the run — the same resolver permanent deletion uses. A row with no recorded driver resolves as legacy UploadThing; a name this build does not know, or a driver whose credentials are absent here, becomes a `failed` entry with the resolver's reason and the run continues. The rendition job passes the resolved driver into `writeImageRevision`, its rollback and its source read, and computes the revision prefix with the installation slug taken from the injected environment, so a row is never written through the wrong driver.

The rendition dry run now resolves each pending row's driver before returning. It still reads no object and writes nothing, but an operator learns before the run which rows this instance cannot serve, and the preview's exit code is no longer vacuously zero. Both CLI scripts resolve the active driver through `resolveActiveStorageDriver` (setting, then environment) and set `process.exitCode` to `1` when the report lists any failure; `scripts/lib/backfill-cli.ts` owns that decision so it is testable without spawning the commands.

Tests: `backfill-media-metadata.test.ts` covers a mixed fixture whose two rows carry different dimensions and separate checksums, proving each was read from its own driver, plus the legacy `/assets/<key>` shape, the unconfigured and unknown driver entries with the healthy row still updated, and a dry run over both halves. `backfill-media-renditions.test.ts` covers the legacy remote row (provider addresses in the `?mt=` manifest, canonical relative original) and the local row (relative addresses), a mixed run that proves each half's objects exist only on its own driver, the unconfigured driver in a real run and in a dry run, idempotence on disk, archive/restore, concurrency and non-image rows. `scripts/lib/__tests__/backfill-cli.test.ts` covers the exit code. Both suites use the existing fake UploadThing client through `vi.mock("uploadthing/server")`, the seam the storage contract and deletion suites already use.

Review findings addressed: the redundant exit-code test was dropped; the rendition dry run gained real failure detection instead of a vacuous exit status; driver resolution moved inside the rendition worker's `try` so both modules contain failures the same way; the runbook and command appendix now say precisely what a preview can and cannot report. Findings declined: the per-run driver-cache map and failure block are duplicated across the two commands, but that is the shape permanent deletion already uses, and extracting a two-call-site resolver would be a middle man; the `vi.mock` scaffolding is duplicated in four media suites for the same reason (hoisting is per module). Passing the installation slug from the injected environment is new plumbing, but the rendition job writes namespaced keys and an injected env must not resolve a different prefix than the one it verifies.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (257 pre-existing warnings), `npm run check:doc-citations` 96 docs / 0 broken, `npm run test:run` 282 files / 2548 tests passed, `npm run build:agent` succeeded. No browser probe was run: the change is two operator commands and their tests.
