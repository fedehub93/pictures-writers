# 07: Read-only media audit

**What to build:** An operator can run one read-only command that proves the library is healthy after a driver change. It reports how many Media each driver wrote, which Media cannot be resolved through their recorded driver, how the bytes on the local volume compare with the bytes the database accounts for, and which recorded drivers are not configured on this instance. It exits non-zero when anything is unresolved, so it can gate a deployment. It prints Media ids and aggregates, never keys, addresses or content.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] The command reports rows per driver, unresolved Media ids, local disk bytes against accounted bytes, and unconfigured drivers.
- [x] It performs no writes.
- [x] It exits 0 when every Media resolves and non-zero otherwise.
- [x] Its output contains no storage keys, addresses or content.
- [x] A test with one healthy local row, one healthy legacy row and one missing object asserts the counts, the unresolved id and the exit code.

## Comments

**2026-11-19 — landed in `2a0f741c`.**

`npm run media:audit` (`scripts/audit-media.ts`) prints one report and sets the exit code. The work lives in `src/modules/media/server/media-audit.ts`: it reads every Media row, resolves the driver recorded on each one, and returns rows per driver (`local`, `uploadthing`, plus `unrecorded` for pre-seam rows and `unknown` for a name this build does not know), the unconfigured drivers it met, and one entry per unresolved Media with a machine-readable reason — `unknown-driver`, `driver-unconfigured`, `no-storage-key` or `object-missing`. Media ids and aggregates only; names, keys and addresses never enter the report.

Object health is checked on the local volume, which is the only place bytes can be inspected without fetching the provider: originals and rendition keys from local rows are matched against a walk of the media root, producing accounted/on-disk/missing/orphaned object counts and `localOnDisk` against `localAccounted` (both from the same `mediaUsageBytes` the quota uses). `bytes.accounted` still covers the whole library so the mixed state is visible. Remote rows are verified through their driver's configuration and key grammar only; a read-only command must not fetch 720 provider objects. Orphaned files are reported but do not fail the command — every Media still resolves — so the gate follows the ticket exactly. Nothing is written: the test re-reads the rows' `updatedAt` and the file list afterwards.

To keep the audit from building a provider client, the driver-name rule was extracted from `resolveMediaStorageDriver` into a pure `resolveMediaDriverName`; both now share it, and a failure carries the known driver name so the audit can tell "unconfigured" from "unknown" without re-deriving it. The `key ?? key-from-address` rule the backfills each carried moved to `mediaSourceKey` in `lib/url.ts` and is now used by the audit and both backfills.

Tests: `media-audit.test.ts` covers the ticket's fixture (one healthy local row with a rendition, one healthy legacy row, one local row whose object is absent) and asserts the driver counts, the unresolved id and reason, the byte and object arithmetic, exit code `1`, and that neither rows nor files changed; it also covers the no-unresolved case (exit `0`, orphaned file counted but not fatal), an unconfigured UploadThing, an unknown recorded driver, a row with no readable key, the id filter, and that names, keys and addresses never appear in the report or its formatted output. `url.test.ts` covers `mediaSourceKey`.

Review findings addressed: the exit-code policy moved from `scripts/lib/audit-cli.ts` into the module, removing a five-hop source-to-script import (`AGENTS.md` imports rule); driver-name resolution now returns the known name on failure, removing the re-derived fallback; the driver count uses a `StorageDriverName | "unrecorded" | "unknown"` union; the key rule is shared instead of copied a third time. Findings declined: the media map and runbook are not updated here because ticket 09 owns the documentation checklist; `mediaIds` stays because both backfills expose the same option for the same reason; the volume scan is not scoped to `INSTALLATION_SLUG` because the deployment is one Installation per instance with its own root; unconfigured drivers still fail the gate because the spec's resolution is the one replace, delete and the backfills use, and a legacy object that cannot be reached is not healthy for operations even while its absolute URL keeps serving. Remote object existence is not probed, as noted above.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (257 pre-existing warnings), `npm run check:doc-citations` 96 docs / 0 broken, `npm run test:run` 283 files / 2559 tests passed. `npm run media:audit` ran read-only against the agent database and exited 0. No browser probe: the change is one operator command and its tests. `build:agent` was not run: the diff touches neither routing, config nor Prisma.
