# 10: Re-home

**What to build:** The owner can move every file to the active driver from the library, and the move never changes an address, a key or a revision. Files are copied, verified against their checksum, then flipped; an interrupted run resumes; a file that cannot be read is reported and keeps serving from where it is; a newer switch supersedes the run. Before starting, the product warns when the disk cannot hold both copies, and the UI shows progress with a stop that is always safe. Every abandoned provider object is recorded for a later removal.

**Blocked by:** 02, 04

**Status:** done

- [x] After a run, every stored file sits on the target driver and no key, revision or canonical address changed.
- [x] An interrupted run resumes without recopying files it already verified.
- [x] A file the source cannot read is reported by id and still serves from its current driver.
- [x] A driver change during a run supersedes it, and the next run converges on the newest target.
- [x] A run that would exhaust the disk warns and requires confirmation, and refuses when it is clearly impossible.
- [x] The run records every abandoned object for the purge, including a legacy object whose key is not namespaced.
- [x] The library shows how many files remain on another driver, offers the move, shows progress and can stop.
- [x] No failure in a move ever breaks an address.

## Comments

**2026-11-20**

Landed in `1006904d` (`feat(media): re-home every stored file without changing an address`).

- The job is `rehomeStoredFiles` in `src/modules/media/server/rehome.ts`. It recomputes its goal
  from the database at every start, copies one file at a time (a Media's original plus every
  rendition in its manifest, an attachment or avatar its one object), verifies the source against
  the record's checksum (a rendition against its recorded size), reads the copy back from the
  target and compares the bytes, then flips `driver`/`remoteUrl` and rewrites the Media's `?mt=`
  token in one transaction. Keys, revisions and the original's canonical address never change.
  A failure before the flip deletes the target copy; a local source is deleted after the flip.
- A Media whose stored address is still a provider URL is refused with `address-not-canonical`
  and left serving: moving it would journal the provider object while published pages still link
  to it. The address sweep (ticket 11) is the documented prerequisite.
- Resume, supersede and stop are all per-file boundaries. A newer driver choice is read from the
  setting before each file; `stop` aborts through an `AbortController` and finishes the file in
  flight. The runner (`src/modules/media/server/rehome-runner.ts`) holds the one in-memory run,
  because the deployment is single-instance by design. A run that moved anything calls
  `revalidateContent("all")` once: the rendition addresses inside `?mt=` changed even though the
  original's address did not.
- The preflight (`planRehome` in `src/modules/media/lib/rehome.ts`) copies the accounted bytes
  plus 10% headroom. The copies fitting but not the headroom, or a file with no recorded size,
  needs confirmation; the copies not fitting is refused. The mutation recomputes it, so a
  changed disk or driver is enforced at start, not just drawn in the dialog.
- `StoragePurgeEntry` (new table, additive migration) records every abandoned provider object by
  driver, exact key and size. A key abandoned twice takes the newer stamp; a key made live again
  on a driver has its entry removed in the same flip. The move never deletes a provider object.
- The media header shows the pending count (from `getMeta`), offers the move with the preflight,
  polls progress and offers Stop; failures are listed by id. `getMeta` now does one extra read of
  the pending files.
- `npm run media:rehome` runs the same job for an operator and requires `--yes` for a warning
  plan. It is beyond the ticket's "from the library" wording, but the spec's step 2 for the
  existing Installation needs a command that an operator can run off-peak.
- Failure ids are reported in the run's state and the CLI report, not persisted: the audit stays
  read-only over provider objects by design, so a redeploy loses the failure list while the file
  keeps serving and the next run reports it again.

Tests: the move end to end on a temporary local root and the fake provider — keys, revisions and
canonical addresses unchanged, renditions and the `?mt=` token rewritten, journal entries
including a flat legacy key, copy read-back corruption refused, address-not-canonical refused,
resume without a second copy, unreadable file reported and still delivered, supersede and
converge, stop at a boundary, the disk warning/refusal, the unknown-size warning, the move back
to a provider with local copies removed and no journal entries, and an attachment with no Media
role. The pure plan and the runner's progress/stop/confirmation states have their own suites; the
router suite covers the pending count, the plan and the idle status.

Verification: `npm run test:run` — 290 files, 2640 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (247 pre-existing warnings); `npm run check:doc-citations` 97 docs / 0
broken; `npm run build:agent` succeeded. No browser probe was run for this ticket.

`docs/media.md`, ADR-0026 and the glossary's Re-home and Purge journal entries record the move,
the preflight, the canonical-address prerequisite, the journal and the transition wording.

