# 04: Writes go through the storage location

**What to build:** Upload, replace, permanent deletion, archive and the admin's reads all operate on the stored-file record, with the Media's own storage columns kept in step but no longer read. The admin sees no difference: the same library, the same actions, the same confirmations, the same machine-readable refusals.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] An upload writes the object and the record together: a refused or failed upload leaves neither a record nor bytes.
- [ ] Replace bumps the revision, changes the key, and cleans the previous revision through the driver recorded on the file.
- [ ] A replace whose cleanup fails still succeeds and reports the cleanup as skipped, never failing the replace.
- [ ] Permanent deletion removes each file's objects through the driver recorded on it and never resolves one driver for a whole batch.
- [ ] Deleting a selection that mixes drivers leaves no bytes on either driver and no orphaned row.
- [ ] An archived file keeps being served and keeps counting against the quota.
- [ ] The admin library, picker, archive view and bulk actions render and act exactly as before.
