# 01: A stored file record exists for every file

**What to build:** Every file the Installation owns gets one record of where its bytes are. New uploads create it alongside the Media they produce; the 720 Media already in the library get theirs from a one-time command that reads what the library already knows. The Media keeps working exactly as before, so a visitor and an admin see no difference. From here on, "where are the bytes of this file" has one answer in one place.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A new upload creates one stored-file record carrying its storage key, driver, content type, size and checksum.
- [x] The one-time command creates exactly one record per existing Media, and running it twice creates no duplicate.
- [x] For an existing Media whose address is absolute, the record carries that address as its remote location; a local one carries none.
- [x] A Media with no readable storage key is reported by the command and skipped, never silently lost.
- [x] The library, delivery, quota and audit behave exactly as before the change.
- [x] The command is read-only in the sense that it changes no existing Media row.

## Comments

**2026-11-19**

Landed in `90cf39ef` (`feat(media): record the location of every stored file`) and
`7beb6f80` (`fix(media): keep the stored-file record true across uploads and replaces`).

- Added `StoredFile` with a unique key, driver, nullable `remoteUrl`, content type, size,
  checksum, kind, origin and a one-to-one link to `Media`. The migration adds only the new
  table and types, so it is backwards compatible with the running container.
- Every upload path now records the location in the same transaction as its Media: multipart
  images, multipart non-images, and the legacy provider JSON branch. A legacy upload whose
  address names no key is refused rather than creating a Media nothing can find.
- Replace updates the record to the new revision inside the same transaction, so the record
  never names bytes that cleanup has removed.
- `npm run media:backfill-files` creates the record from the Media's key, driver, size, type
  and checksum; an absolute address, or the legacy `/assets/<key>` rewrite, becomes
  `remoteUrl`; a local address leaves it null. It is idempotent, reports unreadable keys and
  key collisions per Media, supports `--dry-run`, and never writes a Media row.
- Shared helpers now hold the unrecorded-driver rule (`recordedStorageDriverName`) and the
  remote-address rule (`remoteUrlForAddress`), so the upload and backfill paths agree.
- Glossary gains Stored file, Storage location and Re-home; `docs/media.md` maps the new
  module and command.

Verification: `npm run test:run` — 284 files, 2569 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (257 pre-existing warnings); `npm run check:doc-citations` 0 broken.

