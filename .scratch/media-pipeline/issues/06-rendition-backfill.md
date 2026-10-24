# 06: Off-peak rendition backfill for existing media

**What to build:** A manually run job that generates renditions for the 674 images already in the library, with bounded concurrency, a dry-run mode, a report of what it did and what it skipped, and idempotency so it can be re-run safely. Unreachable sources are reported and skipped without stopping the run. Until the job reaches an image, that image keeps being served as its original.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] The job generates missing renditions for every reachable image Media and reports each skipped source with a reason.
- [ ] Running the job twice produces no duplicate objects and no errors on already-processed Media.
- [ ] Concurrency is bounded so the job does not starve the database or the application on a 4 vCPU host.
- [ ] Dry-run lists the pending work without writing to storage or the database.
- [ ] After a completed run, historic images are delivered as renditions, and any image still pending falls back to its original.
- [ ] The operator documentation explains when and how to run the job, and how to read its report.
