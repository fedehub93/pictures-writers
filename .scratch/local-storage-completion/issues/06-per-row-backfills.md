# 06: Backfills resolve the driver per Media

**What to build:** The metadata and rendition backfills run on a library that mixes remote legacy Media and local Media. Each row is read and written through the driver recorded on it, so one half of the library no longer fails because the command resolved a single driver for everything.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] On a fixture with one local and one legacy remote Media, the metadata backfill reads and writes each row through its recorded driver.
- [ ] On the same fixture, the rendition backfill produces and records renditions through each row's driver, and a legacy row keeps its provider addresses while a local row gets relative ones.
- [ ] A row whose recorded driver is not configured on this instance is reported and skipped without aborting the run.
- [ ] Dry-run writes nothing, and the exit code reflects failures.
- [ ] Tests cover the mixed run, the skipped row and the dry run.
