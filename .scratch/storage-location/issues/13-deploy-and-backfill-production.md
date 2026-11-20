# 13: [human] Deploy and backfill the location in production

**What to build:** The existing Installation runs the new model on its real data: the media branch (delivery route, volume, quota, audit) is in production if it is not already, then the one-time command creates a stored-file record for each of the 720 Media, recording each absolute provider address as its remote location. This is the gate that lets the code stop reading the Media's storage columns.

**Blocked by:** 02, 03, 04

**Status:** ready-for-human

- [ ] The media branch is deployed with its migrations and the persistent volume mounted at its documented root.
- [ ] The command creates 720 stored-file records and no duplicates.
- [ ] Each of the 720 answers 200 on its canonical address.
- [ ] The audit is green, with zero unresolved files.
- [ ] A database dump taken afterwards restores into a scratch database with the records intact.
- [ ] The Installation's active driver is recorded explicitly, so the default change cannot move any of its files.

## Comments

**2026-11-20** — Prepared; the ticket stays open. Every box is a check on the production
Installation and none of them has been run from this session. The deploy branch
(`origin/master` at `b869e774`) still has no `src/app/media/[...path]/route.ts` and none of the
media migrations, so the first deploy is ahead of the gate; the media work lives on
`feature-local-media`.

Done in `edfa7ec2` (`docs(media): document the production location backfill gate`):

- `docs/self-hosting/08-operations-runbook.md` §4bis.8 is the procedure for the whole gate:
  the explicit driver record before the deploy, the deploy with migrations and the volume,
  dry run + run + second run of `media:backfill-files` with the expected `720/720` and
  `0/720` reports, the SQL that proves the count and the absence of duplicates, the
  canonical-address check over all 720, the audit gate, and the dump/restore drill. It also
  says what to do when the run reports a failure or the audit names an `external` legacy
  attachment.
- §4bis.6 now documents the audit as the stored-file report it is (`files`, `drivers`,
  `configured drivers`, `no-stored-file`) instead of the old Media-shaped sample, and states
  that a red audit before this backfill is expected, not a fault.
- `docs/self-hosting/07-test-e-verifica.md` lists the two runs and the post-backfill audit;
  `docs/media.md` points at §4bis.8.

Verified here, on this branch:

- `npm run test:run` — 293 files, 2664 tests passed; `npm run typecheck` clean;
  `npm run check:doc-citations` 97 docs / 0 broken.
- The two suites that own the command pass (18 tests): the same record is created for an
  absolute provider address and a local one, a second run reports `created: 0` and one record
  per Media, an unreadable key is reported and skipped, no Media row changes, a dry run writes
  nothing.
- `npm run media:backfill-files -- --dry-run` and `npm run media:audit` were executed against
  the agent database: the documented invocation prints the documented report shape (the library
  there is empty, so `scanned: 0`), and the §4bis.6 output format is the command's real one.
- The §4bis.8 count/duplicate query was run against the agent schema; it returns the expected
  five-column row.

Still open, on production:

- deploy the branch with its migrations; the volume is already mounted at `/data/media` and
  `MEDIA_STORAGE_LOCAL_ROOT` is set there, per the progress note on
  `local-storage-completion/01`;
- set `MEDIA_STORAGE_DRIVER=uploadthing` before that deploy and confirm the resolved driver is
  `uploadthing` afterwards;
- run the backfill twice and record `scanned/created/skipped/failed` from both runs;
- check all 720 canonical addresses: a final `200` following the redirect is the criterion
  while the bytes are remote. The canonical address answers `302` to the recorded provider
  location until the re-home, so the checklist's "200" is read as "resolves to the bytes", not
  as "no hop";
- record the audit's `unresolved` line and the dump/restore count of `"StoredFile"`.
