# 04: Writes go through the storage location

**What to build:** Upload, replace, permanent deletion, archive and the admin's reads all operate on the stored-file record, with the Media's own storage columns kept in step but no longer read. The admin sees no difference: the same library, the same actions, the same confirmations, the same machine-readable refusals.

**Blocked by:** 01

**Status:** done

- [x] An upload writes the object and the record together: a refused or failed upload leaves neither a record nor bytes.
- [x] Replace bumps the revision, changes the key, and cleans the previous revision through the driver recorded on the file.
- [x] A replace whose cleanup fails still succeeds and reports the cleanup as skipped, never failing the replace.
- [x] Permanent deletion removes each file's objects through the driver recorded on it and never resolves one driver for a whole batch.
- [x] Deleting a selection that mixes drivers leaves no bytes on either driver and no orphaned row.
- [x] An archived file keeps being served and keeps counting against the quota.
- [x] The admin library, picker, archive view and bulk actions render and act exactly as before.

## Comments

**2026-11-20**

Landed in `29504246` (`feat(media): write files through their stored location`).

- One resolver, `mediaCleanupTarget` in `media-service.ts`, answers where a file's objects are
  from its stored-file record: the recorded driver and key decide cleanup. A namespaced key is
  one prefix. A legacy key (flat or three-segment) is removed by its exact key *and* by every
  rendition key in its manifest, plus its pre-seam directory where it has one: a pre-seam
  original is a provider file key that a customId scan cannot find, while its renditions are
  separate objects under `<mediaId>/<revision>/`. Naming the manifest keys is what stops a
  deletion or replace from leaving the renditions behind, whatever the original's shape. A
  recordless row still falls back to the Media's columns until the one-time backfill runs.
- Replace reads the existing row with its record and cleans the superseded revision through the
  record's driver. Permanent deletion reads every selected row with its record and still
  resolves each row separately through a per-driver client cache; a mixed selection is cleaned
  on both drivers and the record cascades with the row.
- The admin library (`getMany`, so the picker too) now reads key, size, content type, checksum
  and driver from the record, through `mediaLibraryRowSelect`/`mediaLibraryItem` in
  `media/lib/media-library.ts`. `Media.url` stays the canonical address; a row whose record does
  not exist yet still reads its own columns, so the UI is unchanged before the one-time backfill.
  The returned item shape is unchanged: the joined record is not exposed.
- The shared location projection moved to `media/lib/stored-file-location.ts` so delivery, the
  backfills, the quota and the admin library share one select and one "record wins" resolver;
  `server/stored-file.ts` keeps only the writes and no longer re-exports the projection.
- Nothing about the upload path changed: it already writes the record in the Media's transaction
  and removes the revision on failure. Tests now assert the record is absent too, for a refused
  quota and for a processing failure.
- An actual cleanup failure reports `failed` (the existing vocabulary the replace modal renders
  as "could not be removed"); an unconfigured driver reports `skipped`. Neither fails the
  replace. This keeps the confirmation text the admin already sees, as the ticket requires.

Tests: replace cleanup follows the record when the Media's driver column is stale; a cleanup
failure still returns the new revision and reports it; deletion follows the record when the
Media's key and driver are stale; a legacy flat row loses its original and the rendition named
in its manifest; the mixed selection has records on both drivers; the admin read prefers the
record and falls back before it exists; refused uploads leave no record or bytes; an archived
file is still streamed from its record and is counted by the quota at the record's size.
`docs/media.md` and ADR-0026 record that writes read the location.

The admin surfaces were exercised through the router suite — the list (and therefore the picker's
data source), archive, restore and bulk delete — with the record-shaped row; their components are
untouched. No browser probe was run for this ticket.

Verification: `npm run test:run` — 284 files, 2587 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (257 pre-existing warnings); `npm run check:doc-citations` 96 docs /
0 broken.
