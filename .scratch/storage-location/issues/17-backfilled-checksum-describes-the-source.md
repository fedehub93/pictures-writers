# 17: The backfilled record carries the source checksum, not the stored one

**What to build:** `StoredFile.checksum` describes the bytes the record actually owns. Today a row processed by `npm run media:backfill-renditions` carries the checksum of the bytes it read as a source, while `size` and the object describe the normalised copy it wrote, so the two disagree for almost the whole library and every verifier that trusts the checksum refuses the file.

**Blocked by:** 13, 16

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
  stored checksum (452 of 460). That makes ticket 16 come **before** this one: repairing the
  column first would erase the only record that ties a content object to its Media.

**2026-11-23 — the provider's key API no longer resolves the pre-seam keys; read the recorded address**

Measured while landing ticket 16 on the same dump. Ticket 16 is now `done` and its real run has
changed the development database to the state this ticket should start from: 465 content addresses
relinked and 4 Media adopted, 726 → 730 Stored files, `media:sweep-addresses:dry-run` at zero. Do
not restore the pre-16 dump for this ticket; `%TEMP%\pre-relink-16.dump` is only ticket 16's
rollback. The checksum column itself was **not** touched.

The finding that changes this ticket's read path: `driver.get(key)` through the UploadThing driver
now returns `StorageObjectNotFoundError` for the library's own pre-seam keys, with the token in
`.env`. It fails both for a flat provider key and for a namespaced `<mediaId>/<revision>/<file>`
key, because `getFileUrls` resolves neither. The bytes are still served: the `remoteUrl` the record
carries answers `200` with the identical length, as the earlier probe measured. This is the same
address delivery redirects to, and the relink of ticket 16 now fetches objects from the address
(falling back to the same key on the current provider host) rather than from the API.

So a literal "re-read every remote file through its recorded driver" would report most of the
library unreadable on this dump and repair nothing. The command should read a remote file's
recorded `remoteUrl` first — the address that actually serves the bytes — and use the driver's
`get` only as the fallback, while keeping the per-driver report so a genuinely unreachable file is
still named. Two related consequences:

- the re-home (ticket 15) reads `source.get(file.key)` in `moveStoredFile`; with this token it
  would refuse every pre-seam file as `unreadable`, so the same address-first rule may belong
  there before the move is attempted;
- the four Media ticket 16 adopted may record the older `/a/<appId>/<fileKey>` address shape, so
  the read path must not assume `/f/<key>`; `storageKeyFromMediaUrl` now parses both.

This is a property of the token/API on this instance, not necessarily of production; confirm it
with one `driver.get` on the target before deciding whether the fallback is a workaround or the
contract.
