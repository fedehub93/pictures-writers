# 13: [human] Deploy and backfill the location in production

**What to build:** The existing Installation runs the new model on its real data: the media branch (delivery route, volume, quota, audit) is in production if it is not already, then the one-time command creates a stored-file record for each of the 720 Media, recording each absolute provider address as its remote location. This is the gate that lets the code stop reading the Media's storage columns.

**Blocked by:** 02, 03, 04

**Status:** ready-for-human

- [ ] The media branch is deployed with its migrations and the persistent volume mounted at its documented root.
- [ ] The command creates one stored-file record per Media (725 at the 2026-11-20 measurement) and no duplicates.
- [ ] Each Media answers 200 on its canonical address.
- [ ] The audit is green, with zero unresolved files.
- [ ] A database dump taken afterwards restores into a scratch database with the records intact.
- [ ] The Installation's active driver is recorded explicitly, so the default change cannot move any of its files.

## Comments

**2026-11-20** — Prepared; the ticket stays open. Every box is a check on the production
Installation and none of them has been run from this session. The deploy branch
(`origin/master` at `b869e774`) still has no `src/app/media/[...path]/route.ts` and none of the
media migrations, so the first deploy is ahead of the gate; the media work lives on
`feature-local-media`.

Done in `edfa7ec2` (`docs(media): document the production location backfill gate`), with the
review fixes in `docs(media): tighten the backfill gate after review`:

- `docs/self-hosting/08-operations-runbook.md` §4bis.8 is the procedure for the whole gate:
  the explicit driver record before the deploy, the deploy with migrations and the volume,
  dry run + run + second run of `media:backfill-files` with the expected `720/720` and
  `0/720` reports, the SQL that proves the count, the recorded `remoteUrl` (and its two
  provider hosts) and the absence of duplicates, the canonical-address check over all 720, the
  audit gate, and the dump/restore drill. It also says what to do when the run reports a
  failure or the audit lists a file as `unknown-driver` — typically a legacy email attachment
  the migration recorded on `external`.
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
- All four §4bis.8 SQL statements (counts, provider hosts, restore check, saved setting) were
  run against the agent schema: they parse and return the documented column sets.

Now the rehearsal, which changes the expected numbers:

- **2026-11-20, rehearsal on a production dump.** The dump of 15:58 (8 MB, PG 18) was restored
  into a scratch database on the dev container and the whole gate was run there: 7 migrations
  pending before, 0 errors; `media:backfill-files` created 725 and reported `failed: []`; a second
  run reported `created: 0, skipped: 725`; the counts query returned `725 | 725 | 0 | 0 | 0 | 0`;
  the hosts query returned `ghhc7ejbae.ufs.sh=706, utfs.io=19`; `media:audit` exited 0 with
  `files: 726 drivers: uploadthing=726 unresolved: 0 bytes.accounted=387248558`.
- The library is **725 Media, not 720**: 706 with a three-segment key (`<mediaId>/<rev>/original`,
  addressed by customId) and 19 with a flat provider file key. The runbook's expected numbers were
  updated to the measurement; the checklist now asks for one record per Media, not for a literal
  720.
- There is **one legacy email attachment**, on `utfs.io` in `/f/<key>` form. The migration maps it
  to `uploadthing`, so this Installation has **no `external` row** and nothing to resolve by hand
  before the audit can be green.
- **`-- --dry-run` is not portable.** On Windows/PowerShell, `npm run media:backfill-files --
  --dry-run` reaches the script without the flag: the rehearsal's "preview" was a real run (the
  report said `dryRun: false`). It cost nothing — the run is the one the gate wanted and it is
  idempotent — but the runbook now uses `docker exec -it -e MEDIA_BACKFILL_DRY_RUN=1`, which is
  already the form of the other two backfills and works on every shell. Check `dryRun: true` in
  the preview's report.
- Not yet rehearsed: the 725 canonical addresses over HTTP (needs the app against the dump) and
  the dump/restore drill. Both stay in the production gate.

Still open, on production:

- deploy the branch with its migrations; the volume is already mounted at `/data/media` and
  `MEDIA_STORAGE_LOCAL_ROOT` is set there, per the progress note on
  `local-storage-completion/01`;
- set `MEDIA_STORAGE_DRIVER=uploadthing` before that deploy and confirm the resolved driver is
  `uploadthing` afterwards;
- run the backfill twice and record `scanned/created/skipped/failed` from both runs, then the
  count/`remoteUrl`/host query: a record without its provider address would still pass delivery
  through the Media fallback, so it is checked explicitly;
- check all 725 canonical addresses: a final `200` following the redirect is the criterion
  while the bytes are remote. The canonical address answers `302` to the recorded provider
  location until the re-home, so the checklist's "200" is read as "resolves to the bytes", not
  as "no hop";
- record the audit's `unresolved` line and the dump/restore row (`725 | 0 | 0` for count,
  linked Media and recorded address, plus the one attachment in `files`).
