# 12: Removing the provider's copies

**What to build:** The owner can delete the copies a move left behind, and only those: the command acts on the record the move wrote, refuses while any file still points at that driver or the audit is not green, waits out a grace window, and demands a typed confirmation. It is never automatic, and it is the only irreversible step in the product's storage lifecycle.

**Blocked by:** 10

**Status:** done

- [x] The command refuses while any stored file still records that driver.
- [x] The command refuses while the audit is not green.
- [x] Objects younger than the grace window are left alone and reported as waiting.
- [x] The command requires a typed confirmation before deleting anything.
- [x] After a run the provider resolves none of the recorded objects, and the local files still serve.
- [x] A provider failure on one object is reported per object and the rest of the batch continues.
- [x] A second run finds nothing to delete and reports zero.

## Comments

**2026-11-20**

Landed in `6d478db8` (`feat(media): purge the provider copies a move recorded`).

- `purgeStorageObjects` in `src/modules/media/server/purge.ts` deletes only the journal entries
  for one driver. Before the first delete it refuses while any `StoredFile` records that driver,
  while the audit is not green, or while the instance has no credentials for the driver; the
  operator's typed confirmation is requested only after those guards pass. A local driver is
  refused outright, because a local object is removed by the operation that abandons it.
- The grace window is seven days by default (`DEFAULT_PURGE_GRACE_MS`); entries younger than it
  are counted and reported as waiting, never deleted. `--grace-days` changes the window for one
  run. With nothing eligible the command reports zero without a guard or a confirmation, so a
  rerun after the provider token is removed still succeeds.
- Each entry is re-read immediately before its delete: a newer move back onto the driver removes
  the entry in its flip, and that stale snapshot can never delete a live object. A provider
  failure is reported by journal entry (`delete-failed`) and the batch continues; an object the
  provider already lost is treated as removed (`StorageObjectNotFoundError`), so the entry goes
  too. A deleted object's entry is removed in the same step.
- `npm run media:purge` is the CLI. Without `--driver` it prints the journal grouped by driver
  (an empty journal exits zero; a populated one exits non-zero so the choice is explicit). The
  report carries journal entry ids and aggregates, never keys, addresses or a provider host.
  `pendingPurge` backs the same summary.
- Tests cover the move → purge → local-serves path on a temporary root and the fake provider,
  both refusals, the typed confirmation, the grace window, a per-object provider failure, a
  pre-seam flat key, a key revived by a newer move, an object already absent, the empty second
  run, the local refusal, an unconfigured driver, and the journal summary. `journal-failed` is a
  defensive branch with no test, because forcing the database write to fail would mock the seam.
- `docs/media.md`, ADR-0026 and the glossary's Purge and Purge journal entries record the command,
  its guards, the grace window, the confirmation and the one accepted casualty (already-sent
  email HTML).

Verification: `npm run test:run` — 293 files, 2664 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (247 pre-existing warnings); `npm run check:doc-citations` 97 docs /
0 broken; `npm run build:agent` succeeded. `npm run media:purge` (run against the agent database)
reported an empty journal and exited 0. No browser probe was run for this ticket.
