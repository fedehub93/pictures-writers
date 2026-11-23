# 17: The backfilled record carries the source checksum, not the stored one

**What to build:** `StoredFile.checksum` describes the bytes the record actually owns. Today a row processed by `npm run media:backfill-renditions` carries the checksum of the bytes it read as a source, while `size` and the object describe the normalised copy it wrote, so the two disagree for almost the whole library and every verifier that trusts the checksum refuses the file.

**Blocked by:** 13

**Status:** ready-for-agent

- [ ] A one-off command re-reads every remote file through its recorded driver and rewrites `checksum` (and `size`/`contentType` when they disagree) from the bytes it read.
- [ ] The command is idempotent, has a dry run, reports per driver and refuses nothing it can prove; a file whose bytes it cannot read is reported and left alone.
- [ ] `media:backfill-renditions` records the checksum of the bytes it writes, so a later backfill cannot produce the same disagreement.
- [ ] The re-home moves the library: no file ends in `checksum-mismatch`.
- [ ] The duplicate detector recognises a re-upload of a picture the library already holds (it matches by checksum).

## Comments

**2026-11-23 — measured on the dump of 2026-11-23 09:39 UTC**

`media:backfill-renditions` reads a source object, writes a normalised copy under the revision
prefix, and records `size: stored.size` with `checksum: checksumOf(sourceBytes)`
(`src/modules/media/server/backfill-media-renditions.ts:225-260`). The record therefore describes
two different objects.

Evidence: for 708 library originals with a checksum and a remote address, re-fetching the recorded
address gives the exact `size` but a different sha256 in **706** cases (2 match, 0 unreachable).
The one direct probe reproduces it: `size` = 1,297,428 = fetched length; stored checksum ≠ sha256
of the bytes served.

Consequences:

- **The re-home refuses those files.** `moveStoredFile` returns `checksum-mismatch` when
  `checksumOf(source)` differs from the record (`rehome.ts:403-406`), so a run on this library
  would move 2 files and fail the other 706.
- **Duplicate detection misses.** `findDuplicate` matches on `checksum`, so a re-upload of a
  picture the library holds is not recognised.
- **The address sweep is unaffected**, and the relink work of ticket 16 leans on the same column
  for the opposite reason: the content's objects are the sources, so their bytes hash to the
  stored checksum (452 of 460).
