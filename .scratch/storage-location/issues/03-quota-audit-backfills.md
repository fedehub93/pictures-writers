# 03: Quota, audit and backfills read the location

**What to build:** The three operations that sweep the whole library — the quota arithmetic, the read-only audit and both backfills — read the stored-file record instead of the Media's storage columns. The numbers and the report do not change; what changes is that one place answers "where are the bytes", so a later move cannot leave one of them behind.

**Blocked by:** 01, 02

**Status:** ready-for-agent

- [ ] Quota counts an original's bytes plus the bytes its renditions account for, archived Media included, exactly as before.
- [ ] The audit reports files per driver, unresolved files by id with a reason, configured drivers, and local bytes against accounted bytes.
- [ ] The audit exits non-zero when anything is unresolved; orphaned files are reported but do not fail it.
- [ ] Both backfills process a library that mixes drivers in one run, each file through its own recorded driver.
- [ ] A file whose recorded driver is not configured here is reported and the run continues.
- [ ] The report contains ids and aggregates, never keys, addresses or names.
