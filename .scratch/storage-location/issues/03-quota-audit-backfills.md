# 03: Quota, audit and backfills read the location

**What to build:** The three operations that sweep the whole library — the quota arithmetic, the read-only audit and both backfills — read the stored-file record instead of the Media's storage columns. The numbers and the report do not change; what changes is that one place answers "where are the bytes", so a later move cannot leave one of them behind.

**Blocked by:** 01, 02

**Status:** done

- [x] Quota counts an original's bytes plus the bytes its renditions account for, archived Media included, exactly as before.
- [x] The audit reports files per driver, unresolved files by id with a reason, configured drivers, and local bytes against accounted bytes.
- [x] The audit exits non-zero when anything is unresolved; orphaned files are reported but do not fail it.
- [x] Both backfills process a library that mixes drivers in one run, each file through its own recorded driver.
- [x] A file whose recorded driver is not configured here is reported and the run continues.
- [x] The report contains ids and aggregates, never keys, addresses or names.

## Comments

**2026-11-20**

Landed in `0709c4db` (`feat(media): read the stored-file location in quota, audit and backfills`).

- One resolver in `stored-file.ts` (`mediaStorageLocation`, `mediaStorageSize`) answers
  key, driver, content type, size and checksum from the record. The Media's own columns are read
  only for a row whose record does not exist yet; a field the record carries always wins, even
  when null, so quota and audit cannot disagree with it.
- The quota selects `storedFile.size` beside the rendition manifest and keeps the same arithmetic.
  A new test makes the record's size differ from `Media.size` and asserts the record wins.
- The audit is now stored-file based: it reads every `StoredFile` (including a role-less one),
  resolves the driver on the record, and reports `files`, `drivers[].files`, `configuredDrivers`,
  `unconfiguredDrivers`, unresolved files by `id`, accounted/local/on-disk bytes and object
  counts. The report moves from Media terms to file terms (`files`/`id`) so it can see an
  attachment or avatar later; the information is the same set. A Media without a record is
  reported as `no-stored-file`, so the audit fails until the one-time location backfill has run.
  The output keeps ids and aggregates only; the keys/addresses/names test still passes.
- Both backfills read the source key and driver from the record, and keep the record true where
  they write: the metadata run writes the content type, size and checksum it discovers; the
  rendition run moves the record's key, driver, provider address, content type, size and checksum
  with the delivered original. A mixed library is processed in one run; an unconfigured or unknown
  recorded driver is reported per row and the run continues.
- `resolveMediaStorageDriver` now returns the resolved driver name, so the rendition run records
  the driver it actually wrote through.
- `docs/media.md` and `GLOSSARY.md` describe the record as the answer and the audit in file terms.

Verification: `npm run test:run` — 284 files, 2579 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (257 pre-existing warnings); `npm run check:doc-citations` 0 broken.
